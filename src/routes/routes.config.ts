/**
 * Brain AI - Routes Configuration
 */

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  COMPONENTS: '/components',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
