/**
 * Brain AI - Authentication Service
 * Handles user registration, login, JWT session verification, token lifetime,
 * and persistent session maintenance based on backend access_token.
 * Integrates directly with dataManager as the single source of truth.
 */

import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types'
import { STORAGE_KEYS } from '../constants/app.constants'
import {
  dataManager,
  parseJwt,
  isTokenValid,
  getTokenRemainingTime,
  dispatchAuthStateChange,
  onAuthStateChange,
  type JwtPayload,
} from '../utils/dataManager'

const API_BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  '/api'
).replace(/\/$/, '')

export { parseJwt, isTokenValid, getTokenRemainingTime, dispatchAuthStateChange, type JwtPayload }

export const authService = {
  parseJwt,
  isTokenValid,
  getTokenRemainingTime,
  dispatchAuthStateChange,

  /**
   * Retrieves the stored auth token from dataManager.
   */
  getToken(): string | null {
    return dataManager.getToken()
  },

  /**
   * Stores or removes auth token in dataManager
   */
  setToken(token: string | null, remember = true): void {
    dataManager.setToken(token, remember)
  },

  /**
   * Returns the real user_id of the currently authenticated user.
   */
  getUserId(): string | null {
    return dataManager.getUserId()
  },

  /**
   * Retrieves the currently authenticated user based on a valid access_token.
   */
  getCurrentUser(): User | null {
    return dataManager.getUserData()
  },

  /**
   * Store or clear the current user in local/session storage
   */
  setCurrentUser(user: User | null, remember = true): void {
    dataManager.setUserData(user, remember)
  },

  /**
   * Update current user profile properties and dispatch state change
   */
  updateCurrentUser(updates: Partial<User>): User | null {
    return dataManager.updateUserData(updates)
  },

  /**
   * Check if onboarding has been completed
   */
  hasCompletedOnboarding(): boolean {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN) === 'true'
  },

  /**
   * Mark onboarding as completed
   */
  setOnboardingCompleted(completed = true): void {
    if (typeof window === 'undefined') return
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
    return onAuthStateChange(callback)
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
          dataManager.setToken(rawToken, rememberMe)
        }
        dataManager.setUserData(user, rememberMe)

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
          dataManager.setToken(rawToken, true)
        }
        dataManager.setUserData(user, true)

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
    dataManager.clearAll()
  },
}

export default authService
