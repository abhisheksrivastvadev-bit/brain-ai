import React, { useState } from 'react'
import { TopNavbar } from '../components/landing/TopNavbar'
import { Sidebar } from '../components/landing/Sidebar'
import { HeroPrompt } from '../components/landing/HeroPrompt'
import { ChatConversation } from '../components/landing/ChatConversation'
import { DocumentModal } from '../components/landing/DocumentModal'
import { UploadModal } from '../components/landing/UploadModal'
import { SettingsModal } from '../components/landing/SettingsModal'
import {
  CURRENT_USER,
  INITIAL_CHATS,
  INITIAL_DOCUMENTS,
} from '../data/mockData'
import type { AppSettings, ChatSession, DocumentItem } from '../types'
import { useTheme } from '../hooks'
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

  // Chat sessions state (initialized with Python, React, RAG, AI Agents from wireframe)
  const [chats, setChats] = useState<ChatSession[]>(INITIAL_CHATS)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)

  // Documents state (Resume.pdf, Project.pdf from wireframe)
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS)
  const [selectedDocForModal, setSelectedDocForModal] = useState<DocumentItem | null>(null)
  const [attachedDocForPrompt, setAttachedDocForPrompt] = useState<DocumentItem | null>(null)

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // App settings state
  const [settings, setSettings] = useState<AppSettings>({
    model: 'Nexora Ultra 3.5',
    temperature: 0.7,
    systemPrompt:
      'You are Nexora, a world-class cognitive AI built by Brain AI. You deliver precise, highly competent, clean code and deep technical insights.',
    webSearchEnabled: false,
    streamResponse: true,
  })

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

  // Handler: Send message (either in landing hero or active conversation)
  const handleSendMessage = (text: string, attachedDocName?: string) => {
    if (!text.trim() && !attachedDocName) return

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg = {
      id: `msg_u_${Date.now()}`,
      sender: 'user' as const,
      content: text || `Please analyze ${attachedDocName}`,
      timestamp: now,
      attachment: attachedDocName,
    }

    // Generate intelligent contextual response
    const generateAiResponse = (prompt: string, docContext?: string) => {
      const lower = prompt.toLowerCase()

      if (lower.includes('python') || lower.includes('gil')) {
        return {
          content:
            'In **CPython 3.13**, the removal of the Global Interpreter Lock (GIL) enables true multi-core parallel execution across CPU threads.\n\n### Practical Recommendations:\n- Use `ThreadPoolExecutor` for CPU-intensive mathematical or data transformation batches.\n- Ensure extensions (C/C++ or PyO3) are built with the free-threaded ABI.\n- `asyncio` remains best for event-driven concurrent networking.',
          codeSnippet: {
            language: 'python',
            title: 'free_threaded_demo.py',
            code: `import threading

def worker_task(worker_id: int):
    acc = sum(x * x for x in range(5_000_000))
    print(f"Worker {worker_id} computed {acc}")

threads = [threading.Thread(target=worker_task, args=(i,)) for i in range(4)]
for t in threads: t.start()
for t in threads: t.join()`,
          },
          reasoning: 'Evaluated PEP 703 specifications and multi-core CPU scheduling behavior.',
        }
      }

      if (lower.includes('react') || lower.includes('hook') || lower.includes('debounce')) {
        return {
          content:
            'Here is a robust, production-ready **TypeScript** debounce hook for React 19:\n\n- Automatically cancels timeouts on dependency changes or unmount\n- Supports parameterized debounce intervals',
          codeSnippet: {
            language: 'typescript',
            title: 'useDebounce.ts',
            code: `import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}`,
          },
          reasoning: 'Applied React 19 useEffect lifecycle rules and memory leak prevention.',
        }
      }

      if (lower.includes('rag') || lower.includes('vector') || lower.includes('bm25')) {
        return {
          content:
            '### Optimal Hybrid RAG Pipeline Architecture:\n1. **Dual Indexing**: Vector index (e.g. HNSW dense embeddings) + Lexical index (BM25).\n2. **RRF (Reciprocal Rank Fusion)**: Merges candidates based on rank reciprocal weights.\n3. **Cross-Encoder Reranking**: Re-evaluates top 40 candidates to extract the 5 highest-relevance passages for context injection.',
          reasoning: 'Constructed hybrid retrieval topology with reciprocal rank fusion formulation.',
        }
      }

      if (docContext || lower.includes('resume') || lower.includes('project')) {
        return {
          content: `### Document Analysis for **${docContext || 'Uploaded Context'}**:\n- **Overview**: Document parsed via Brain AI Vector Ingestion.\n- **Key Highlights**: High proficiency in full-stack architecture, React, Python, RAG pipelines, and autonomous AI agents.\n- **Recommendation**: Ready for interactive contextual Q&A.`,
          reasoning: `Extracted semantic chunking and embedding matches from ${docContext || 'context document'}.`,
        }
      }

      return {
        content: `I've processed your query with **${settings.model}**:\n\n> "${text}"\n\nNexora has synthesized a verified response following your system instructions. How would you like to proceed or expand on this topic?`,
        reasoning: 'Evaluated intent, retrieved relevant cognitive memory, and synthesized output.',
      }
    }

    const aiRes = generateAiResponse(text, attachedDocName)
    const assistantMsg = {
      id: `msg_a_${Date.now() + 1}`,
      sender: 'assistant' as const,
      content: aiRes.content,
      timestamp: now,
      codeSnippet: aiRes.codeSnippet,
      reasoning: aiRes.reasoning,
    }

    if (activeChatId) {
      // Append to active chat
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, messages: [...c.messages, userMsg, assistantMsg], updatedAt: 'Just now' }
            : c
        )
      )
    } else {
      // Create new chat and set it active
      const title = text.slice(0, 24).trim() || attachedDocName || 'New Conversation'
      const newChat: ChatSession = {
        id: `chat_${Date.now()}`,
        title,
        icon: 'default',
        description: text.slice(0, 48),
        updatedAt: 'Just now',
        messages: [userMsg, assistantMsg],
      }
      setChats((prev) => [newChat, ...prev])
      setActiveChatId(newChat.id)
    }

    // Reset attached document after sending
    setAttachedDocForPrompt(null)
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
        activeModel={settings.model}
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
              activeModel={settings.model}
            />
          ) : (
            <HeroPrompt
              onSendMessage={handleSendMessage}
              attachedDoc={attachedDocForPrompt}
              onRemoveAttachedDoc={() => setAttachedDocForPrompt(null)}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
              activeModel={settings.model}
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
