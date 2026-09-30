/**
 * Brain AI - Data Manager
 * Centralized, reusable data access and session manager.
 * Provides unified helpers for tokens, user authentication data,
 * session IDs, chat sessions, and local/session storage across the entire application.
 */

import type { User, AppSettings } from '../types'
import { STORAGE_KEYS } from '../constants/app.constants'

export interface JwtPayload {
  sub?: string | number
  exp?: number
  iat?: number
  email?: string
  name?: string
  role?: string
  [key: string]: unknown
}

const AUTH_STATE_EVENT = 'brain_ai_auth_state_changed'

/**
 * Safe accessor for Web Storage API supporting both browser and SSR/test environments
 */
function getStorage(): { local: Storage; session: Storage } | null {
  if (typeof window !== 'undefined' && window.localStorage && window.sessionStorage) {
    return {
      local: window.localStorage,
      session: window.sessionStorage,
    }
  }
  if (typeof localStorage !== 'undefined' && typeof sessionStorage !== 'undefined') {
    return {
      local: localStorage,
      session: sessionStorage,
    }
  }
  return null
}

/**
 * Decodes a base64url-encoded JWT token payload
 */
export function parseJwt(token?: string | null): JwtPayload | null {
  if (!token || typeof token !== 'string') return null
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
    console.warn('[dataManager.parseJwt] Error parsing JWT:', err)
    return null
  }
}

/**
 * Checks if a JWT token is structurally valid and not expired.
 * Includes a 5-second buffer to protect against clock drift or race conditions.
 */
export function isTokenValid(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false
  const payload = parseJwt(token)
  if (!payload || !payload.exp) return false
  const nowInSeconds = Math.floor(Date.now() / 1000)
  return payload.exp > nowInSeconds + 5
}

/**
 * Calculates remaining lifetime of access_token in milliseconds.
 * Returns 0 if expired, invalid, or missing.
 */
