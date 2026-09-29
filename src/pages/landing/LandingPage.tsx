import React, { useState, useEffect, useCallback } from 'react'
import { TopNavbar } from '../../components/landing/TopNavbar'
import { Sidebar } from '../../components/landing/Sidebar'
import { HeroPrompt } from '../../components/landing/HeroPrompt'
import { ChatConversation } from '../../components/landing/ChatConversation'
import { DocumentModal } from '../../components/landing/DocumentModal'
import { UploadModal } from '../../components/landing/UploadModal'
import { SettingsModal } from '../../components/landing/SettingsModal'
import type { AppSettings, ChatSession, DocumentItem, ChatMessage, User, AppScreen } from '../../types'
import { chatService, mapHistoryToMessages, extractCodeBlock, extractImages } from '../../services'
import { useTheme } from '../../hooks'
import { STORAGE_KEYS } from '../../constants/app.constants'
import './LandingPage.css'

const DEFAULT_SETTINGS: AppSettings = {
  model: 'Brain AI Reasoning Pro',
  temperature: 0.7,
  systemPrompt:
    'You are Brain AI, a world-class cognitive assistant. You deliver precise, highly competent, clean code and deep technical insights.',
  webSearchEnabled: false,
  streamResponse: true,
}

const getInitialSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (err) {
    console.warn('[LandingPage] Failed to load settings from localStorage:', err)
  }
  return DEFAULT_SETTINGS
}

