import { useState, useEffect } from 'react'
import {
  LandingPage,
  HomePage,
  LoginPage,
  RegisterPage,
} from './pages'
import { AuthModal } from './components/auth'
import { authService } from './services'
import { useTheme } from './hooks'
import type { AppScreen, User } from './types'
import './App.css'

export function App() {
  const { isDark, toggleTheme } = useTheme()
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser())

  // Auth popup modal state: initialized from hash or closed by default
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash === 'login' || hash === 'register') {
      return { isOpen: true, mode: hash }
    }
    return { isOpen: false, mode: 'login' }
  })

  // Resolve initial screen from URL hash (defaults to 'landing' so chat is first visible)
  const [screen, setScreenState] = useState<AppScreen>(() => {
    const hash = window.location.hash.replace('#', '') as AppScreen
    if (hash === 'design-system') {
      return 'design-system'
    }
    return 'landing'
  })

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModal({ isOpen: true, mode })
  }

  const closeAuthModal = () => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }))
    if (window.location.hash === '#login' || window.location.hash === '#register') {
      window.location.hash = 'landing'
    }
  }

  // Intercept navigation: 'login' and 'register' open popup modal, keeping user in workspace
  const navigateTo = (targetScreen: AppScreen) => {
    if (targetScreen === 'login') {
      openAuthModal('login')
      return
    }
    if (targetScreen === 'register') {
      openAuthModal('register')
      return
    }
    setScreenState(targetScreen)
    window.location.hash = targetScreen
  }

  // Handle browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as AppScreen
      if (hash === 'login' || hash === 'register') {
        setAuthModal({ isOpen: true, mode: hash })
        setScreenState('landing')
      } else if (hash === 'design-system') {
        setScreenState('design-system')
      } else {
        setScreenState('landing')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user)
    closeAuthModal()
    navigateTo('landing')
  }

  const handleLogout = () => {
    authService.logout()
    setCurrentUser(null)
    navigateTo('landing')
  }

  return (
    <div className="brain-app">
      {/* 1. Main Chat Landing Workspace (Always the primary first view) */}
      {screen === 'landing' && (
        <LandingPage
          onToggleDesignSystem={() => navigateTo('design-system')}
          isDesignSystemOpen={false}
          user={currentUser}
          onNavigate={navigateTo}
          onOpenAuth={openAuthModal}
          onLogout={handleLogout}
        />
      )}

      {/* 2. Standalone Login Screen (Accessible fallback if needed) */}
      {screen === 'login' && (
        <LoginPage
          onNavigate={navigateTo}
          onAuthSuccess={handleAuthSuccess}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* 3. Standalone Register Screen (Accessible fallback if needed) */}
      {screen === 'register' && (
        <RegisterPage
          onNavigate={navigateTo}
          onAuthSuccess={handleAuthSuccess}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* 4. Design System Showcase */}
      {screen === 'design-system' && (
        <div className="brain-app-wrapper">
          <div className="brain-view-switcher-bar">
            <button
              type="button"
              className="brain-view-switch-btn"
              onClick={() => navigateTo('landing')}
            >
              ← Back to Brain AI Workspace
            </button>
          </div>
          <HomePage />
        </div>
      )}

      {/* 5. Auth Modal Popup (Sign In / Register overlay) */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={closeAuthModal}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export default App

