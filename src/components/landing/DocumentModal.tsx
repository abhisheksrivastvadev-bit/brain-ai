import React from 'react'
import {
  FileTextIcon,
  CloseIcon,
  SparklesIcon,
  DatabaseIcon,
} from '../icons'
import type { DocumentItem } from '../../types'
import './DocumentModal.css'

interface DocumentModalProps {
  document: DocumentItem | null
  onClose: () => void
  onChatWithDocument: (doc: DocumentItem) => void
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  document,
  onClose,
  onChatWithDocument,
}) => {
  if (!document) return null

  return (
    <div className="brain-modal-overlay" onClick={onClose}>
      <div
        className="brain-modal-card brain-doc-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-modal-title"
      >
        <div className="brain-modal-header">
          <div className="brain-doc-modal-icon-badge">
            <FileTextIcon size={20} />
          </div>
          <div className="brain-modal-header-info">
            <h3 className="brain-modal-title" id="doc-modal-title">
              {document.name}
            </h3>
            <span className="brain-modal-sub">
              {document.size} • {document.pages} Pages • Indexed via Brain RAG
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

        <div className="brain-modal-body">
          <div className="brain-doc-status-banner">
            <div className="brain-doc-status-left">
              <span className="brain-doc-indexed-dot" />
              <span className="brain-doc-indexed-text">Vector Embeddings Active</span>
            </div>
            <span className="brain-doc-indexed-model">text-embedding-3-small</span>
          </div>

          <div className="brain-doc-field">
            <label className="brain-doc-label">Extracted Semantic Summary</label>
            <div className="brain-doc-snippet">
              <pre>{document.previewSnippet}</pre>
            </div>
          </div>

          <div className="brain-doc-field">
            <label className="brain-doc-label">Indexed Topic Tags</label>
            <div className="brain-doc-tags">
              {document.topics.map((t, idx) => (
                <span key={idx} className="brain-doc-topic-pill">
                  <DatabaseIcon size={12} />
                  {t}
                </span>
              ))}
            </div>
          </div>
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
            onClick={() => {
              onChatWithDocument(document)
              onClose()
            }}
          >
            <SparklesIcon size={16} />
            <span>Chat with this Document</span>
          </button>
        </div>
      </div>
    </div>
  )
}
