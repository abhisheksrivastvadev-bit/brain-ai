import React, { useState } from 'react'
import {
  BrainIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  ChevronDownIcon,
  SlidersIcon,
  ArrowRightIcon,
} from '../icons'
import { Badge, Button } from '../ui'
import type { User, AppScreen } from '../../types'
import './TopNavbar.css'

interface TopNavbarProps {
  user: User | null
  isDark: boolean
  onToggleTheme: () => void
  onOpenSettings: () => void
  onSelectModel?: (model: string) => void
  onToggleDesignSystem: () => void
  isDesignSystemOpen: boolean
  onToggleSidebarMobile: () => void
  onNavigate?: (screen: AppScreen) => void
  onOpenAuth?: (mode: 'login' | 'register') => void
  onLogout?: () => void
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  user,
  isDark,
  onToggleTheme,
  onOpenSettings,
  onToggleDesignSystem,
  isDesignSystemOpen,
  onToggleSidebarMobile,
  onNavigate,
  onOpenAuth,
  onLogout,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header className="brain-landing-nav" id="brain-top-nav">
      {/* Left: Mobile hamburger + Brain AI Brand */}
      <div className="brain-nav-left">
        <button
          type="button"
          className="brain-nav-mobile-btn"
          id="btn-mobile-sidebar-toggle"
          onClick={onToggleSidebarMobile}
          aria-label="Toggle navigation menu"
        >
          <span className="brain-hamburger-bar" />
          <span className="brain-hamburger-bar" />
          <span className="brain-hamburger-bar" />
        </button>

        <div className="brain-brand-lockup" id="brain-brand-header">
          <div className="brain-brand-icon-wrapper">
            <BrainIcon size={22} className="brain-brand-icon" />
            <span className="brain-brand-pulsar" />
          </div>
          <div className="brain-brand-text">
            <div className="brain-brand-heading">
              <span className="brain-brand-name">Brain AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions & User Abhishek Profile */}
      <div className="brain-nav-right">
        {/* Toggle between Prototype Landing Page & Design System Showcase */}
        <Button
          variant={isDesignSystemOpen ? 'primary' : 'outline'}
          size="sm"
          shape="pill"
          id="btn-toggle-design-system"
          onClick={onToggleDesignSystem}
          leftIcon={<SlidersIcon size={14} />}
          className="brain-nav-ds-btn"
        >
          {isDesignSystemOpen ? 'Back to Landing' : 'UI Kit View'}
        </Button>

        {/* Theme Toggle */}
        <button
          type="button"
          className="brain-nav-icon-btn"
          id="btn-theme-toggle"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>

        {/* User Profile if authenticated, or Log In / Sign Up if guest */}
        {user ? (
          <div className="brain-user-menu-wrapper">
            <button
              type="button"
              className="brain-user-pill"
              id="btn-user-profile"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-expanded={userMenuOpen}
              aria-label={`User account: ${user.name}`}
            >
              <div className="brain-user-avatar">
                <span className="brain-user-avatar-icon">👤</span>
                <span className="brain-user-status-dot" title="Online" />
              </div>
              <span className="brain-user-name" id="user-display-name">
                {user.name}
              </span>
              <ChevronDownIcon size={14} className={`brain-user-chevron ${userMenuOpen ? 'open' : ''}`} />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="brain-dropdown-backdrop"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="brain-user-dropdown-menu" id="user-dropdown-menu">
                  <div className="brain-user-dropdown-profile">
                    <div className="brain-user-dropdown-avatar">
                      <UserIcon size={20} />
                    </div>
                    <div>
                      <div className="brain-user-dropdown-name">{user.name}</div>
                      <div className="brain-user-dropdown-email">{user.email}</div>
                    </div>
                    <Badge variant="accent" size="sm">
                      {user.role}
                    </Badge>
                  </div>

                  <div className="brain-user-dropdown-divider" />

                  <button
                    type="button"
                    className="brain-user-dropdown-link"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onOpenSettings()
                    }}
                  >
                    <SlidersIcon size={16} />
                    <span>Preferences & Keys</span>
                  </button>

                  <div className="brain-user-dropdown-divider" />

                  <button
                    type="button"
                    className="brain-user-dropdown-link"
                    style={{ color: 'var(--color-error)' }}
                    onClick={() => {
                      setUserMenuOpen(false)
                      onLogout?.()
                    }}
                  >
                    <ArrowRightIcon size={16} />
                    <span>Sign Out</span>
                  </button>

                  <div className="brain-user-dropdown-divider" />

                  <div className="brain-user-token-stat">
                    <div className="brain-token-stat-row">
                      <span>Context Usage</span>
                      <span>19.4k / 128k</span>
                    </div>
                    <div className="brain-token-stat-bar">
                      <div className="brain-token-stat-fill" style={{ width: '15%' }} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="brain-nav-auth-actions" id="nav-guest-auth-actions">
            <Button
              variant="outline"
              size="sm"
              shape="pill"
              id="nav-btn-login"
              onClick={() => {
                if (onOpenAuth) onOpenAuth('login')
                else onNavigate?.('login')
              }}
            >
              Log In
            </Button>
            <Button
              variant="primary"
              size="sm"
              shape="pill"
              id="nav-btn-register"
              onClick={() => {
                if (onOpenAuth) onOpenAuth('register')
                else onNavigate?.('register')
              }}
            >
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
