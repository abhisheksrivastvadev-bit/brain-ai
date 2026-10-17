import React, { useState, useRef, useEffect } from 'react'
import {
  SendIcon,
  SparklesIcon,
  RefreshIcon,
  BrainIcon,
  PaperclipIcon,
  CloseIcon,
} from '../icons'
import './HeroPrompt.css'

interface HeroPromptProps {
  onSendMessage: (text?: string, documents?: File[]) => void
  activeModel?: string
  isLoading?: boolean
}

export const HeroPrompt: React.FC<HeroPromptProps> = ({
  onSendMessage,
  isLoading = false,
}) => {
  const [inputText, setInputText] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [inputText])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = inputText.trim()
    if ((!trimmed && selectedFiles.length === 0) || isLoading) return
    onSendMessage(trimmed || undefined, selectedFiles.length > 0 ? selectedFiles : undefined)
    setInputText('')
    setSelectedFiles([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...newFiles])
      e.target.value = ''
    }
  }

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const hasFiles = selectedFiles.length > 0
  const canSubmit = (Boolean(inputText.trim()) || hasFiles) && !isLoading

  return (
    <div className="brain-hero-landing" id="hero-landing-canvas">
      {/* Subtle ambient glowing orbs */}
      <div className="brain-hero-glow brain-hero-glow--1" />
      <div className="brain-hero-glow brain-hero-glow--2" />

      {/* Center Area: How can I help you? */}
      <div className="brain-hero-center-area">
        <div className="brain-hero-header">
          <div className="brain-hero-brain-icon-wrapper" title="Brain AI Cognitive Core - Hover to interact">
            <BrainIcon size={52} interactive thinking={isLoading} />
          </div>
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
            {/* Attached file chips */}
            {hasFiles && (
              <div className="brain-hero-attached-files">
                {selectedFiles.map((file, idx) => (
                  <span key={idx} className="brain-hero-attached-chip">
                    <span className="brain-hero-chip-icon">📄</span>
                    <span className="brain-hero-chip-name">{file.name}</span>
                    <span className="brain-hero-chip-size">
                      ({Math.round(file.size / 1024)} KB)
                    </span>
                    <button
                      type="button"
                      className="brain-hero-chip-remove"
                      onClick={() => handleRemoveFile(idx)}
                      title="Remove file"
                      aria-label={`Remove ${file.name}`}
                    >
                      <CloseIcon size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="brain-prompt-input-row">
              <textarea
                ref={textareaRef}
                id="main-prompt-textarea"
                rows={1}
                placeholder={
                  isLoading
                    ? 'Sending to Brain AI...'
                    : hasFiles
                    ? 'Ask a question about the document(s) (optional)...'
                    : 'Ask anything...'
                }
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
                <button
                  type="button"
                  className={`brain-tool-btn ${hasFiles ? 'brain-tool-btn--active' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  title="Attach document (PDF, TXT, DOCX)"
                  aria-label="Attach document"
                >
                  <PaperclipIcon size={14} />
                  <span>{hasFiles ? `${selectedFiles.length} file(s)` : 'Attach Document'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>

              <div className="brain-prompt-tools-right">
                <button
                  type="submit"
                  className="brain-prompt-send-btn"
                  id="btn-prompt-send"
                  disabled={!canSubmit}
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