export function getTokenRemainingTime(token?: string | null): number {
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

/**
 * Subscribes to authentication state changes across components and storage tabs.
 * Returns an unsubscribe cleanup function.
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleCustom = (e: Event) => {
    const customEvent = e as CustomEvent<{ user: User | null }>
    callback(customEvent.detail?.user ?? null)
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.AUTH_TOKEN || e.key === STORAGE_KEYS.AUTH_USER) {
      callback(getUserData())
    }
  }

  window.addEventListener(AUTH_STATE_EVENT, handleCustom)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(AUTH_STATE_EVENT, handleCustom)
    window.removeEventListener('storage', handleStorage)
  }
}

/**
 * Retrieves the stored auth token from localStorage or sessionStorage.
 * Automatically validates token expiration; if expired, clears the session.
 */
export function getToken(): string | null {
  try {
    const storage = getStorage()
    if (!storage) return null

    const token =
      storage.local.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
      storage.session.getItem(STORAGE_KEYS.AUTH_TOKEN)

    if (!token) return null

    // Check expiration
    if (!isTokenValid(token)) {
      console.warn('[dataManager] Stored token has expired. Clearing session.')
      removeToken()
      removeUserData()
      dispatchAuthStateChange(null)
      return null
    }

    return token
  } catch (err) {
    console.warn('[dataManager.getToken] Error reading token:', err)
    return null
  }
}

/**
 * Stores or clears auth token in localStorage or sessionStorage.
 * @param token - The JWT string or null to remove
 * @param remember - If true, saves in localStorage (persistent); otherwise sessionStorage
 */
export function setToken(token: string | null, remember = true): void {
  try {
    const storage = getStorage()
    if (!storage) return

    if (token) {
      if (remember) {
        storage.local.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
        storage.session.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      } else {
        storage.session.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
        storage.local.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      }
    } else {
      storage.local.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      storage.session.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    }
  } catch (err) {
    console.warn('[dataManager.setToken] Error storing token:', err)
  }
}

/**
 * Removes auth token from both localStorage and sessionStorage.
 */
export function removeToken(): void {
  try {
    const storage = getStorage()
    if (!storage) return
    storage.local.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    storage.session.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  } catch (err) {
    console.warn('[dataManager.removeToken] Error removing token:', err)
  }
}

/**
 * Retrieves the currently authenticated user data from storage.
 * Synchronizes with token payload claims (sub/user_id).
 */
export function getUserData(): User | null {
  try {
    const storage = getStorage()
    if (!storage) return null

    const token = getToken()
    const stored =
      storage.local.getItem(STORAGE_KEYS.AUTH_USER) ||
      storage.session.getItem(STORAGE_KEYS.AUTH_USER)

    let parsedUser: User | null = null
    if (stored) {
      try {
        parsedUser = JSON.parse(stored) as User
      } catch {}
    }

    if (token) {
      const payload = parseJwt(token)
      const tokenUserId = payload?.sub ? String(payload.sub) : undefined

      if (parsedUser) {
        if (tokenUserId) {
          parsedUser.id = tokenUserId
          parsedUser.user_id = tokenUserId
        } else if (parsedUser.user_id) {
          parsedUser.id = String(parsedUser.user_id)
        }
        parsedUser.token = token
        return parsedUser
      }

      // Fallback: Construct minimal user from valid JWT payload
      if (tokenUserId) {
        const fallbackUser: User = {
          id: tokenUserId,
          user_id: tokenUserId,
          name: (payload?.name as string) || (payload?.email ? String(payload.email).split('@')[0] : 'User'),
          email: (payload?.email as string) || '',
          role: ((payload?.role as 'admin' | 'user') || 'user'),
          token,
        }
        return fallbackUser
      }
    }

    return parsedUser
  } catch (err) {
    console.warn('[dataManager.getUserData] Error getting user data:', err)
  }
  return null
}

/**
 * Alias for getUserData()
 */
export const getUser = getUserData

/**
 * Stores or clears the current user in storage and notifies listeners.
 */
export function setUserData(user: User | null, remember = true): void {
  try {
    const storage = getStorage()
    if (!storage) return

    if (user) {
      const payload = JSON.stringify(user)
      if (remember) {
        storage.local.setItem(STORAGE_KEYS.AUTH_USER, payload)
        storage.session.removeItem(STORAGE_KEYS.AUTH_USER)
      } else {
        storage.session.setItem(STORAGE_KEYS.AUTH_USER, payload)
        storage.local.removeItem(STORAGE_KEYS.AUTH_USER)
      }
    } else {
      storage.local.removeItem(STORAGE_KEYS.AUTH_USER)
      storage.session.removeItem(STORAGE_KEYS.AUTH_USER)
    }
    dispatchAuthStateChange(user)
  } catch (err) {
    console.warn('[dataManager.setUserData] Error storing user data:', err)
  }
}

/**
 * Alias for setUserData()
 */
export const setUser = setUserData

/**
 * Removes user data from storage.
 */
export function removeUserData(): void {
  setUserData(null)
}

/**
 * Alias for removeUserData()
 */
export const clearUserData = removeUserData

/**
 * Returns the real user ID of the currently logged-in user.
 * Priority: JWT payload 'sub' -> User object user_id -> User object id
 * Returns null if not logged in or if user is a temporary guest.
 */
export function getUserId(): string | null {
  const token = getToken()
  if (token) {
    const payload = parseJwt(token)
    if (payload?.sub) {
      return String(payload.sub)
    }
  }
  const user = getUserData()
  if (user?.user_id) return String(user.user_id)
  if (user?.id && !user.id.startsWith('usr_guest')) return String(user.id)
  return null
}

/**
 * Returns current user's email address or empty string.
 */
export function getUserEmail(): string {
  const user = getUserData()
  return user?.email || ''
}

/**
 * Returns current user's display name.
 */
export function getUserName(): string {
  const user = getUserData()
  return user?.name || ''
}

/**
 * Checks whether a user is currently authenticated with a valid token or active session.
 */
export function isAuthenticated(): boolean {
  return getToken() !== null || (getUserData() !== null && getUserData()?.role !== 'guest')
}

/**
 * Partially updates current user data in storage and emits change event.
 */
export function updateUserData(updates: Partial<User>): User | null {
  try {
    const storage = getStorage()
    const current = getUserData()
    if (!current) return null
    const updated: User = { ...current, ...updates }
    const inLocal = storage !== null && storage.local.getItem(STORAGE_KEYS.AUTH_USER) !== null
    setUserData(updated, inLocal)
    return updated
  } catch (err) {
    console.warn('[dataManager.updateUserData] Error updating user:', err)
    return null
  }
}

/**
 * Clears all authentication credentials and session state.
 */
export function clearAll(): void {
  removeToken()
  removeUserData()
  dispatchAuthStateChange(null)
}

/**
 * Alias for clearAll()
 */
export const logout = clearAll

/* -------------------------------------------------------------
   Session & Chat Management
   ------------------------------------------------------------- */

/**
 * Generates a unique, collision-resistant random session ID for new chats.
 * Example outputs: 'sess_9a8b7c6d5e4f', 'sess_1727618920123_a9b8c7'
 */
export function generateSessionId(prefix = 'sess'): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
    }
  } catch {
    // fallback
  }
  const randomPart = Math.random().toString(36).substring(2, 9)
  return `${prefix}_${Date.now()}_${randomPart}`
}

const ACTIVE_SESSION_KEY = 'brain_ai_active_session_id'

/**
 * Gets currently active session ID from sessionStorage.
 */
export function getActiveSessionId(): string | null {
  try {
    const storage = getStorage()
    return storage ? storage.session.getItem(ACTIVE_SESSION_KEY) || null : null
  } catch {
    return null
  }
}

/**
 * Sets or clears the currently active session ID.
 */
