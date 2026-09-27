import React, { useState, useRef, useEffect } from 'react'
import {
  SendIcon,
  SparklesIcon,
  FileTextIcon,
  CloseIcon,
  RefreshIcon,
} from '../icons'
import type { DocumentItem } from '../../types'
import './HeroPrompt.css'

interface HeroPromptProps {
  onSendMessage: (text: string, attachedDoc?: string) => void
  attachedDoc: DocumentItem | null
  onRemoveAttachedDoc: () => void
  onOpenUploadModal?: () => void
  activeModel?: string
  isLoading?: boolean
}

export const HeroPrompt: React.FC<HeroPromptProps> = ({
  onSendMessage,
  attachedDoc,
  onRemoveAttachedDoc,
  isLoading = false,
}) => {
  const [inputText, setInputText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [inputText])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!inputText.trim() && !attachedDoc) || isLoading) return
    onSendMessage(inputText.trim(), attachedDoc?.name)
    setInputText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="brain-hero-landing" id="hero-landing-canvas">
      {/* Subtle ambient glowing orbs */}
      <div className="brain-hero-glow brain-hero-glow--1" />
      <div className="brain-hero-glow brain-hero-glow--2" />

      {/* Center Area: How can I help you? */}
      <div className="brain-hero-center-area">
        <div className="brain-hero-header">
          <div className="brain-hero-pill-badge">
            <SparklesIcon size={13} className="brain-hero-sparkle" />
            <span>Brain AI Intelligence</span>
          </div>
          <h1 className="brain-hero-title" id="hero-main-heading">
            How can I help you?
          </h1>
        </div>
      </div>

      {/* Bottom Docked Input Box: [ Ask anything... ] */}
      <div className="brain-hero-bottom-bar">
        <form
          className="brain-prompt-box-container"
          id="brain-main-prompt-form"
          onSubmit={handleSubmit}
        >
          <div className="brain-prompt-box">
            {/* Attached document tag if selected */}
            {attachedDoc && (
              <div className="brain-attached-doc-chip" id="attached-doc-chip">
                <FileTextIcon size={14} className="brain-attached-doc-icon" />
                <span className="brain-attached-doc-name">{attachedDoc.name}</span>
                <span className="brain-attached-doc-size">({attachedDoc.size})</span>
                <button
                  type="button"
                  className="brain-attached-doc-remove"
                  onClick={onRemoveAttachedDoc}
                  aria-label="Remove attached document"
                >
                  <CloseIcon size={12} />
                </button>
              </div>
            )}

            <div className="brain-prompt-input-row">
              <textarea
                ref={textareaRef}
                id="main-prompt-textarea"
                rows={1}
                placeholder={isLoading ? 'Sending to Brain AI...' : 'Ask anything...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="brain-prompt-textarea"
                aria-label="Ask anything"
              />
            </div>

            {/* Bottom toolbar within input card */}
            <div className="brain-prompt-toolbar">
              <div className="brain-prompt-tools-left">
              </div>

              <div className="brain-prompt-tools-right">
                <button
                  type="submit"
                  className="brain-prompt-send-btn"
                  id="btn-prompt-send"
                  disabled={(!inputText.trim() && !attachedDoc) || isLoading}
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <RefreshIcon size={16} className="brain-spin" />
                  ) : (
                    <SendIcon size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
