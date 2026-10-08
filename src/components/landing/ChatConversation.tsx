import React, { useState, useRef, useEffect } from 'react'
import {
  SendIcon,
  BrainIcon,
  CopyIcon,
  CheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  RefreshIcon,
  ImageIcon,
  DownloadIcon,
  MaximizeIcon,
  CloseIcon,
  PaperclipIcon,
  FileTextIcon,
} from '../icons'
import type { ChatSession, User, DocumentItem } from '../../types'
import { UserAvatar } from '../ui/Avatar'
import { createDocumentFromFile } from '../../utils'
import './ChatConversation.css'

interface ChatConversationProps {
  chat: ChatSession
  currentUser: User
  onSendMessage: (text: string, attachedDoc?: DocumentItem | null) => void
  onBackToNewChat: () => void
  isLoading?: boolean
  onRefreshHistory?: () => void
  attachedDoc?: DocumentItem | null
  onRemoveAttachedDoc?: () => void
  onOpenUploadModal?: () => void
  onAttachDoc?: (doc: DocumentItem) => void
  onSelectDocument?: (doc: DocumentItem) => void
}

export const ChatConversation: React.FC<ChatConversationProps> = ({
  chat,
  currentUser,
  onSendMessage,
  onBackToNewChat,
  isLoading = false,
  onRefreshHistory,
  attachedDoc = null,
  onRemoveAttachedDoc,
  onOpenUploadModal,
  onAttachDoc,
  onSelectDocument,
}) => {
  const [inputText, setInputText] = useState('')
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null)
  const [copiedImgId, setCopiedImgId] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({})
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null)
      }
    }
    if (lightboxImage) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxImage])

  // Scroll only the chat messages container to bottom (avoids scrolling window/body)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [chat.messages, isLoading])

  // Auto-resize input
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [inputText])

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard?.writeText(code)
    setCopiedSnippetId(id)
    setTimeout(() => setCopiedSnippetId(null), 2000)
  }

  const handleCopyImageUrl = (url: string, id: string) => {
    navigator.clipboard?.writeText(url)
    setCopiedImgId(id)
    setTimeout(() => setCopiedImgId(null), 2000)
  }

  const handleDownloadImage = (url: string, filename = 'brain-ai-visual.jpg') => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoning((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }))
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!inputText.trim() && !attachedDoc) || isLoading) return
    const textToSend =
      inputText.trim() ||
      (attachedDoc ? `Please analyze and summarize the attached document: ${attachedDoc.name}` : '')
    onSendMessage(textToSend, attachedDoc)
    setInputText('')
  }

  // Handle direct file input through paperclip
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const doc = await createDocumentFromFile(file)
      onAttachDoc?.(doc)
    } catch (err) {
      console.error('[ChatConversation] Failed to process file:', err)
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
      console.error('[ChatConversation] Drop file error:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="brain-chat-view" id="brain-active-chat-view">
      {/* Chat Sub-header */}
      <header className="brain-chat-header">
        <div className="brain-chat-header-left">
          <button
            type="button"
            className="brain-chat-back-btn"
            id="btn-chat-back-to-new"
            onClick={onBackToNewChat}
            title="Start New Chat"
          >
            <SparklesIcon size={15} />
            <span>New Chat</span>
          </button>
          <span className="brain-chat-header-sep">/</span>
          <div className="brain-chat-header-title-box">
            <h2 className="brain-chat-header-title">{chat.title}</h2>
            <span className="brain-chat-header-desc">{chat.description}</span>
          </div>
        </div>

        <div className="brain-chat-header-right">
          <div className="brain-chat-session-badge" title="Active Backend Session">
            <span className="brain-session-status-dot" />
            <span className="brain-session-badge-label">Session:</span>
            <strong>{chat.id}</strong>
          </div>
          {onRefreshHistory && (
            <button
              type="button"
              className="brain-chat-sync-btn"
              onClick={onRefreshHistory}
              disabled={isLoading}
              title="Sync latest conversation history from backend"
              aria-label="Sync history"
            >
              <RefreshIcon size={13} className={isLoading ? 'brain-spin' : ''} />
              <span>Sync History</span>
            </button>
          )}
        </div>
      </header>

      {/* Message Stream - independently scrollable container */}
      <div
        ref={messagesContainerRef}
        className="brain-chat-messages"
        role="log"
        aria-live="polite"
      >
        {chat.messages.length === 0 && !isLoading && (
          <div className="brain-chat-empty-session">
            <div className="brain-chat-empty-icon">
              <SparklesIcon size={24} />
            </div>
            <h3 className="brain-chat-empty-title">Session {chat.id}</h3>
            <p className="brain-chat-empty-desc">
              {chat.description && chat.description !== 'No messages yet'
                ? chat.description
                : 'No messages in this session yet. Type a prompt below to start chatting!'}
            </p>
          </div>
        )}

        {chat.messages.map((msg) => {
          const isUser = msg.sender === 'user'
          return (
            <div
              key={msg.id}
              className={`brain-msg-row ${isUser ? 'brain-msg-row--user' : 'brain-msg-row--assistant'}`}
            >
              {/* Avatar */}
              <div className="brain-msg-avatar">
                {isUser ? (
                  <UserAvatar user={currentUser} size={32} />
                ) : (
                  <div className="brain-msg-ai-icon">
                    <BrainIcon size={18} interactive thinking={false} />
                  </div>
                )}
              </div>

              {/* Bubble & Contents */}
              <div className="brain-msg-bubble">
                <div className="brain-msg-meta">
                  <span className="brain-msg-sender">
                    {isUser ? currentUser.name : 'Brain AI'}
                  </span>
                  <span className="brain-msg-time">{msg.timestamp}</span>
                </div>

                {/* Attachment badge on user message */}
                {msg.attachment && (
                  <div
                    className="brain-msg-attachment-badge"
                    onClick={() => {
                      if (msg.attachedDoc && onSelectDocument) {
                        onSelectDocument(msg.attachedDoc)
                      }
                    }}
                    title={msg.attachedDoc ? `Click to inspect ${msg.attachment}` : `Attached context: ${msg.attachment}`}
                  >
                    <span className="brain-msg-attachment-badge-icon">
                      <FileTextIcon size={14} />
                    </span>
                    <span className="brain-msg-attachment-badge-name">{msg.attachment}</span>
                    <span className="brain-msg-attachment-badge-tag">Context</span>
                  </div>
                )}


                {/* Optional Reasoning Collapser */}
                {msg.reasoning && (
                  <div className="brain-msg-reasoning-box">
                    <button
                      type="button"
                      className="brain-msg-reasoning-toggle"
                      onClick={() => toggleReasoning(msg.id)}
                    >
                      <SparklesIcon size={13} />
                      <span>Reasoning Process</span>
                      <ArrowRightIcon
                        size={12}
                        className={`brain-reasoning-arrow ${expandedReasoning[msg.id] ? 'open' : ''}`}
                      />
                    </button>
                    {expandedReasoning[msg.id] && (
                      <div className="brain-msg-reasoning-content">{msg.reasoning}</div>
                    )}
                  </div>
                )}

                {/* Formatted Text Content */}
                <div className="brain-msg-text">
                  {msg.content.split('\n\n').map((paragraph, pIdx) => {
                    // Check if paragraph is markdown image: ![alt](url)
                    const mdImgMatch = paragraph.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
                    if (mdImgMatch) {
                      const alt = mdImgMatch[1] || 'Generated Visual'
                      const url = mdImgMatch[2]
                      return (
                        <div key={pIdx} className="brain-inline-image-box">
                          <div
                            className="brain-image-preview-wrapper"
                            onClick={() => setLightboxImage(url)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setLightboxImage(url)}
                          >
                            <img src={url} alt={alt} className="brain-msg-image" loading="lazy" />
                            <div className="brain-image-hover-overlay">
                              <span className="brain-image-overlay-text">
                                <MaximizeIcon size={14} /> Click to expand
                              </span>
                            </div>
                          </div>
                          {alt && <span className="brain-image-caption">{alt}</span>}
                        </div>
                      )
                    }

                    if (paragraph.startsWith('### ')) {
                      return <h4 key={pIdx} className="brain-msg-h4">{paragraph.replace('### ', '')}</h4>
                    }
                    if (paragraph.startsWith('- ')) {
                      const items = paragraph.split('\n- ')
                      return (
                        <ul key={pIdx} className="brain-msg-ul">
                          {items.map((it, itIdx) => (
                            <li key={itIdx} dangerouslySetInnerHTML={{ __html: it.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>') }} />
                          ))}
                        </ul>
                      )
                    }
                    if (/^\d+\.\s/.test(paragraph)) {
                      const items = paragraph.split(/\n(?=\d+\.\s)/)
                      return (
                        <ol key={pIdx} className="brain-msg-ol">
                          {items.map((it, itIdx) => (
                            <li key={itIdx} dangerouslySetInnerHTML={{ __html: it.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>') }} />
                          ))}
                        </ol>
                      )
                    }
                    return (
                      <p
                        key={pIdx}
                        dangerouslySetInnerHTML={{
                          __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>'),
                        }}
                      />
                    )
                  })}
                </div>

                {/* Optional Syntax-Highlighted Code Block */}
                {msg.codeSnippet && (
                  <div className="brain-code-block">
                    <div className="brain-code-header">
                      <span className="brain-code-title">
                        {msg.codeSnippet.title || msg.codeSnippet.language}
                      </span>
                      <button
                        type="button"
                        className="brain-code-copy-btn"
                        onClick={() => handleCopyCode(msg.codeSnippet!.code, msg.id)}
                      >
                        {copiedSnippetId === msg.id ? (
                          <>
                            <CheckIcon size={14} className="brain-copy-check" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon size={14} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="brain-code-pre">
                      <code>{msg.codeSnippet.code}</code>
                    </pre>
                  </div>
                )}

                {/* AI Generated Images display */}
                {((msg.images && msg.images.length > 0) || msg.imageUrl) && (
                  <div className="brain-msg-images-grid">
                    {(msg.images && msg.images.length > 0 ? msg.images : (msg.imageUrl ? [msg.imageUrl] : [])).map((imgUrl, imgIdx) => {
                      const imgKey = `${msg.id}_img_${imgIdx}`
                      return (
                        <div key={imgKey} className="brain-msg-image-card">
                          <div className="brain-image-card-header">
                            <div className="brain-image-card-badge">
                              <SparklesIcon size={13} className="brain-image-badge-sparkle" />
                              <span>AI Generated Image</span>
                            </div>
                            <div className="brain-image-card-actions">
                              <button
                                type="button"
                                className="brain-img-action-btn"
                                onClick={() => setLightboxImage(imgUrl)}
                                title="Expand image full size"
                                aria-label="Expand image"
                              >
                                <MaximizeIcon size={13} />
                              </button>
                              <button
                                type="button"
                                className="brain-img-action-btn"
                                onClick={() => handleDownloadImage(imgUrl, `brain-ai-${msg.id.slice(-6)}-${imgIdx + 1}.jpg`)}
                                title="Download image"
                                aria-label="Download image"
                              >
                                <DownloadIcon size={13} />
                              </button>
                              <button
                                type="button"
                                className="brain-img-action-btn"
                                onClick={() => handleCopyImageUrl(imgUrl, imgKey)}
                                title="Copy image URL"
                                aria-label="Copy image"
                              >
                                {copiedImgId === imgKey ? (
                                  <CheckIcon size={13} className="brain-copy-check" />
                                ) : (
                                  <CopyIcon size={13} />
                                )}
                              </button>
                            </div>
                          </div>

                          <div
                            className="brain-image-preview-wrapper"
                            onClick={() => setLightboxImage(imgUrl)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setLightboxImage(imgUrl)}
                          >
                            <img
                              src={imgUrl}
                              alt="AI generated visual"
                              className="brain-msg-image"
                              loading="lazy"
                            />
                            <div className="brain-image-hover-overlay">
                              <span className="brain-image-overlay-text">
                                <MaximizeIcon size={14} /> Click to expand
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Thinking Indicator */}
        {isLoading && (
          <div className="brain-msg-row brain-msg-row--assistant">
            <div className="brain-msg-avatar">
              <div className="brain-msg-ai-icon brain-pulse-glow">
                <BrainIcon size={18} interactive thinking={true} />
              </div>
            </div>
            <div className="brain-msg-bubble">
              <div className="brain-msg-meta">
                <span className="brain-msg-sender">Brain AI</span>
                <span className="brain-msg-time">Generating response...</span>
              </div>
              <div className="brain-msg-text brain-msg-text--thinking">
                <div className="brain-thinking-wrapper">
                  <span className="brain-thinking-text">Contacting Brain AI backend...</span>
                  <div className="brain-typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Input Bar */}
      <footer className="brain-chat-footer">
        <form
          className={`brain-chat-input-container ${isDragActive ? 'brain-chat-input-container--drag-active' : ''}`}
          onSubmit={handleSubmit}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Hidden file input for paperclip */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,.json,.py,.ts,.tsx,.js,.jsx,.html,.css,.csv,.png,.jpg,.jpeg"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
            id="chat-hidden-file-input"
          />

          {/* Attached document chip if present */}
          {attachedDoc && (
            <div className="brain-attached-doc-chip" id="chat-attached-doc-chip">
              <span className="brain-attached-doc-icon">
                <FileTextIcon size={14} />
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

          <div className="brain-chat-input-row">
            {/* Paperclip attachment button */}
            <button
              type="button"
              className="brain-chat-tool-btn"
              id="btn-chat-attach-file"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click()
                } else if (onOpenUploadModal) {
                  onOpenUploadModal()
                }
              }}
              title="Attach document or file (PDF, TXT, DOCX, Code, Images)"
              aria-label="Attach document or file"
              disabled={isLoading}
            >
              <PaperclipIcon size={17} />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              id="chat-input-textarea"
              placeholder={
                isLoading
                  ? 'Brain AI is generating a response...'
                  : attachedDoc
                    ? `Ask about ${attachedDoc.name}...`
                    : `Ask about ${chat.title} or drop files here...`
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="brain-chat-textarea"
            />

            <button
              type="submit"
              className="brain-chat-send-btn"
              id="btn-chat-send"
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
        </form>
      </footer>

      {/* Fullscreen Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="brain-image-lightbox-backdrop"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged Image Preview"
        >
          <div
            className="brain-image-lightbox-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="brain-lightbox-header">
              <div className="brain-lightbox-title-box">
                <ImageIcon size={16} className="brain-lightbox-icon" />
                <span className="brain-lightbox-title">Brain AI Generated Visual</span>
              </div>
              <div className="brain-lightbox-actions">
                <button
                  type="button"
                  className="brain-lightbox-btn"
                  onClick={() => handleDownloadImage(lightboxImage, 'brain-ai-full.jpg')}
                  title="Download full image"
                >
                  <DownloadIcon size={14} />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  className="brain-lightbox-btn"
                  onClick={() => handleCopyImageUrl(lightboxImage, 'lightbox_copy')}
                  title="Copy image URL"
                >
                  {copiedImgId === 'lightbox_copy' ? (
                    <>
                      <CheckIcon size={14} className="brain-copy-check" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="brain-lightbox-close-btn"
                  onClick={() => setLightboxImage(null)}
                  title="Close (Esc)"
                  aria-label="Close image preview"
                >
                  <CloseIcon size={16} />
                </button>
              </div>
            </header>

            <div className="brain-lightbox-image-container">
              <img
                src={lightboxImage}
                alt="AI Generated visual enlarged"
                className="brain-lightbox-img"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