export function setActiveSessionId(sessionId: string | null): void {
  try {
    const storage = getStorage()
    if (!storage) return
    if (sessionId) {
      storage.session.setItem(ACTIVE_SESSION_KEY, sessionId)
    } else {
      storage.session.removeItem(ACTIVE_SESSION_KEY)
    }
  } catch {}
}

/**
 * Returns the list of session IDs saved for the specified user (or current logged-in user).
 */
export function getUserSessions(userId?: string): string[] {
  try {
    const storage = getStorage()
    if (!storage) return []
    const uid = userId || getUserId()
    if (!uid) return []
    const key = `brain_ai_user_sessions_${uid}`
    const raw = storage.local.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Adds a session ID to the user's list of saved chat sessions.
 */
export function saveUserSession(sessionId: string, userId?: string): void {
  try {
    const storage = getStorage()
    if (!storage || !sessionId) return
    const uid = userId || getUserId()
    if (!uid) return
    const key = `brain_ai_user_sessions_${uid}`
    const sessions = getUserSessions(uid)
    if (!sessions.includes(sessionId)) {
      sessions.unshift(sessionId)
      storage.local.setItem(key, JSON.stringify(sessions))
    }
  } catch (err) {
    console.warn('[dataManager.saveUserSession] Error saving session:', err)
  }
}

/**
 * Removes a session ID from the user's list of saved chat sessions.
 */
export function removeUserSession(sessionId: string, userId?: string): void {
  try {
    const storage = getStorage()
    if (!storage || !sessionId) return
    const uid = userId || getUserId()
    if (!uid) return
    const key = `brain_ai_user_sessions_${uid}`
    const sessions = getUserSessions(uid).filter((id) => id !== sessionId)
    storage.local.setItem(key, JSON.stringify(sessions))
  } catch (err) {
    console.warn('[dataManager.removeUserSession] Error removing session:', err)
  }
}

/* -------------------------------------------------------------
   Generic Storage Helpers
   ------------------------------------------------------------- */

/**
 * Safely retrieves and parses a JSON item from localStorage or sessionStorage.
 */
export function getStorageItem<T>(key: string, defaultValue: T | null = null): T | null {
  try {
    const storage = getStorage()
    if (!storage) return defaultValue
    const item = storage.local.getItem(key) || storage.session.getItem(key)
    if (item === null) return defaultValue
    return JSON.parse(item) as T
  } catch {
    return defaultValue
  }
}

/**
 * Safely writes a JSON stringifiable item into localStorage or sessionStorage.
 */
export function setStorageItem<T>(key: string, value: T, persistent = true): void {
  try {
    const storage = getStorage()
    if (!storage) return
    const serialized = JSON.stringify(value)
    if (persistent) {
      storage.local.setItem(key, serialized)
    } else {
      storage.session.setItem(key, serialized)
    }
  } catch (err) {
    console.warn(`[dataManager.setStorageItem] Error writing key "${key}":`, err)
  }
}

/**
 * Removes an item from both localStorage and sessionStorage.
 */
export function removeStorageItem(key: string): void {
  try {
    const storage = getStorage()
    if (!storage) return
    storage.local.removeItem(key)
    storage.session.removeItem(key)
  } catch (err) {
    console.warn(`[dataManager.removeStorageItem] Error removing key "${key}":`, err)
  }
}

/* -------------------------------------------------------------
   Settings Helpers
   ------------------------------------------------------------- */

export function getSettings(defaultSettings: AppSettings): AppSettings {
  try {
    const storage = getStorage()
    if (!storage) return defaultSettings
    const saved = storage.local.getItem(STORAGE_KEYS.SETTINGS)
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) }
    }
  } catch {}
  return defaultSettings
}

export function setSettings(settings: AppSettings): void {
  try {
    const storage = getStorage()
    if (!storage) return
    storage.local.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  } catch (err) {
    console.warn('[dataManager.setSettings] Failed to save settings:', err)
  }
}

/**
 * Centralized dataManager object with all functions attached.
 */
export const dataManager = {
  // Token methods
  getToken,
  setToken,
  removeToken,
  isTokenValid,
  parseJwt,
  getTokenRemainingTime,

  // User data methods
  getUserData,
  getUser,
  setUserData,
  setUser,
  removeUserData,
  clearUserData,
  getUserId,
  getUserEmail,
  getUserName,
  isAuthenticated,
  updateUserData,
  clearAll,
  logout,

  // Event methods
  onAuthStateChange,
  dispatchAuthStateChange,

  // Session & chat methods
  generateSessionId,
  getActiveSessionId,
  setActiveSessionId,
  getUserSessions,
  saveUserSession,
  removeUserSession,

  // Generic storage
  getStorageItem,
  setStorageItem,
  removeStorageItem,

  // App settings
  getSettings,
  setSettings,
}

export default dataManager
