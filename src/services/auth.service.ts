/**
 * Brain AI - Authentication Service
 * Handles user registration, login, JWT session verification, token lifetime,
 * and persistent session maintenance based on backend access_token.
 */

import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types'
import { STORAGE_KEYS } from '../constants/app.constants'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const AUTH_STATE_EVENT = 'brain_ai_auth_state_changed'

export interface JwtPayload {
  sub?: string
  exp?: number
  iat?: number
  [key: string]: unknown
}

/**
 * Decodes base64url-encoded JWT token payload
 */
export function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload) as JwtPayload
  } catch (err) {
    console.warn('[authService] Failed to parse JWT payload:', err)
    return null
  }
}

/**
 * Checks whether an access_token is present and unexpired.
 * Includes a 5-second buffer to prevent edge-case race conditions.
 */
export function isTokenValid(token: string | null): boolean {
  if (!token || typeof token !== 'string') return false
  const payload = parseJwt(token)
  if (!payload || !payload.exp) return false
  const nowInSeconds = Math.floor(Date.now() / 1000)
  return payload.exp > nowInSeconds + 5
}

/**
 * Calculates remaining lifetime of access_token in milliseconds.
 * Returns 0 if expired or invalid.
 */
export function getTokenRemainingTime(token: string | null): number {
  if (!token) return 0
  const payload = parseJwt(token)
  if (!payload || !payload.exp) return 0
  const nowMs = Date.now()
  const expMs = payload.exp * 1000
  return Math.max(0, expMs - nowMs)
}

/**
 * Dispatches an event when authentication state changes.
 */
export function dispatchAuthStateChange(user: User | null): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_STATE_EVENT, { detail: { user } }))
    }
  } catch {
    // Non-browser or SSR fallback
  }
}

