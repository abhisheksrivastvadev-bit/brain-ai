import React, { useState } from 'react'
import {
  BrainIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  SlidersIcon,
  ArrowRightIcon,
  SparklesIcon,
  CheckIcon,
} from '../icons'
import { Badge, Button, UserAvatar } from '../ui'
import { authService } from '../../services/auth.service'
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

const AVATAR_PRESETS = [
  { id: 'p1', label: 'Quantum AI', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=QuantumAI' },
  { id: 'p2', label: 'Cyber Core', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberCore' },
  { id: 'p3', label: 'Holo Pulse', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=HoloPulse' },
  { id: 'p4', label: 'Neural Mind', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=NeuralMind' },
  { id: 'p5', label: 'Bio Synth', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=BioSynth' },
  { id: 'p6', label: 'Neon Scout', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonScout' },
]

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
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [customAvatarUrl, setCustomAvatarUrl] = useState('')
  const [avatarSuccess, setAvatarSuccess] = useState(false)

  const handleSelectAvatar = (url: string) => {
    authService.updateCurrentUser({ avatar: url })
    setAvatarSuccess(true)
    setTimeout(() => setAvatarSuccess(false), 1200)
  }

  const handleCustomAvatarSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customAvatarUrl.trim()) {
      handleSelectAvatar(customAvatarUrl.trim())
      setCustomAvatarUrl('')
    }
  }

  const handleResetToInitials = () => {
    authService.updateCurrentUser({ avatar: '' })
    setAvatarSuccess(true)
    setTimeout(() => setAvatarSuccess(false), 1200)
  }

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
            <BrainIcon size={24} className="brain-brand-icon" interactive thinking={false} />
            <span className="brain-brand-pulsar" />
          </div>
          <div className="brain-brand-text">
            <div className="brain-brand-heading">
              <span className="brain-brand-name">Brain AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions & User Profile */}
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
              onClick={() => {
                setUserMenuOpen((prev) => !prev)
                setShowAvatarPicker(false)
              }}
              aria-expanded={userMenuOpen}
              aria-label={`User account: ${user.name}`}
            >
              <div className="brain-user-avatar">
                <UserAvatar
                  user={user}
                  size="sm"
                  showStatus
                  status="online"
                />
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
                  onClick={() => {
                    setUserMenuOpen(false)
                    setShowAvatarPicker(false)
                  }}
                />
                <div className="brain-user-dropdown-menu" id="user-dropdown-menu">
                  <div className="brain-user-dropdown-profile">
                    <UserAvatar
                      user={user}
                      size="md"
                      showStatus
                      status="online"
                      interactive
                      onClick={() => setShowAvatarPicker((prev) => !prev)}
                    />
                    <div className="brain-user-dropdown-info">
                      <div className="brain-user-dropdown-name">{user.name}</div>
                      <div className="brain-user-dropdown-email">{user.email}</div>
                    </div>
                    <Badge variant="accent" size="sm">
                      {user.role}
                    </Badge>
                  </div>

                  {/* Quick Avatar Customizer Toggle */}
                  <button
                    type="button"
                    className="brain-user-dropdown-avatar-toggle"
                    onClick={() => setShowAvatarPicker((prev) => !prev)}
                  >
                    <SparklesIcon size={14} />
                    <span>{showAvatarPicker ? 'Hide Avatar Studio' : 'Customize Profile Avatar'}</span>
                  </button>

                  {/* Expandable Avatar Selector */}
                  {showAvatarPicker && (
                    <div className="brain-user-avatar-picker-panel">
                      <div className="brain-avatar-picker-header">
                        <span>Select Avatar Preset</span>
                        {avatarSuccess && (
                          <span className="brain-avatar-saved-tag">
                            <CheckIcon size={12} /> Saved!
                          </span>
                        )}
                      </div>
                      <div className="brain-avatar-preset-grid">
                        {AVATAR_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            className={`brain-avatar-preset-btn ${user.avatar === preset.url ? 'active' : ''}`}
                            onClick={() => handleSelectAvatar(preset.url)}
                            title={preset.label}
                          >
                            <img src={preset.url} alt={preset.label} />
                          </button>
                        ))}
                      </div>

                      {/* Reset to deterministic initials */}
                      <div className="brain-avatar-picker-actions">
                        <button
                          type="button"
                          className="brain-avatar-initials-btn"
                          onClick={handleResetToInitials}
                        >
                          Use Dynamic Initials
                        </button>
                      </div>

                      {/* Custom image URL input */}
                      <form onSubmit={handleCustomAvatarSubmit} className="brain-avatar-url-form">
                        <input
                          type="url"
                          placeholder="Or paste custom image URL..."
                          value={customAvatarUrl}
                          onChange={(e) => setCustomAvatarUrl(e.target.value)}
                          className="brain-avatar-url-input"
                        />
                        <button type="submit" className="brain-avatar-url-btn" disabled={!customAvatarUrl.trim()}>
                          Apply
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="brain-user-dropdown-divider" />

                  <button
                    type="button"
                    className="brain-user-dropdown-link"
                    onClick={() => {
                      setUserMenuOpen(false)
                      setShowAvatarPicker(false)
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
                      setShowAvatarPicker(false)
                      onLogout?.()
                    }}
                  >
                    <ArrowRightIcon size={16} />
                    <span>Sign Out</span>
                  </button>
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
