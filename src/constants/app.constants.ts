/**
 * Brain AI - Application Constants
 */

export const APP_CONFIG = {
  name: 'Brain AI',
  version: '1.0.0',
  tagline: 'Next-Gen Cognitive Intelligence UI',
  description: 'Modular, high-performance UI components powered by intelligent design tokens',
  links: {
    github: 'https://github.com',
    docs: '#docs',
  },
} as const

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const

export const STORAGE_KEYS = {
  THEME: 'brain_ai_theme',
  SETTINGS: 'brain_ai_settings',
  AUTH_USER: 'brain_ai_user',
  AUTH_TOKEN: 'brain_ai_token',
  ONBOARDING_SEEN: 'brain_ai_onboarding_seen',
  ACTIVE_SCREEN: 'brain_ai_active_screen',
} as const

export type ThemeMode = (typeof THEME_MODES)[keyof typeof THEME_MODES]
