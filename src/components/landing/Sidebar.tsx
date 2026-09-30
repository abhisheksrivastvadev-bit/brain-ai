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
import type { ChatSession, DocumentItem, AppScreen } from '../../types'
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
  isLoggedIn?: boolean
  onNavigate?: (screen: AppScreen) => void
  onOpenAuth?: (mode: 'login' | 'register') => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenSettings,
  isOpenMobile,
  onCloseMobile,
  isLoggedIn = true,
  onNavigate,
  onOpenAuth,
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

          {/* Quick Filter Search - Only visible when logged in */}
          {isLoggedIn && (
            <div className="brain-sidebar-search">
              <SearchIcon size={14} className="brain-sidebar-search-icon" />
              <input
                type="text"
                id="sidebar-search-input"
                placeholder="Search chats..."
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
          )}
        </div>

        {/* If logged in: Show chats list and settings footer */}
        {isLoggedIn ? (
          <>
            <div className="brain-sidebar-scroll">
              {/* Section: Chats */}
              <div className="brain-nav-section" id="section-chats">
                <div className="brain-section-header">
                  <span className="brain-section-title">Chats</span>
                  {chats.length > 0 && <span className="brain-section-count">{chats.length}</span>}
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
                        <span className="brain-nav-item-icon">{getChatIcon(chat.icon)}</span>
                        <div className="brain-nav-item-content">
                          <div className="brain-nav-item-top-row">
                            <span className="brain-nav-item-title">{chat.title}</span>
                            {chat.updatedAt && (
                              <span className="brain-nav-item-time">{chat.updatedAt}</span>
                            )}
                          </div>
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
          </>
        ) : (
          /* When NOT logged in: only new chat is available, plus guest invitation banner at the bottom */
          <div
            className="brain-sidebar-guest-container"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          >
            <div className="brain-sidebar-guest-notice" id="sidebar-guest-prompt">
              <span className="brain-sidebar-guest-title">Save Your History</span>
              <p className="brain-sidebar-guest-desc">
                Sign in to save and sync your chat sessions, uploaded documents, and custom keys.
              </p>
              <button
                type="button"
                className="brain-auth-switch-btn"
                style={{ textAlign: 'left', fontWeight: 600, padding: 0 }}
                onClick={() => {
                  if (onOpenAuth) {
                    onOpenAuth('login')
                  } else {
                    onNavigate?.('login')
                  }
                  if (isOpenMobile) onCloseMobile()
                }}
                id="sidebar-guest-login-btn"
              >
                Log In or Register →
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