export const authService = {
  parseJwt,
  isTokenValid,
  getTokenRemainingTime,

  /**
   * Retrieves the stored auth token from localStorage or sessionStorage.
   * Automatically validates token expiration.
   */
  getToken(): string | null {
    try {
      const token =
        localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
        sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)

      if (!token) return null

      // Check if access_token has expired
      if (!isTokenValid(token)) {
        console.warn('[authService] Stored access_token has expired. Clearing session.')
        this.logout()
        return null
      }

      return token
    } catch (err) {
      console.warn('[authService] Error retrieving auth token:', err)
      return null
    }
  },

  /**
   * Stores or removes auth token in localStorage or sessionStorage
   */
  setToken(token: string | null, remember = true): void {
    try {
      if (token) {
        if (remember) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
          sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        } else {
          sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        }
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      }
    } catch (err) {
      console.warn('[authService] Error storing auth token:', err)
    }
  },

  /**
   * Returns the real user_id of the currently authenticated user.
   * Priority: JWT payload 'sub' -> User object user_id -> User object id
   */
  getUserId(): string | null {
    const token = this.getToken()
    if (token) {
      const payload = parseJwt(token)
      if (payload?.sub) {
        return String(payload.sub)
      }
    }
    const user = this.getCurrentUser()
    if (user?.user_id) return String(user.user_id)
    if (user?.id && !user.id.startsWith('usr_guest')) return String(user.id)
    return null
  },

  /**
   * Retrieves the currently authenticated user based on a valid access_token.
   */
  getCurrentUser(): User | null {
    try {
      const token = this.getToken()
      if (!token || !isTokenValid(token)) {
        return null
      }

      const stored =
        localStorage.getItem(STORAGE_KEYS.AUTH_USER) ||
        sessionStorage.getItem(STORAGE_KEYS.AUTH_USER)

      const payload = parseJwt(token)
      const tokenUserId = payload?.sub ? String(payload.sub) : undefined

      if (stored) {
        const user = JSON.parse(stored) as User
        // Guarantee real user_id from token sub
        if (tokenUserId) {
          user.id = tokenUserId
          user.user_id = tokenUserId
        } else if (user.user_id) {
          user.id = String(user.user_id)
        }
        user.token = token
        return user
      }

      // If user object is missing but token is valid, restore minimal user from JWT claims
      if (tokenUserId) {
        const fallbackUser: User = {
          id: tokenUserId,
          user_id: tokenUserId,
          name: 'User',
          email: '',
          role: 'user',
          token,
        }
        return fallbackUser
      }
    } catch (err) {
      console.warn('[authService] Error retrieving current user:', err)
    }
    return null
  },

  /**
   * Store or clear the current user in local/session storage
   */
  setCurrentUser(user: User | null, remember = true): void {
    try {
      if (user) {
        const payload = JSON.stringify(user)
        if (remember) {
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, payload)
          sessionStorage.removeItem(STORAGE_KEYS.AUTH_USER)
        } else {
          sessionStorage.setItem(STORAGE_KEYS.AUTH_USER, payload)
          localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
        }
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_USER)
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      }
    } catch (err) {
      console.warn('[authService] Error saving current user:', err)
    }
  },

  /**
   * Update current user profile properties (e.g. avatar, name) and dispatch state change
   */
  updateCurrentUser(updates: Partial<User>): User | null {
    try {
      const current = this.getCurrentUser()
      if (!current) return null
      const updated: User = { ...current, ...updates }
      const inLocal = localStorage.getItem(STORAGE_KEYS.AUTH_USER) !== null
      this.setCurrentUser(updated, inLocal)
      dispatchAuthStateChange(updated)
      return updated
    } catch (err) {
      console.warn('[authService] Error updating user:', err)
      return null
    }
  },

  /**
   * Check if onboarding has been completed
   */
  hasCompletedOnboarding(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN) === 'true'
  },

  /**
   * Mark onboarding as completed
   */
  setOnboardingCompleted(completed = true): void {
    if (completed) {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true')
    } else {
      localStorage.removeItem(STORAGE_KEYS.ONBOARDING_SEEN)
    }
  },

  /**
   * Subscribe to authentication state changes (login, logout, token expiry)
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<{ user: User | null }>
      callback(customEvent.detail?.user ?? null)
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.AUTH_TOKEN || e.key === STORAGE_KEYS.AUTH_USER) {
        callback(this.getCurrentUser())
      }
    }

    window.addEventListener(AUTH_STATE_EVENT, handleCustom)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(AUTH_STATE_EVENT, handleCustom)
      window.removeEventListener('storage', handleStorage)
    }
  },

  /**
   * Login user with email and password via backend API.
   * Extracts real user_id and access_token, maintaining persistent session.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password, rememberMe = true } = credentials

    if (!email || !email.trim()) {
      return { success: false, error: 'Email address is required.' }
    }
    if (!password) {
      return { success: false, error: 'Password is required.' }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Extract token from top-level or user object
        const rawToken =
          data.user?.access_token ||
          data.access_token ||
          data.token ||
          data.user?.token ||
          ''

        // Extract real user_id from database response or JWT sub
        const jwtPayload = rawToken ? parseJwt(rawToken) : null
        const realUserId = String(
          data.user?.user_id ||
          jwtPayload?.sub ||
          data.user?.id ||
          data.user?._id ||
          ''
        )

        const user: User = {
          id: realUserId || 'usr_' + Date.now(),
          user_id: realUserId || undefined,
          name: data.user?.name || email.trim().split('@')[0],
          email: data.user?.email || email.trim(),
          role: data.user?.role || 'user',
          token: rawToken || undefined,
        }

        if (rawToken) {
          this.setToken(rawToken, rememberMe)
        }
        this.setCurrentUser(user, rememberMe)
        dispatchAuthStateChange(user)

        return {
          success: true,
          message: data.message || 'Login successful',
          user,
          token: rawToken,
          access_token: rawToken,
        }
      } else {
        const errData = await response.json().catch(() => null)
        let errorMsg = 'Invalid email or password.'
        if (typeof errData?.detail === 'string') {
          errorMsg = errData.detail
        } else if (Array.isArray(errData?.detail) && errData.detail[0]?.msg) {
          errorMsg = errData.detail[0].msg
        } else if (typeof errData?.message === 'string') {
          errorMsg = errData.message
        }
        return {
          success: false,
          error: errorMsg,
        }
      }
    } catch {
      return {
        success: false,
        error: 'Unable to connect to the authentication service. Please check your network and backend server.',
      }
    }
  },

  /**
   * Register new user with Name, Email, and Password via backend API.
   * Extracts real user_id and access_token, maintaining persistent session.
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { name, email, password, passwordConfirm } = credentials

    // Client-side validations
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Please enter your full name (at least 2 characters).' }
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return { success: false, error: 'Please provide a valid email address.' }
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' }
    }
    if (passwordConfirm !== undefined && password !== passwordConfirm) {
      return { success: false, error: 'Passwords do not match.' }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        const rawToken =
          data.user?.access_token ||
          data.access_token ||
          data.token ||
          data.user?.token ||
          ''

        const jwtPayload = rawToken ? parseJwt(rawToken) : null
        const realUserId = String(
          data.user?.user_id ||
          jwtPayload?.sub ||
          data.user?.id ||
          data.user?._id ||
          ''
        )

        const user: User = {
          id: realUserId || 'usr_' + Date.now(),
          user_id: realUserId || undefined,
          name: data.user?.name || name.trim(),
          email: data.user?.email || email.trim().toLowerCase(),
          role: data.user?.role || 'user',
          token: rawToken || undefined,
        }

        if (rawToken) {
          this.setToken(rawToken, true)
        }
        this.setCurrentUser(user, true)
        dispatchAuthStateChange(user)

        return {
          success: true,
          message: data.message || 'Account created successfully!',
          user,
          token: rawToken,
          access_token: rawToken,
        }
      } else {
        const errData = await response.json().catch(() => null)
        let errorMsg = 'Failed to create account.'
        if (typeof errData?.detail === 'string') {
          errorMsg = errData.detail
        } else if (Array.isArray(errData?.detail) && errData.detail[0]?.msg) {
          errorMsg = errData.detail[0].msg
        } else if (typeof errData?.message === 'string') {
          errorMsg = errData.message
        }
        return {
          success: false,
          error: errorMsg,
        }
      }
    } catch {
      return {
        success: false,
        error: 'Unable to connect to the registration service. Please check your network and backend server.',
      }
    }
  },

  /**
   * Log out user and terminate session
   */
  logout(): void {
    this.setCurrentUser(null)
    this.setToken(null)
    dispatchAuthStateChange(null)
  },
}

export default authService
