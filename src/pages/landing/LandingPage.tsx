import React, { useState, useEffect, useCallback } from 'react'
import { TopNavbar } from '../../components/landing/TopNavbar'
import { Sidebar } from '../../components/landing/Sidebar'
import { HeroPrompt } from '../../components/landing/HeroPrompt'
import { ChatConversation } from '../../components/landing/ChatConversation'
import { DocumentModal } from '../../components/landing/DocumentModal'
import { UploadModal } from '../../components/landing/UploadModal'
import { SettingsModal } from '../../components/landing/SettingsModal'
import type { AppSettings, ChatSession, DocumentItem, ChatMessage, User, AppScreen } from '../../types'
import {
  chatService,
  mapHistoryToMessages,
  parseChatSessionsFromHistory,
  extractCodeBlock,
  extractImages,
  dataManager,
} from '../../services'
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
  const [activeChatId, setActiveChatId] = useState<string | null>(() => dataManager.getActiveSessionId())
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

  const currentUserId =
    dataManager.getUserId() ||
    (user && user.role !== 'guest' ? (user.user_id || (user.id?.startsWith('usr_guest') ? null : user.id)) : null) ||
    null

  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Pre-load conversation history dynamically based on real logged-in user_id
  useEffect(() => {
    let isMounted = true

    const loadUserHistory = async () => {
      const effectiveUserId =
        currentUserId ||
        dataManager.getUserId() ||
        (user && user.role !== 'guest' ? (user.user_id || (user.id?.startsWith('usr_guest') ? null : user.id)) : null) ||
        null

      // If user is not logged in, reset chats
      if (!effectiveUserId) {
        if (isMounted) {
          setChats([])
          setActiveChatId(null)
          dataManager.setActiveSessionId(null)
        }
        return
      }

      try {
        // API 1: Fetch all conversations for sidebar display
        // GET /api/chat/history?user_id={effectiveUserId}
        const res = await chatService.getConversations(effectiveUserId)
        if (!isMounted) return

        const conversationData = res?.data?.conversation
        const parsedSessions = parseChatSessionsFromHistory(conversationData, new Date(), effectiveUserId)

        if (parsedSessions.length > 0 && isMounted) {
          // Sort newest sessions at the top based on updatedAtRaw
          const orderedSessions = [...parsedSessions].sort((a, b) => {
            const timeA = a.updatedAtRaw ? new Date(a.updatedAtRaw).getTime() : 0
            const timeB = b.updatedAtRaw ? new Date(b.updatedAtRaw).getTime() : 0
            return timeB - timeA
          })

          // Sync all session IDs to dataManager
          for (const s of orderedSessions) {
            dataManager.saveUserSession(s.id, effectiveUserId)
          }

          // Determine which session should be active
          const savedActiveId = dataManager.getActiveSessionId()
          const matchedSession = orderedSessions.find((s) => s.id === savedActiveId)
          const targetSession = matchedSession || orderedSessions[0]

          setActiveChatId(targetSession.id)
          dataManager.setActiveSessionId(targetSession.id)
          setChats(orderedSessions)

          // API 2: Fetch full messages for the active session
          // GET /api/chat/history/{session_id}?user_id={effectiveUserId}
          try {
            const sessionRes = await chatService.getSessionMessages(targetSession.id, effectiveUserId)
            if (isMounted && sessionRes?.data?.messages) {
              const fullMessages = mapHistoryToMessages(
                sessionRes.data.messages,
                new Date(),
                targetSession.id
              )
              setChats((prev) =>
                prev.map((c) =>
                  c.id === targetSession.id
                    ? { ...c, messages: fullMessages }
                    : c
                )
              )
            }
          } catch (sessionErr) {
            console.warn('[LandingPage] Failed to load messages for active session:', sessionErr)
          }
        } else if (isMounted) {
          setChats([])
          setActiveChatId(null)
          dataManager.setActiveSessionId(null)
        }
      } catch (err) {
        console.warn('[LandingPage] Failed to load chat history on mount:', err)
      }
    }

    loadUserHistory()

    return () => {
      isMounted = false
    }
  }, [currentUserId, user])

  // Currently active chat session
  const activeChat = chats.find((c) => c.id === activeChatId) || null

  // Handler: New Chat (resets to empty landing prototype view so next message gets a new random session_id)
  const handleNewChat = () => {
    setActiveChatId(null)
    dataManager.setActiveSessionId(null)
  }

  // Handler: Select existing chat
  const handleSelectChat = async (chatId: string) => {
    setActiveChatId(chatId)
    dataManager.setActiveSessionId(chatId)
    setIsMobileSidebarOpen(false)

    const effectiveUserId =
      currentUserId ||
      dataManager.getUserId() ||
      (user && user.role !== 'guest' ? (user.user_id || (user.id?.startsWith('usr_guest') ? null : user.id)) : null) ||
      null

    if (effectiveUserId) {
      const target = chats.find((c) => c.id === chatId)
      if (!target || target.messages.length === 0) {
        setIsLoadingMessages(true)
      }
      try {
        // API 2: Fetch conversation messages for selected session
        // GET /api/chat/history/{chatId}?user_id={effectiveUserId}
        const sessionRes = await chatService.getSessionMessages(chatId, effectiveUserId)
        if (sessionRes?.data?.messages) {
          const loadedMessages = mapHistoryToMessages(
            sessionRes.data.messages,
            new Date(),
            chatId
          )
          setChats((prev) =>
            prev.map((c) =>
              c.id === chatId
                ? { ...c, messages: loadedMessages }
                : c
            )
          )
        }
      } catch (err) {
        console.error(`[LandingPage] Failed to load messages for session ${chatId}:`, err)
      } finally {
        setIsLoadingMessages(false)
      }
    }
  }

  // Handler: Delete chat
  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChats((prev) => prev.filter((c) => c.id !== chatId))
    if (activeChatId === chatId) {
      setActiveChatId(null)
      dataManager.setActiveSessionId(null)
    }
    if (currentUserId) {
      dataManager.removeUserSession(chatId, currentUserId)
    }
  }

  // Handler: Refresh conversation history dynamically from backend
  const handleRefreshHistory = useCallback(async () => {
    const sessionId = activeChatId
    const effectiveUserId = currentUserId || dataManager.getUserId() || undefined
    if (!sessionId) return
    setIsSending(true)
    try {
      // 1. Fetch latest messages for active session (API 2)
      const sessionRes = await chatService.getSessionMessages(sessionId, effectiveUserId)
      if (sessionRes?.data?.messages) {
        const syncedMessages = mapHistoryToMessages(
          sessionRes.data.messages,
          new Date(),
          sessionId
        )
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

      // 2. Sync sidebar conversation list in background (API 1)
      if (effectiveUserId) {
        const convRes = await chatService.getConversations(effectiveUserId)
        if (convRes?.data?.conversation) {
          const parsed = parseChatSessionsFromHistory(convRes.data.conversation, new Date(), effectiveUserId)
          if (parsed.length > 0) {
            setChats((prev) =>
              parsed.map((p) => {
                const existing = prev.find((e) => e.id === p.id)
                return existing && existing.messages.length > 0
                  ? { ...p, messages: existing.messages }
                  : p
              })
            )
          }
        }
      }
    } catch (err) {
      console.error('[LandingPage] Failed to sync history:', err)
    } finally {
      setIsSending(false)
    }
  }, [activeChatId, currentUserId])

  // Handler: Send message (both in landing hero and active conversation)
  // Executes:
  // 1. POST /api/chat/
  //    Payload: { user_id?: currentUserId, session_id: sessionId, message: promptText, system_prompt?: ... }
  // 2. API 2: GET /api/chat/history/{sessionId}?user_id={user_id}
  // 3. API 1: GET /api/chat/history?user_id={user_id} (syncs sidebar sessions)
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return
    if (isSending) return

    // Dynamic session ID:
    // If activeChatId is already set, continue using that chat session.
    // If activeChatId is null (user is starting a new chat):
    // generate a brand new random session ID so every new chat has a unique session ID.
    let sessionId = activeChatId
    let isNewChatSession = false

    if (!sessionId) {
      sessionId = dataManager.generateSessionId()
      isNewChatSession = true
    }

    const promptText = text.trim()
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      content: promptText,
      timestamp: now,
    }

    const effectiveUserId =
      currentUserId ||
      dataManager.getUserId() ||
      (user && user.role !== 'guest' ? (user.user_id || (user.id?.startsWith('usr_guest') ? null : user.id)) : null) ||
      undefined

    // Persist new session ID in user's saved sessions list
    if (effectiveUserId && isNewChatSession) {
      dataManager.saveUserSession(sessionId, effectiveUserId)
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
              description: promptText.slice(0, 48),
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
      dataManager.setActiveSessionId(sessionId)
    }

    setIsSending(true)

    try {
      const system_prompt_for_api = settings.systemPrompt?.trim() || undefined

      // 1. Send message to Chat API: POST /api/chat/
      const chatRes = await chatService.sendMessage(
        promptText,
        system_prompt_for_api,
        sessionId,
        effectiveUserId
      )

      // 2. Fetch updated messages: API 2 GET /api/chat/history/{sessionId}?user_id={user_id}
      let syncedMessages: ChatMessage[] = []
      try {
        const sessionRes = await chatService.getSessionMessages(sessionId, effectiveUserId)
        if (sessionRes?.data?.messages && sessionRes.data.messages.length > 0) {
          syncedMessages = mapHistoryToMessages(sessionRes.data.messages, new Date(), sessionId)
        }
      } catch (sessionErr) {
        console.warn('[LandingPage] Failed to fetch session messages from API 2:', sessionErr)
      }

      if (syncedMessages.length > 0) {
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

      // 3. Sync sidebar conversation list in background: API 1 GET /api/chat/history?user_id={user_id}
      if (effectiveUserId) {
        try {
          const convRes = await chatService.getConversations(effectiveUserId)
          if (convRes?.data?.conversation) {
            const parsed = parseChatSessionsFromHistory(convRes.data.conversation, new Date(), effectiveUserId)
            if (parsed.length > 0) {
              setChats((prev) =>
                parsed.map((p) => {
                  const existing = prev.find((e) => e.id === p.id)
                  return existing && existing.messages.length > 0
                    ? { ...p, messages: existing.messages }
                    : p
                })
              )
            }
          }
        } catch (convErr) {
          console.warn('[LandingPage] Failed to sync sidebar conversations:', convErr)
        }
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
    dataManager.setActiveSessionId(null)
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
              isLoading={isSending || isLoadingMessages}
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
