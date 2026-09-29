import React from 'react'
import {
  BrainIcon,
  SunIcon,
  MoonIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ZapIcon,
  SlidersIcon,
} from '../../components/icons'
import { Button } from '../../components/ui'
import type { AppScreen } from '../../types'
import './AuthLayout.css'

interface AuthLayoutProps {
  title: string
  subtitle: string
  currentScreen: 'login' | 'register'
  onNavigate: (screen: AppScreen) => void
  isDark: boolean
  onToggleTheme: () => void
  children: React.ReactNode
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  currentScreen,
  onNavigate,
  isDark,
  onToggleTheme,
  children,
}) => {
  return (
    <div className="brain-auth-layout" data-screen={currentScreen}>
      {/* Background Ambience */}
      <div className="brain-auth-bg" aria-hidden="true">
        <div className="brain-auth-glow-orb-1" />
        <div className="brain-auth-glow-orb-2" />
        <div className="brain-auth-glow-orb-3" />
        <div className="brain-auth-grid-overlay" />
      </div>

      {/* Top Navigation */}
      <header className="brain-auth-header">
        <button
          type="button"
          className="brain-auth-brand"
          onClick={() => onNavigate('landing')}
          title="Return to Brain AI Chat"
        >
          <div className="brain-auth-brand-logo">
            <BrainIcon size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brain-auth-brand-name">Brain AI</span>
              <span className="brain-auth-brand-pill">v2.0</span>
            </div>
          </div>
        </button>

        <div className="brain-auth-header-actions">
          <button
            type="button"
            className="brain-auth-nav-link"
            onClick={() => onNavigate('landing')}
            id="auth-back-to-chat"
          >
            ← Back to Chat
          </button>

          <Button
            variant="ghost"
            size="sm"
            shape="pill"
            onClick={() => onNavigate('design-system')}
            leftIcon={<SlidersIcon size={14} />}
            title="Preview UI Component Library"
          >
            Design System
          </Button>

          <button
            type="button"
            className="brain-auth-nav-link"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, padding: 0 }}
          >
            {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content Split View */}
      <main className="brain-auth-main">
        <div className="brain-auth-container">
          {/* Left Hero / Brand Value Column */}
          <div className="brain-auth-showcase">
            <div className="brain-auth-badge-pill">
              <span className="brain-auth-badge-pulse" />
              <span>COGNITIVE INTELLIGENCE RUNTIME</span>
            </div>

            <h1 className="brain-auth-showcase-title">
              Autonomous intellect, <br />
              <span className="brain-auth-title-gradient">designed for builders.</span>
            </h1>

            <p className="brain-auth-showcase-desc">
              Experience the unified AI platform with multi-modal neural reasoning,
              instant full-stack synthesis, and real-time enterprise agent workflows.
            </p>

            <div className="brain-auth-features-list">
              <div className="brain-auth-feature-item">
                <div className="brain-auth-feature-icon">
                  <SparklesIcon size={20} />
                </div>
                <div>
                  <div className="brain-auth-feature-title">Reasoning at Scale</div>
                  <div className="brain-auth-feature-sub">
                    Multi-step thinking trees with 128k token context and sub-second latency.
                  </div>
                </div>
              </div>

              <div className="brain-auth-feature-item">
                <div className="brain-auth-feature-icon">
                  <ShieldCheckIcon size={20} />
                </div>
                <div>
                  <div className="brain-auth-feature-title">Enterprise Zero-Retention</div>
                  <div className="brain-auth-feature-sub">
                    Your code snippets, RAG datasets, and prompts are never used for training.
                  </div>
                </div>
              </div>

              <div className="brain-auth-feature-item">
                <div className="brain-auth-feature-icon">
                  <ZapIcon size={20} />
                </div>
                <div>
                  <div className="brain-auth-feature-title">Lightning Fast Sandbox</div>
                  <div className="brain-auth-feature-sub">
                    In-browser code execution and instant live artifact previews.
                  </div>
                </div>
              </div>
            </div>

            <div className="brain-auth-testimonial">
              <div className="brain-auth-avatar-stack">
                <div className="brain-auth-avatar-circle">AS</div>
                <div className="brain-auth-avatar-circle" style={{ background: 'var(--gradient-accent)' }}>EK</div>
                <div className="brain-auth-avatar-circle" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>ML</div>
              </div>
              <span className="brain-auth-testimonial-text">
                Joined by <strong>10,000+</strong> AI engineers & system architects worldwide.
              </span>
            </div>
          </div>

          {/* Right Form Container */}
          <div className="brain-auth-form-card">
            <div className="brain-auth-card-glow-bar" />

            {/* Form Header */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                {title}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {subtitle}
              </p>
            </div>


            {/* Form Body */}
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
