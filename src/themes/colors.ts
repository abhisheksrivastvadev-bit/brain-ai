/**
 * Brain AI - Design System Color Palette & Tokens
 */

export const palette = {
  // Primary brand spectrum (Electric Indigo / Violet)
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Main primary
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },

  // Secondary brand spectrum (Electric Cyan / Neon Teal)
  accent: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4', // Main accent
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },

  // Purple / Neural Glow
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Neutrals (Slate / Zinc scale)
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Semantic Status Colors
  success: {
    light: '#ecfdf5',
    main: '#10b981',
    hover: '#059669',
    dark: '#065f46',
    border: '#a7f3d0',
  },
  warning: {
    light: '#fffbeb',
    main: '#f59e0b',
    hover: '#d97706',
    dark: '#92400e',
    border: '#fde68a',
  },
  error: {
    light: '#fef2f2',
    main: '#ef4444',
    hover: '#dc2626',
    dark: '#991b1b',
    border: '#fecaca',
  },
  info: {
    light: '#eff6ff',
    main: '#3b82f6',
    hover: '#2563eb',
    dark: '#1e40af',
    border: '#bfdbfe',
  },

  // Common
  common: {
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  },
} as const

export const lightThemeColors = {
  background: {
    default: '#f8fafc',
    paper: '#ffffff',
    subtle: '#f1f5f9',
    elevated: '#ffffff',
    overlay: 'rgba(15, 23, 42, 0.4)',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#94a3b8',
    inverse: '#ffffff',
    brand: palette.primary[600],
  },
  border: {
    subtle: '#e2e8f0',
    default: '#cbd5e1',
    hover: '#94a3b8',
    focus: palette.primary[600],
  },
  brand: {
    primary: palette.primary[600],
    primaryHover: palette.primary[700],
    primarySubtle: palette.primary[50],
    accent: palette.accent[600],
    accentHover: palette.accent[700],
    accentSubtle: palette.accent[50],
  },
} as const

export const darkThemeColors = {
  background: {
    default: '#090d16',
    paper: '#0f172a',
    subtle: '#141d33',
    elevated: '#1e293b',
    overlay: 'rgba(0, 0, 0, 0.75)',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    muted: '#64748b',
    inverse: '#0f172a',
    brand: palette.primary[400],
  },
  border: {
    subtle: '#1e293b',
    default: '#334155',
    hover: '#475569',
    focus: palette.primary[400],
  },
  brand: {
    primary: palette.primary[500],
    primaryHover: palette.primary[400],
    primarySubtle: 'rgba(99, 102, 241, 0.15)',
    accent: palette.accent[400],
    accentHover: palette.accent[300],
    accentSubtle: 'rgba(34, 211, 238, 0.15)',
  },
} as const

export const gradients = {
  primary: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  accent: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  cyber: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
  sunset: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
  darkGlass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
  glowBorder: 'linear-gradient(90deg, #6366f1, #a855f7, #06b6d4)',
} as const

export const colors = {
  palette,
  light: lightThemeColors,
  dark: darkThemeColors,
  gradients,
}

export type ColorPalette = typeof palette
export type LightThemeColors = typeof lightThemeColors
export type DarkThemeColors = typeof darkThemeColors
export type ThemeGradients = typeof gradients

export default colors
