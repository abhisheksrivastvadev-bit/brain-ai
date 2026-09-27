import React, { useState, useMemo } from 'react'
import {
  PlusIcon,
  SearchIcon,
  CodeIcon,
  DatabaseIcon,
  BotIcon,
  SettingsIcon,
  PinIcon,
  TrashIcon,
  CloseIcon,
  SparklesIcon,
} from '../icons'
import type { ChatSession, DocumentItem } from '../../types'
import './Sidebar.css'

interface SidebarProps {
  chats: ChatSession[]
  activeChatId: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string, e: React.MouseEvent) => void
  documents: DocumentItem[]
  selectedDocId: string | null
  onSelectDocument: (doc: DocumentItem) => void
  onOpenUploadModal: () => void
  onOpenSettings: () => void
  isOpenMobile: boolean
  onCloseMobile: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  documents: _documents,
  selectedDocId: _selectedDocId,
  onSelectDocument: _onSelectDocument,
  onOpenUploadModal: _onOpenUploadModal,
  onOpenSettings,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats
    const q = searchQuery.toLowerCase()
    return chats.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    )
  }, [chats, searchQuery])

  const getChatIcon = (iconType: string) => {
    switch (iconType) {
      case 'python':
        return <CodeIcon size={16} className="brain-chat-item-icon brain-icon--python" />
      case 'react':
        return <span className="brain-chat-item-icon brain-icon--react">⚛</span>
      case 'rag':
        return <DatabaseIcon size={16} className="brain-chat-item-icon brain-icon--rag" />
      case 'agent':
        return <BotIcon size={16} className="brain-chat-item-icon brain-icon--agent" />
      default:
        return <SparklesIcon size={16} className="brain-chat-item-icon" />
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="brain-sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`brain-sidebar ${isOpenMobile ? 'brain-sidebar--mobile-open' : ''}`}
        id="brain-main-sidebar"
        aria-label="Navigation Sidebar"
      >
        {/* Top: New Chat Button & Search */}
        <div className="brain-sidebar-header">
          {/* Mobile close button */}
          <div className="brain-sidebar-mobile-header">
            <span className="brain-sidebar-mobile-title">Brain AI Menu</span>
            <button
              type="button"
              className="brain-sidebar-close-btn"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <CloseIcon size={18} />
            </button>
          </div>

          {/* + New Chat Button (Prominent Action) */}
          <button
            type="button"
            className={`brain-btn-new-chat ${activeChatId === null ? 'brain-btn-new-chat--active' : ''}`}
            id="btn-new-chat"
            onClick={() => {
              onNewChat()
              if (isOpenMobile) onCloseMobile()
            }}
          >
            <span className="brain-new-chat-icon-box">
              <PlusIcon size={16} />
            </span>
            <span className="brain-new-chat-text">+ New Chat</span>
          </button>

          {/* Quick Filter Search */}
          <div className="brain-sidebar-search">
            <SearchIcon size={14} className="brain-sidebar-search-icon" />
            <input
              type="text"
              id="sidebar-search-input"
              placeholder="Search chats & docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="brain-sidebar-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="brain-sidebar-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <CloseIcon size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable list of Chats & Documents */}
        <div className="brain-sidebar-scroll">
          {/* Section: Chats */}
          <div className="brain-nav-section" id="section-chats">
            <div className="brain-section-header">
              <span className="brain-section-title">Chats</span>
              {
                chats.length > 0 &&
                <span className="brain-section-count">{chats.length}</span>
              }
            </div>

            <div className="brain-nav-list" role="list">
              {filteredChats.map((chat) => {
                const isActive = activeChatId === chat.id
                return (
                  <div
                    key={chat.id}
                    className={`brain-nav-item brain-chat-nav-item ${isActive ? 'active' : ''}`}
                    id={`chat-item-${chat.id}`}
                    role="listitem"
                    onClick={() => {
                      onSelectChat(chat.id)
                      if (isOpenMobile) onCloseMobile()
                    }}
                  >
                    <span className="brain-nav-item-icon">
                      {getChatIcon(chat.icon)}
                    </span>
                    <div className="brain-nav-item-content">
                      <span className="brain-nav-item-title">{chat.title}</span>
                      <span className="brain-nav-item-sub">{chat.description}</span>
                    </div>

                    {chat.pinned && (
                      <span title="Pinned">
                        <PinIcon size={12} className="brain-pinned-icon" />
                      </span>
                    )}

                    <div className="brain-item-actions">
                      <button
                        type="button"
                        className="brain-item-action-btn brain-item-action--delete"
                        id={`delete-${chat.id}`}
                        onClick={(e) => onDeleteChat(chat.id, e)}
                        aria-label={`Delete ${chat.title} chat`}
                        title="Delete chat"
                      >
                        <TrashIcon size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}

              {filteredChats.length === 0 && (
                <div className="brain-empty-nav-state">No matching chats</div>
              )}
            </div>
          </div>

          {/* Section: Documents */}
          {/* <div className="brain-nav-section" id="section-documents">
            <div className="brain-section-header">
              <span className="brain-section-title">Documents</span>
              <div className="brain-section-header-actions">
                <span className="brain-section-count">{documents.length}</span>
                <button
                  type="button"
                  className="brain-section-add-btn"
                  id="btn-upload-document"
                  onClick={onOpenUploadModal}
                  aria-label="Upload document"
                  title="Upload document"
                >
                  <UploadCloudIcon size={14} />
                </button>
              </div>
            </div>
            <div className="brain-section-divider" />

            <div className="brain-nav-list" role="list">
              {filteredDocs.map((doc) => {
                const isSelected = selectedDocId === doc.id
                return (
                  <div
                    key={doc.id}
                    className={`brain-nav-item brain-doc-nav-item ${isSelected ? 'active' : ''}`}
                    id={`doc-item-${doc.id}`}
                    role="listitem"
                    onClick={() => {
                      onSelectDocument(doc)
                      if (isOpenMobile) onCloseMobile()
                    }}
                  >
                    <span className="brain-nav-item-icon brain-doc-icon-badge">
                      <FileTextIcon size={16} />
                    </span>
                    <div className="brain-nav-item-content">
                      <span className="brain-nav-item-title">{doc.name}</span>
                      <span className="brain-nav-item-sub">
                        {doc.size} • {doc.pages} pgs
                      </span>
                    </div>
                    <span className="brain-doc-status-badge">RAG</span>
                  </div>
                )
              })}

              {filteredDocs.length === 0 && (
                <div className="brain-empty-nav-state">No matching documents</div>
              )}
            </div>
          </div> */}
        </div>

        {/* Sidebar Footer: Token usage & Settings */}
        <div className="brain-sidebar-footer">

          <button
            type="button"
            className="brain-sidebar-settings-btn"
            id="btn-sidebar-settings"
            onClick={onOpenSettings}
            aria-label="Open Settings"
          >
            <SettingsIcon size={18} className="brain-settings-icon" />
            <span className="brain-settings-text">Settings</span>
            <span className="brain-settings-sub">v2.5</span>
          </button>
        </div>
      </aside>
    </>
  )
}
