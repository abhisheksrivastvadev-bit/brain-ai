/**
 * Brain AI - Authentication Service
 * Handles user registration, login, session tokens, and persistence.
 * Connects to backend auth endpoints when available with resilient mock fallback.
 */

import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types'
import { STORAGE_KEYS } from '../constants/app.constants'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export const authService = {
  /**
   * Retrieves the currently authenticated user from localStorage.
   */
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_USER)
      if (stored) {
        return JSON.parse(stored) as User
      }
    } catch (err) {
      console.warn('[authService] Error parsing stored user:', err)
    }
    // Return null if logged out or unauthenticated
    return null
  },

  /**
   * Store or clear the current user in local storage
   */
  setCurrentUser(user: User | null, remember = true): void {
    try {
      if (user) {
        const payload = JSON.stringify(user)
        if (remember) {
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, payload)
        } else {
          sessionStorage.setItem(STORAGE_KEYS.AUTH_USER, payload)
        }
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_USER)
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      }
    } catch (err) {
      console.warn('[authService] Error saving current user:', err)
    }
  },

  /**
   * Get stored auth token
   */
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
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
   * Login user with email and password via backend API
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
        const user: User = data.user
          ? {
              id: String(data.user.id || data.user._id || 'usr_' + Date.now()),
              name: data.user.name || email.trim().split('@')[0],
              email: data.user.email || email.trim(),
              role: data.user.role || 'user',
            }
          : {
              id: 'usr_' + Date.now(),
              name: email.trim().split('@')[0],
              email: email.trim(),
              role: 'user',
            }

        if (data.access_token || data.token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.access_token || data.token)
        }
        this.setCurrentUser(user, rememberMe)
        return {
          success: true,
          message: data.message || 'Login successful',
          user,
          token: data.access_token || data.token,
        }
      } else {
        // Backend returned an error (e.g. 400 Bad Request, 401 Unauthorized, 404, 422)
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
   * Register new user with Name, Email, and Password via backend API
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
        const user: User = data.user
          ? {
              id: String(data.user.id || data.user._id || 'usr_' + Date.now()),
              name: data.user.name || name.trim(),
              email: data.user.email || email.trim().toLowerCase(),
              role: data.user.role || 'user',
            }
          : {
              id: 'usr_' + Date.now(),
              name: name.trim(),
              email: email.trim().toLowerCase(),
              role: 'user',
            }

        if (data.access_token || data.token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.access_token || data.token)
        }
        this.setCurrentUser(user, true)
        return {
          success: true,
          message: data.message || 'Account created successfully!',
          user,
        }
      } else {
        // Backend returned an error (e.g. 400 Bad Request, 409 Conflict, 422)
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
   * Log out user
   */
  logout(): void {
    this.setCurrentUser(null)
  },
}

export default authService