interface LandingPageProps {
  onToggleDesignSystem: () => void
  isDesignSystemOpen: boolean
  user?: User | null
  onNavigate?: (screen: AppScreen) => void
  onOpenAuth?: (mode: 'login' | 'register') => void
  onLogout?: () => void
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onToggleDesignSystem,
  isDesignSystemOpen,
  user = null,
  onNavigate,
  onOpenAuth,
  onLogout,
}) => {
  const chatUser: User = user || {
    id: 'usr_guest',
    name: 'Guest User',
    email: '',
    role: 'guest',
  }
  const { isDark, toggleTheme } = useTheme()

  // Chat sessions state
  const [chats, setChats] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [selectedDocForModal, setSelectedDocForModal] = useState<DocumentItem | null>(null)

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // App settings state (persisted in localStorage)
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings)

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings)
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings))
    } catch (err) {
      console.warn('[LandingPage] Failed to save settings to localStorage:', err)
    }
  }

  const currentUserId = (user && user.role !== 'guest' ? (user.user_id || (user.id?.startsWith('usr_guest') ? null : user.id)) : null) || null

  // Pre-load conversation history dynamically based on real logged-in user_id
  useEffect(() => {
    let isMounted = true

    const loadUserHistory = async () => {
      // If user is not logged in, reset chats
      if (!currentUserId) {
        if (isMounted) {
          setChats([])
          setActiveChatId(null)
        }
        return
      }

      const initialSessions: ChatSession[] = []

      // 1. Fetch user's primary chat history dynamically: GET /api/chat/history/?session_id={currentUserId}
      try {
        const userRes = await chatService.getChatHistory(currentUserId)
        if (userRes?.data?.conversation && userRes.data.conversation.length > 0 && isMounted) {
          const msgs = userRes.data.conversation
          const lastMsg = msgs[msgs.length - 1]
          initialSessions.push({
            id: currentUserId,
            title: user?.name ? `${user.name}'s Chat` : 'Primary Chat',
            icon: 'default',
            description: lastMsg.content.slice(0, 48) + '...',
            updatedAt: 'Active',
            pinned: true,
            messages: mapHistoryToMessages(msgs),
          })
        }
      } catch (err) {
        console.warn(`[LandingPage] Could not pre-fetch chat history for user ${currentUserId}:`, err)
      }

      // 2. Fetch any additional saved chat sessions created by this user
      const userSessionsStorageKey = `brain_ai_user_sessions_${currentUserId}`
      try {
        const extraSessionIds: string[] = JSON.parse(localStorage.getItem(userSessionsStorageKey) || '[]')
        for (const sid of extraSessionIds) {
          if (sid !== currentUserId) {
            try {
              const extraRes = await chatService.getChatHistory(sid)
              if (extraRes?.data?.conversation && extraRes.data.conversation.length > 0 && isMounted) {
                const extraMsgs = extraRes.data.conversation
                const lastMsg = extraMsgs[extraMsgs.length - 1]
                const firstUserMsg = extraMsgs.find((m) => m.role === 'user')?.content || 'Chat Session'
                initialSessions.push({
                  id: sid,
                  title: firstUserMsg.slice(0, 24) + (firstUserMsg.length > 24 ? '...' : ''),
                  icon: 'default',
                  description: lastMsg.content.slice(0, 48) + '...',
                  updatedAt: 'Active',
                  pinned: false,
                  messages: mapHistoryToMessages(extraMsgs),
                })
              }
            } catch {
              // optional session fetch failure fallback
            }
          }
        }
      } catch (err) {
        console.warn('[LandingPage] Could not parse stored user session IDs:', err)
      }

      if (isMounted) {
        setChats(initialSessions)
      }
    }

    loadUserHistory()

    return () => {
      isMounted = false
    }
  }, [currentUserId, user?.name])

  // Currently active chat session
  const activeChat = chats.find((c) => c.id === activeChatId) || null

  // Handler: New Chat (resets to empty landing prototype view)
  const handleNewChat = () => {
    setActiveChatId(null)
  }

  // Handler: Select existing chat
  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId)
    setIsMobileSidebarOpen(false)
  }

  // Handler: Delete chat
  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChats((prev) => prev.filter((c) => c.id !== chatId))
    if (activeChatId === chatId) {
      setActiveChatId(null)
    }
    if (currentUserId) {
      try {
        const key = `brain_ai_user_sessions_${currentUserId}`
        const stored: string[] = JSON.parse(localStorage.getItem(key) || '[]')
        const updated = stored.filter((id) => id !== chatId)
        localStorage.setItem(key, JSON.stringify(updated))
      } catch {}
    }
  }

  // Handler: Refresh conversation history dynamically from backend
  const handleRefreshHistory = useCallback(async () => {
    const sessionId = activeChatId || currentUserId
    if (!sessionId) return
    setIsSending(true)
    try {
      const historyRes = await chatService.getChatHistory(sessionId)
      if (historyRes?.data?.conversation) {
        const syncedMessages = mapHistoryToMessages(historyRes.data.conversation)
        setChats((prev) =>
          prev.map((c) =>
            c.id === sessionId
              ? {
                ...c,
                updatedAt: 'Just now',
                messages: syncedMessages,
              }
              : c
          )
        )
      }
    } catch (err) {
      console.error('[LandingPage] Failed to sync history:', err)
    } finally {
      setIsSending(false)
    }
  }, [activeChatId, currentUserId])

  // Handler: Send message (both in landing hero and active conversation)
  // Executes:
  // 1. chat API: POST http://127.0.0.1:8000/api/chat/
  // 2. history API: GET http://127.0.0.1:8000/api/chat/history/?session_id={sessionId}
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return
    if (isSending) return

    // Dynamic session ID:
    // If activeChatId is set, use it.
    // If activeChatId is null:
    // - For logged-in user:
    //   If the main session (currentUserId) already exists and has messages, create a new session ID `${currentUserId}_${Date.now()}`.
    //   Otherwise, use `currentUserId`.
    // - For guest: create a temporary guest session `guest_${Date.now()}`.
    let sessionId = activeChatId
    let isNewExtraSession = false
    if (!sessionId) {
      if (currentUserId) {
        const existingMainChat = chats.find((c) => c.id === currentUserId)
        if (!existingMainChat || existingMainChat.messages.length === 0) {
          sessionId = currentUserId
        } else {
          sessionId = `${currentUserId}_${Date.now()}`
          isNewExtraSession = true
        }
      } else {
        sessionId = `guest_${Date.now()}`
      }
    }

    const promptText = text.trim()
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      content: promptText,
      timestamp: now,
    }

    // Persist new session ID in user's saved sessions list
    if (currentUserId && (isNewExtraSession || sessionId !== currentUserId)) {
      try {
        const key = `brain_ai_user_sessions_${currentUserId}`
        const stored: string[] = JSON.parse(localStorage.getItem(key) || '[]')
        if (!stored.includes(sessionId)) {
          stored.push(sessionId)
          localStorage.setItem(key, JSON.stringify(stored))
        }
      } catch {}
    }

    // Optimistically show user message and set active chat
    setChats((prev) => {
      const existing = prev.find((c) => c.id === sessionId)
      if (existing) {
        return prev.map((c) =>
          c.id === sessionId
            ? {
              ...c,
              messages: [...c.messages, userMsg],
              updatedAt: 'Just now',
            }
            : c
        )
      }
      const newChat: ChatSession = {
        id: sessionId,
        title: promptText.slice(0, 24) + (promptText.length > 24 ? '...' : ''),
        icon: 'default',
        description: promptText.slice(0, 48),
        updatedAt: 'Just now',
        messages: [userMsg],
      }
      return [newChat, ...prev]
    })

    if (activeChatId !== sessionId) {
      setActiveChatId(sessionId)
    }

    setIsSending(true)

    try {
      const system_prompt_for_api = settings.systemPrompt?.trim() || undefined

      // 1. Send message to Chat API: POST http://127.0.0.1:8000/api/chat/
      const chatRes = await chatService.sendMessage(promptText, system_prompt_for_api, sessionId)

      // 2. Fetch updated history: GET http://127.0.0.1:8000/api/chat/history/?session_id={sessionId}
      const historyRes = await chatService.getChatHistory(sessionId)

      if (historyRes?.data?.conversation && historyRes.data.conversation.length > 0) {
        const syncedMessages = mapHistoryToMessages(historyRes.data.conversation)
        setChats((prev) =>
          prev.map((c) =>
            c.id === sessionId
              ? {
                ...c,
                description: promptText.slice(0, 48),
                updatedAt: 'Just now',
                messages: syncedMessages,
              }
              : c
          )
        )
      } else {
        // Fallback: append assistant reply directly from chat response
        const { cleanContent: withoutCode, codeSnippet } = extractCodeBlock(chatRes.message)
        const { cleanContent, images: extractedImages } = extractImages(withoutCode)
        const directImage = chatRes.image_url || chatRes.imageUrl
        const allImages = [
          ...(directImage ? [directImage] : []),
          ...(chatRes.images || []),
          ...extractedImages,
        ].filter((img, idx, arr) => arr.indexOf(img) === idx)
        const imageUrl = allImages[0] || undefined

        const assistantMsg: ChatMessage = {
          id: `msg_a_${Date.now()}`,
          sender: 'assistant',
          content: cleanContent || (imageUrl ? 'Here is the generated image:' : chatRes.message),
          codeSnippet,
          imageUrl,
          images: allImages.length > 0 ? allImages : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setChats((prev) =>
          prev.map((c) =>
            c.id === sessionId
              ? { ...c, messages: [...c.messages, assistantMsg], updatedAt: 'Just now' }
              : c
          )
        )
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown communication error'
      console.error('[LandingPage] Chat API Error:', err)
      const errorAssistantMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        content: `⚠️ **Connection Error**\n\nCould not reach the Brain AI backend at http://127.0.0.1:8000.\n- **Details**: \`${errorMsg}\`\n\nPlease ensure \`python run.py\` is running.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setChats((prev) =>
        prev.map((c) =>
          c.id === sessionId
            ? { ...c, messages: [...c.messages, errorAssistantMsg], updatedAt: 'Just now' }
            : c
        )
      )
    } finally {
      setIsSending(false)
    }
  }

  // Handler: Click Document in Sidebar -> open inspection modal
  const handleSelectDocument = (doc: DocumentItem) => {
    setSelectedDocForModal(doc)
  }

  // Handler: "Chat with this document" from Document Modal
  const handleChatWithDocument = () => {
    setActiveChatId(null)
  }

  // Handler: Add newly uploaded document to Documents list
  const handleUploadSuccess = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev])
  }

  // Intercept navigation to 'login' and 'register' to open popup modal instead of screen
  const handleNavigate = (targetScreen: AppScreen) => {
    if (targetScreen === 'login') {
      onOpenAuth?.('login')
      return
    }
    if (targetScreen === 'register') {
      onOpenAuth?.('register')
      return
    }
    onNavigate?.(targetScreen)
  }

  return (
    <div className="brain-landing-layout" id="brain-landing-app">
      {/* 1. Header: Brain AI on left, User profile or Log In/Sign Up buttons on right */}
      <TopNavbar
        user={user ?? null}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onSelectModel={(model) => handleUpdateSettings({ ...settings, model })}
        onToggleDesignSystem={onToggleDesignSystem}
        isDesignSystemOpen={isDesignSystemOpen}
        onToggleSidebarMobile={() => setIsMobileSidebarOpen((prev) => !prev)}
        onNavigate={handleNavigate}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
      />

      <div className="brain-main-body">
        {/* 2. Left Sidebar: If unauthenticated, only + New Chat is shown */}
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          documents={documents}
          selectedDocId={selectedDocForModal?.id || null}
          onSelectDocument={handleSelectDocument}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isLoggedIn={Boolean(user)}
          onNavigate={handleNavigate}
          onOpenAuth={onOpenAuth}
        />

        {/* 3. Main Workspace Area: Hero Prototype or Active Conversation */}
        <main className="brain-main-workspace" id="brain-main-workspace">
          {activeChat ? (
            <ChatConversation
              chat={activeChat}
              currentUser={chatUser}
              onSendMessage={handleSendMessage}
              onBackToNewChat={handleNewChat}
              isLoading={isSending}
              onRefreshHistory={handleRefreshHistory}
            />
          ) : (
            <HeroPrompt
              onSendMessage={handleSendMessage}
              activeModel={settings.model}
              isLoading={isSending}
            />
          )}
        </main>
      </div>

      {/* 4. Modals */}
      <DocumentModal
        document={selectedDocForModal}
        onClose={() => setSelectedDocForModal(null)}
        onChatWithDocument={handleChatWithDocument}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        user={user}
      />
    </div>
  )
}

export default LandingPage
