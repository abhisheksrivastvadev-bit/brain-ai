import React, { useState, useEffect } from 'react'
import {
  SettingsIcon,
  CloseIcon,
  CheckIcon,
  SparklesIcon,
} from '../icons'
import type { AppSettings, User } from '../../types'
import { UserAvatar } from '../ui/Avatar'
import { authService } from '../../services/auth.service'
import './SettingsModal.css'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: AppSettings
  onSaveSettings: (settings: AppSettings) => void
  user?: User | null
}

const SETTINGS_AVATAR_PRESETS = [
  { id: 'p1', label: 'Quantum AI', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=QuantumAI' },
  { id: 'p2', label: 'Cyber Core', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberCore' },
  { id: 'p3', label: 'Holo Pulse', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=HoloPulse' },
  { id: 'p4', label: 'Neural Mind', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=NeuralMind' },
  { id: 'p5', label: 'Bio Synth', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=BioSynth' },
  { id: 'p6', label: 'Neon Scout', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonScout' },
]

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  user = null,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'profile'>('general')
  const [formState, setFormState] = useState<AppSettings>({ ...settings })
  const [savedFeedback, setSavedFeedback] = useState(false)
  const [customAvatarInput, setCustomAvatarInput] = useState('')
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null)

  // Keep form state in sync with settings when modal is opened
  useEffect(() => {
    if (isOpen) {
      setFormState({ ...settings })
      setCustomAvatarInput(user?.avatar || '')
    }
  }, [isOpen, settings, user])

  if (!isOpen) return null

  const handleSave = () => {
    onSaveSettings(formState)
    setSavedFeedback(true)
    setTimeout(() => {
      setSavedFeedback(false)
      onClose()
    }, 700)
  }

  const handleApplyAvatar = (url: string) => {
    authService.updateCurrentUser({ avatar: url })
    setCustomAvatarInput(url)
    setAvatarNotice('Avatar updated successfully!')
    setTimeout(() => setAvatarNotice(null), 2000)
  }

  const handleResetAvatar = () => {
    authService.updateCurrentUser({ avatar: '' })
    setCustomAvatarInput('')
    setAvatarNotice('Reset to dynamic initials!')
    setTimeout(() => setAvatarNotice(null), 2000)
  }

  return (
    <div className="brain-modal-overlay" onClick={onClose}>
      <div
        className="brain-modal-card brain-settings-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <div className="brain-modal-header">
          <div className="brain-settings-modal-icon">
            <SettingsIcon size={20} />
          </div>
          <div className="brain-modal-header-info">
            <h3 className="brain-modal-title" id="settings-modal-title">
              Brain AI Settings
            </h3>
            <span className="brain-modal-sub">
              Preferences, cognitive engine parameters, and user profile
            </span>
          </div>
          <button
            type="button"
            className="brain-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="brain-settings-tabs">
          <button
            type="button"
            className={`brain-settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General & Prompt
          </button>
          <button
            type="button"
            className={`brain-settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile & Avatar
          </button>
        </div>

        <div className="brain-modal-body">
          {activeTab === 'general' && (
            <div className="brain-settings-panel">
              <div className="brain-setting-group">
                <label className="brain-setting-label">System Instructions / Persona</label>
                <textarea
                  rows={5}
                  value={formState.systemPrompt}
                  onChange={(e) => setFormState({ ...formState, systemPrompt: e.target.value })}
                  className="brain-setting-textarea"
                  placeholder="You are Brain AI, a world-class cognitive assistant..."
                />
                <span className="brain-setting-hint">
                  Custom instructions injected into every reasoning and conversation session.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="brain-settings-panel">
              {user ? (
                <>
                  <div className="brain-profile-overview-card">
                    <div className="brain-profile-avatar-wrapper">
                      <UserAvatar
                        user={user}
                        size="lg"
                        showStatus
                        status="online"
                        interactive
                      />
                    </div>
                    <div className="brain-profile-details">
                      <div className="brain-profile-name">{user.name}</div>
                      <div className="brain-profile-email">{user.email || 'No email associated'}</div>
                      <div className="brain-profile-badge-row">
                        <span className="brain-profile-role-badge">{user.role} Plan</span>
                        {user.user_id && (
                          <span className="brain-profile-id-badge">ID: {user.user_id}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {avatarNotice && (
                    <div className="brain-profile-notice">
                      <CheckIcon size={14} />
                      <span>{avatarNotice}</span>
                    </div>
                  )}

                  <div className="brain-setting-group">
                    <label className="brain-setting-label">
                      <SparklesIcon size={14} /> Choose Avatar Preset
                    </label>
                    <div className="brain-settings-avatar-presets">
                      {SETTINGS_AVATAR_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`brain-settings-avatar-btn ${user.avatar === p.url ? 'active' : ''}`}
                          onClick={() => handleApplyAvatar(p.url)}
                          title={p.label}
                        >
                          <img src={p.url} alt={p.label} />
                          <span className="brain-avatar-preset-label">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="brain-setting-group">
                    <label className="brain-setting-label">Custom Avatar Image URL</label>
                    <div className="brain-custom-avatar-row">
                      <input
                        type="url"
                        placeholder="https://example.com/avatar.png"
                        value={customAvatarInput}
                        onChange={(e) => setCustomAvatarInput(e.target.value)}
                        className="brain-setting-input"
                      />
                      <button
                        type="button"
                        className="brain-custom-avatar-save-btn"
                        onClick={() => {
                          if (customAvatarInput.trim()) {
                            handleApplyAvatar(customAvatarInput.trim())
                          }
                        }}
                        disabled={!customAvatarInput.trim()}
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        className="brain-custom-avatar-reset-btn"
                        onClick={handleResetAvatar}
                        title="Use initials with dynamic gradient"
                      >
                        Reset Initials
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="brain-profile-guest-notice">
                  <p>You are currently browsing as a Guest.</p>
                  <p>Sign in to configure your personalized user profile picture and persistent identity.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="brain-modal-footer">
          <button
            type="button"
            className="brain-modal-btn brain-modal-btn--ghost"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="brain-modal-btn brain-modal-btn--primary"
            onClick={handleSave}
          >
            {savedFeedback ? (
              <>
                <CheckIcon size={16} />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Settings</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
