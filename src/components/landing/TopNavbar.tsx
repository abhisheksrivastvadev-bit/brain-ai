import React, { useState } from 'react'
import {
  BrainIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  ChevronDownIcon,
  SlidersIcon,
  CheckIcon,
} from '../icons'
import { Badge, Button } from '../ui'
import type { User } from '../../types'
import './TopNavbar.css'

interface TopNavbarProps {
  user: User
  isDark: boolean
  onToggleTheme: () => void
  onOpenSettings: () => void
  activeModel: string
  onSelectModel: (model: string) => void
  onToggleDesignSystem: () => void
  isDesignSystemOpen: boolean
  onToggleSidebarMobile: () => void
}

const AVAILABLE_MODELS = [
  { id: 'nexora-3.5', name: 'Nexora Ultra 3.5', tag: 'Fast & Smart' },
  { id: 'nexora-pro', name: 'Nexora Reasoning Pro', tag: 'Deep Thinking' },
  { id: 'claude-sonnet', name: 'Claude 3.5 Sonnet', tag: 'Coding' },
  { id: 'gpt-4o', name: 'GPT-4o Omni', tag: 'Multimodal' },
]

export const TopNavbar: React.FC<TopNavbarProps> = ({
  user,
  isDark,
  onToggleTheme,
  onOpenSettings,
  activeModel,
  onSelectModel,
  onToggleDesignSystem,
  isDesignSystemOpen,
  onToggleSidebarMobile,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
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
              <span className="brain-brand-badge">PRO</span>
            </div>
            <span className="brain-brand-subheading">Nexora Engine</span>
          </div>
        </div>

        {/* Model Switcher Pill */}
        <div className="brain-model-selector-wrapper">
          <button
            type="button"
            className="brain-model-pill"
            id="btn-model-selector"
            onClick={() => setModelDropdownOpen((prev) => !prev)}
            aria-expanded={modelDropdownOpen}
            aria-haspopup="true"
          >
            <SparklesIcon size={14} className="brain-model-sparkle" />
            <span className="brain-model-name">{activeModel}</span>
            <ChevronDownIcon size={14} className={`brain-model-chevron ${modelDropdownOpen ? 'open' : ''}`} />
          </button>

          {modelDropdownOpen && (
            <>
              <div
                className="brain-dropdown-backdrop"
                onClick={() => setModelDropdownOpen(false)}
              />
              <div className="brain-model-dropdown-menu" id="model-dropdown-menu">
                <div className="brain-dropdown-header">Cognitive Models</div>
                {AVAILABLE_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`brain-dropdown-item ${activeModel === m.name ? 'active' : ''}`}
                    onClick={() => {
                      onSelectModel(m.name)
                      setModelDropdownOpen(false)
                    }}
                  >
                    <div className="brain-dropdown-item-info">
                      <span className="brain-dropdown-item-title">{m.name}</span>
                      <span className="brain-dropdown-item-sub">{m.tag}</span>
                    </div>
                    {activeModel === m.name && <CheckIcon size={16} className="brain-check-icon" />}
                  </button>
                ))}
              </div>
            </>
          )}
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

        {/* User Profile matching wireframe prototype: 👤 Abhishek */}
        <div className="brain-user-menu-wrapper">
          <button
            type="button"
            className="brain-user-pill"
            id="btn-user-profile"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-expanded={userMenuOpen}
            aria-label="User account: Abhishek"
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
                    <div className="brain-user-dropdown-name">{user.name} Srivastva</div>
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
      </div>
    </header>
  )
}
