import React, { useState, useRef, useEffect } from 'react'
import {
  SendIcon,
  SparklesIcon,
  RefreshIcon,
  BrainIcon,
  PaperclipIcon,
  FileTextIcon,
  CloseIcon,
  UploadCloudIcon,
} from '../icons'
import type { DocumentItem } from '../../types'
import { createDocumentFromFile } from '../../utils'
import './HeroPrompt.css'

interface HeroPromptProps {
  onSendMessage: (text: string, attachedDoc?: DocumentItem | null) => void
  attachedDoc?: DocumentItem | null
  onRemoveAttachedDoc?: () => void
  onOpenUploadModal?: () => void
  onAttachDoc?: (doc: DocumentItem) => void
  activeModel?: string
  isLoading?: boolean
}

export const HeroPrompt: React.FC<HeroPromptProps> = ({
  onSendMessage,
  attachedDoc = null,
  onRemoveAttachedDoc,
  onOpenUploadModal,
  onAttachDoc,
  isLoading = false,
}) => {
  const [inputText, setInputText] = useState('')
  const [isDragActive, setIsDragActive] = useState(false)
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
    if ((!inputText.trim() && !attachedDoc) || isLoading) return
    const textToSend = inputText.trim() || (attachedDoc ? `Please analyze and summarize the attached document: ${attachedDoc.name}` : '')
    onSendMessage(textToSend, attachedDoc)
    setInputText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // File input change handler
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const doc = await createDocumentFromFile(file)
      onAttachDoc?.(doc)
    } catch (err) {
      console.error('[HeroPrompt] Failed to process file:', err)
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    try {
      const doc = await createDocumentFromFile(file)
      onAttachDoc?.(doc)
    } catch (err) {
      console.error('[HeroPrompt] Drop file error:', err)
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

      {/* Hidden file input for paperclip */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,.json,.py,.ts,.tsx,.js,.jsx,.html,.css,.csv,.png,.jpg,.jpeg"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        id="hero-hidden-file-input"
      />

      {/* Bottom Docked Input Box: [ Ask anything... ] */}
      <div className="brain-hero-bottom-bar">
        <form
          className="brain-prompt-box-container"
          id="brain-main-prompt-form"
          onSubmit={handleSubmit}
        >
          <div
            className={`brain-prompt-box ${isDragActive ? 'brain-prompt-box--drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Attached document chip if selected */}
            {attachedDoc && (
              <div className="brain-attached-doc-chip" id="attached-doc-chip">
                <span className="brain-attached-doc-icon">
                  <FileTextIcon size={15} />
                </span>
                <span className="brain-attached-doc-name">{attachedDoc.name}</span>
                <span className="brain-attached-doc-size">({attachedDoc.size})</span>
                {onRemoveAttachedDoc && (
                  <button
                    type="button"
                    className="brain-attached-doc-remove"
                    onClick={onRemoveAttachedDoc}
                    title="Remove attachment"
                    aria-label="Remove attached document"
                  >
                    <CloseIcon size={12} />
                  </button>
                )}
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
                    : attachedDoc
                      ? `Ask questions about ${attachedDoc.name}...`
                      : 'Ask anything or drag & drop files here...'
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
                {/* Paperclip attachment button */}
                <button
                  type="button"
                  className="brain-tool-btn"
                  id="btn-hero-attach-file"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file (PDF, TXT, DOCX, Code, Images)"
                  aria-label="Attach file"
                  disabled={isLoading}
                >
                  <PaperclipIcon size={15} />
                  <span>Attach</span>
                </button>

                {/* Optional Upload Modal button for rich RAG indexing */}
                {onOpenUploadModal && (
                  <button
                    type="button"
                    className="brain-tool-btn"
                    id="btn-hero-rag-upload"
                    onClick={onOpenUploadModal}
                    title="Upload document for RAG vector search"
                    aria-label="Upload document for RAG"
                    disabled={isLoading}
                  >
                    <UploadCloudIcon size={15} />
                    <span>Upload for RAG</span>
                  </button>
                )}
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

export default HeroPrompt
