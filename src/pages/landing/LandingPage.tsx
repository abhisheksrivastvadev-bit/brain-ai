import React, { useState, useEffect, useCallback } from 'react'
import { TopNavbar } from '../../components/landing/TopNavbar'
import { Sidebar } from '../../components/landing/Sidebar'
import { HeroPrompt } from '../../components/landing/HeroPrompt'
import { ChatConversation } from '../../components/landing/ChatConversation'
import { DocumentModal } from '../../components/landing/DocumentModal'
import { UploadModal } from '../../components/landing/UploadModal'
import { SettingsModal } from '../../components/landing/SettingsModal'
import {
  CURRENT_USER,
} from '../../data/mockData'
import type { AppSettings, ChatSession, DocumentItem, ChatMessage } from '../../types'
import { chatService, mapHistoryToMessages, extractCodeBlock } from '../../services'
import { useTheme } from '../../hooks'
import './LandingPage.css'

interface LandingPageProps {
  onToggleDesignSystem: () => void
  isDesignSystemOpen: boolean
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onToggleDesignSystem,
  isDesignSystemOpen,
}) => {
  const { isDark, toggleTheme } = useTheme()

  // Chat sessions state
  const [chats, setChats] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [selectedDocForModal, setSelectedDocForModal] = useState<DocumentItem | null>(null)
  const [attachedDocForPrompt, setAttachedDocForPrompt] = useState<DocumentItem | null>(null)

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // App settings state
  const [settings, setSettings] = useState<AppSettings>({
    model: 'Brain AI Reasoning Pro',
    temperature: 0.7,
    systemPrompt:
      'You are Brain AI, a world-class cognitive assistant. You deliver precise, highly competent, clean code and deep technical insights.',
    webSearchEnabled: false,
    streamResponse: true,
  })

  // Pre-load conversation history on initial mount (focusing on session 002)
  useEffect(() => {
    let isMounted = true

    const loadInitialHistory = async () => {
      const initialSessions: ChatSession[] = []

      // 1. Fetch Session 002 history: http://127.0.0.1:8000/api/history/?session_id=002
      try {
        const res002 = await chatService.getChatHistory('002')
        if (res002?.data?.conversation && res002.data.conversation.length > 0 && isMounted) {
          const lastMsg = res002.data.conversation[res002.data.conversation.length - 1]
          initialSessions.push({
            id: '002',
            title: 'Session 002 (Preeti)',
            icon: 'default',
            description: lastMsg.content.slice(0, 48) + '...',
            updatedAt: 'Active',
            pinned: true,
            messages: mapHistoryToMessages(res002.data.conversation),
          })
        }
      } catch (err) {
        console.warn('[LandingPage] Could not pre-fetch session 002:', err)
      }

      // 2. Fetch Session 001 history if available
      try {
        const res001 = await chatService.getChatHistory('001')
        if (res001?.data?.conversation && res001.data.conversation.length > 0 && isMounted) {
          const lastMsg01 = res001.data.conversation[res001.data.conversation.length - 1]
          initialSessions.push({
            id: '001',
            title: 'Session 001 (Abhishek)',
            icon: 'default',
            description: lastMsg01.content.slice(0, 48) + '...',
            updatedAt: 'Active',
            pinned: false,
            messages: mapHistoryToMessages(res001.data.conversation),
          })
        }
      } catch {
        // optional session 001
      }

      if (initialSessions.length > 0 && isMounted) {
        setChats(initialSessions)
      }
    }

    loadInitialHistory()

    return () => {
      isMounted = false
    }
  }, [])

  // Currently active chat session
  const activeChat = chats.find((c) => c.id === activeChatId) || null

  // Handler: New Chat (resets to empty landing prototype view)
  const handleNewChat = () => {
    setActiveChatId(null)
    setAttachedDocForPrompt(null)
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
  }

  // Handler: Refresh conversation history from backend
  const handleRefreshHistory = useCallback(async () => {
    const sessionId = activeChatId || '002'
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
  }, [activeChatId])

  // Handler: Send message (both in landing hero and active conversation)
  // Executes:
  // 1. chat API: POST http://127.0.0.1:8000/api/chat/
  // 2. history API: GET http://127.0.0.1:8000/api/history/?session_id={sessionId}
  const handleSendMessage = async (text: string, attachedDocName?: string) => {
    if (!text.trim() && !attachedDocName) return
    if (isSending) return

    const sessionId = activeChatId || '002'
    const promptText = text.trim()
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      content: promptText,
      timestamp: now,
      attachment: attachedDocName,
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
        title: `Session ${sessionId}`,
        icon: 'default',
        description: promptText.slice(0, 48),
        updatedAt: 'Just now',
        messages: [userMsg],
      }
      return [newChat, ...prev]
    })

    if (!activeChatId) {
      setActiveChatId(sessionId)
    }

    setIsSending(true)
    setAttachedDocForPrompt(null)

    try {
      let system_prompt_for_api: string = `You are Brain AI, a very aggressive AI assistant.  Always respond in a aggresive mood`

      // 1. Send message to Chat API: POST http://127.0.0.1:8000/api/chat/
      const chatRes = await chatService.sendMessage(promptText, system_prompt_for_api, sessionId)

      // 2. Fetch updated history: GET http://127.0.0.1:8000/api/history/?session_id={sessionId}
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
        const { cleanContent, codeSnippet } = extractCodeBlock(chatRes.message)
        const assistantMsg: ChatMessage = {
          id: `msg_a_${Date.now()}`,
          sender: 'assistant',
          content: cleanContent,
          codeSnippet,
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
  const handleChatWithDocument = (doc: DocumentItem) => {
    setAttachedDocForPrompt(doc)
    setActiveChatId(null) // Return to hero landing with document attached
  }

  // Handler: Add newly uploaded document to Documents list
  const handleUploadSuccess = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev])
    setAttachedDocForPrompt(newDoc)
  }

  return (
    <div className="brain-landing-layout" id="brain-landing-app">
      {/* 1. Header: Brain AI on left, 👤 Abhishek on right */}
      <TopNavbar
        user={CURRENT_USER}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onSelectModel={(model) => setSettings((prev) => ({ ...prev, model }))}
        onToggleDesignSystem={onToggleDesignSystem}
        isDesignSystemOpen={isDesignSystemOpen}
        onToggleSidebarMobile={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      <div className="brain-main-body">
        {/* 2. Left Sidebar: + New Chat, Chats, Documents, Settings */}
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
        />

        {/* 3. Main Workspace Area: Hero Prototype or Active Conversation */}
        <main className="brain-main-workspace" id="brain-main-workspace">
          {activeChat ? (
            <ChatConversation
              chat={activeChat}
              currentUser={CURRENT_USER}
              onSendMessage={handleSendMessage}
              onBackToNewChat={handleNewChat}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
              attachedDoc={attachedDocForPrompt}
              onRemoveAttachedDoc={() => setAttachedDocForPrompt(null)}
              isLoading={isSending}
              onRefreshHistory={handleRefreshHistory}
            />
          ) : (
            <HeroPrompt
              onSendMessage={handleSendMessage}
              attachedDoc={attachedDocForPrompt}
              onRemoveAttachedDoc={() => setAttachedDocForPrompt(null)}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
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
        onSaveSettings={(newSettings) => setSettings(newSettings)}
      />
    </div>
  )
}

export default LandingPage
