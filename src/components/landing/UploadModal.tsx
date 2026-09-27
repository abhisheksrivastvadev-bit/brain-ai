import React, { useState } from 'react'
import { UploadCloudIcon, CloseIcon } from '../icons'
import type { DocumentItem } from '../../types'
import './UploadModal.css'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (newDoc: DocumentItem) => void
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [docName, setDocName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0].name, `${Math.round(e.dataTransfer.files[0].size / 1024)} KB`)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0].name, `${Math.round(e.target.files[0].size / 1024)} KB`)
    }
  }

  const processFile = (name: string, size: string) => {
    setIsProcessing(true)
    setTimeout(() => {
      const newDoc: DocumentItem = {
        id: `doc_${Date.now()}`,
        name: name.endsWith('.pdf') ? name : `${name}.pdf`,
        size: size || '1.1 MB',
        pages: Math.floor(Math.random() * 8) + 2,
        type: 'application/pdf',
        uploadedAt: 'Just now',
        previewSnippet: `Extracted contents of ${name}. Document successfully parsed and embedded into Brain AI Chroma vector index with hybrid reciprocal rank fusion.`,
        topics: ['RAG Context', 'Uploaded Document', 'Semantic Index'],
      }
      setIsProcessing(false)
      onUploadSuccess(newDoc)
      onClose()
    }, 900)
  }

  const handleManualAdd = () => {
    if (!docName.trim()) return
    processFile(docName.trim(), '850 KB')
    setDocName('')
  }

  return (
    <div className="brain-modal-overlay" onClick={onClose}>
      <div
        className="brain-modal-card brain-upload-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
      >
        <div className="brain-modal-header">
          <div className="brain-upload-modal-icon">
            <UploadCloudIcon size={20} />
          </div>
          <div className="brain-modal-header-info">
            <h3 className="brain-modal-title" id="upload-modal-title">
              Upload Document for RAG
            </h3>
            <span className="brain-modal-sub">
              Index PDFs, text files, or markdown to query with Nexora AI
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
          <div
            className={`brain-dropzone ${dragActive ? 'brain-dropzone--active' : ''} ${isProcessing ? 'brain-dropzone--loading' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <UploadCloudIcon size={36} className="brain-dropzone-icon" />
            <p className="brain-dropzone-primary">
              {isProcessing
                ? 'Parsing & Indexing Embeddings...'
                : 'Drag and drop your PDF or document here'}
            </p>
            <p className="brain-dropzone-sub">Supports PDF, DOCX, MD, TXT up to 50MB</p>
            <label className="brain-dropzone-browse-btn">
              <span>Browse File</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileInput}
                className="brain-file-input-hidden"
              />
            </label>
          </div>

          <div className="brain-upload-or-divider">
            <span>OR ADD BY FILENAME</span>
          </div>

          <div className="brain-upload-manual-row">
            <input
              type="text"
              placeholder="e.g. Architecture-Spec.pdf"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="brain-upload-input"
              onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
            />
            <button
              type="button"
              className="brain-modal-btn brain-modal-btn--primary"
              onClick={handleManualAdd}
              disabled={!docName.trim() || isProcessing}
            >
              Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
