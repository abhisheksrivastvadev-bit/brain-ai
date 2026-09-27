import { useState, useEffect } from 'react'
import { STORAGE_KEYS, THEME_MODES, type ThemeMode } from '../constants/app.constants'

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode | null
      if (stored && (stored === THEME_MODES.LIGHT || stored === THEME_MODES.DARK)) {
        return stored
      }
      return window.matchMedia('(prefers-color-scheme: light)').matches
        ? THEME_MODES.LIGHT
        : THEME_MODES.DARK
    }
    return THEME_MODES.DARK
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEYS.THEME, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) =>
      prev === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK
    )
  }

  const isDark = theme === THEME_MODES.DARK

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark,
  }
}

export default useTheme
