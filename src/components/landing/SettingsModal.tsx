import React, { useState } from 'react'
import {
  SettingsIcon,
  CloseIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
} from '../icons'
import type { AppSettings } from '../../types'
import './SettingsModal.css'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: AppSettings
  onSaveSettings: (settings: AppSettings) => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'model' | 'keys'>('general')
  const [formState, setFormState] = useState<AppSettings>({ ...settings })
  const [showApiKey, setShowApiKey] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState(false)

  if (!isOpen) return null

  const handleSave = () => {
    onSaveSettings(formState)
    setSavedFeedback(true)
    setTimeout(() => {
      setSavedFeedback(false)
      onClose()
    }, 700)
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
              Preferences, cognitive engine parameters, and integrations
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
            className={`brain-settings-tab ${activeTab === 'model' ? 'active' : ''}`}
            onClick={() => setActiveTab('model')}
          >
            Inference Parameters
          </button>
          <button
            type="button"
            className={`brain-settings-tab ${activeTab === 'keys' ? 'active' : ''}`}
            onClick={() => setActiveTab('keys')}
          >
            API Credentials
          </button>
        </div>

        <div className="brain-modal-body">
          {activeTab === 'general' && (
            <div className="brain-settings-panel">
              <div className="brain-setting-group">
                <label className="brain-setting-label">Default Cognitive Model</label>
                <select
                  value={formState.model}
                  onChange={(e) => setFormState({ ...formState, model: e.target.value })}
                  className="brain-setting-select"
                >
                  <option value="Brain AI Reasoning Pro">Brain AI Reasoning Pro</option>
                  <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                  <option value="GPT-4o Omni">GPT-4o Omni</option>
                </select>
                <span className="brain-setting-hint">Primary model used for new chat generation and code analysis.</span>
              </div>

              <div className="brain-setting-group">
                <label className="brain-setting-label">System Instructions / Persona</label>
                <textarea
                  rows={4}
                  value={formState.systemPrompt}
                  onChange={(e) => setFormState({ ...formState, systemPrompt: e.target.value })}
                  className="brain-setting-textarea"
                  placeholder="You are Brain AI, a world-class cognitive assistant..."
                />
              </div>

              <div className="brain-setting-toggle-row">
                <div>
                  <div className="brain-setting-toggle-title">Real-Time Web Retrieval</div>
                  <div className="brain-setting-toggle-desc">Automatically fetch latest docs and internet context</div>
                </div>
                <input
                  type="checkbox"
                  checked={formState.webSearchEnabled}
                  onChange={(e) => setFormState({ ...formState, webSearchEnabled: e.target.checked })}
                  className="brain-setting-checkbox"
                />
              </div>
            </div>
          )}

          {activeTab === 'model' && (
            <div className="brain-settings-panel">
              <div className="brain-setting-group">
                <div className="brain-slider-header">
                  <label className="brain-setting-label">Creativity / Temperature</label>
                  <span className="brain-slider-val">{formState.temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={formState.temperature}
                  onChange={(e) => setFormState({ ...formState, temperature: parseFloat(e.target.value) })}
                  className="brain-setting-slider"
                />
                <div className="brain-slider-labels">
                  <span>Deterministic (0.0)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>

              <div className="brain-setting-toggle-row">
                <div>
                  <div className="brain-setting-toggle-title">Stream Token Responses</div>
                  <div className="brain-setting-toggle-desc">Render tokens progressively in real-time as generated</div>
                </div>
                <input
                  type="checkbox"
                  checked={formState.streamResponse}
                  onChange={(e) => setFormState({ ...formState, streamResponse: e.target.checked })}
                  className="brain-setting-checkbox"
                />
              </div>
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="brain-settings-panel">
              <div className="brain-setting-group">
                <label className="brain-setting-label">Brain AI Platform API Key</label>
                <div className="brain-api-input-wrap">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={formState.apiKey || ''}
                    onChange={(e) => setFormState({ ...formState, apiKey: e.target.value })}
                    placeholder="bai-live-xxxxxxxxxxxxxxxxxxxx"
                    className="brain-api-input"
                  />
                  <button
                    type="button"
                    className="brain-api-toggle-btn"
                    onClick={() => setShowApiKey((prev) => !prev)}
                  >
                    {showApiKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
                <span className="brain-setting-hint">Keys are encrypted in browser local storage and never transmitted insecurely.</span>
              </div>
            </div>
          )}
        </div>

        <div className="brain-modal-footer">
          <button
            type="button"
            className="brain-modal-btn brain-modal-btn--ghost"
            onClick={onClose}
          >
            Cancel
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
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
