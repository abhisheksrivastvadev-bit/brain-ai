/**
 * Brain AI - Chat & History Service
 * Connects to:
 * 1. POST /api/chat/
 *    Payload:
 *    {
 *      "user_id": "string", (optional, included if user logged in)
 *      "session_id": "string",
 *      "message": "string",
 *      "system_prompt": "string" (optional)
 *    }
 * 2. API 1: GET /api/chat/history?user_id={user_id}
 *    For all conversation history to show in the sidebar
 * 3. API 2: GET /api/chat/history/{session_id}?user_id={user_id}
 *    For messages in a specific conversation session
 */

import type {
  ChatHistoryItem,
  ChatMessage,
  ChatPostRequest,
  ChatPostResponse,
  ChatSession,
  ConversationListResponse,
  ConversationSummaryItem,
  SessionHistoryResponse,
} from '../types'
import { dataManager } from '../utils/dataManager'
import { authService } from './auth.service'

// Base URL: In dev, '/api' proxies to http://127.0.0.1:8000/api in vite.config.ts
const envProcess = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })?.process
const API_BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  envProcess?.env?.VITE_API_URL ||
  '/api'
).replace(/\/$/, '')

/**
 * Formats ISO date/time into friendly relative timestamp (e.g. "Just now", "5m ago", "2h ago", "Yesterday")
 */
export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Active'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Active'

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHours = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSec < 60) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch {
    return 'Active'
  }
}

/**
 * Extracts first markdown code block (```lang ... ```) if present
 */
export function extractCodeBlock(content: string): {
  cleanContent: string
  codeSnippet?: { language: string; code: string; title?: string }
} {
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/
  const match = content.match(codeBlockRegex)

  if (match) {
    const language = match[1] || 'text'
    const code = match[2].trim()
    const cleanContent = content.replace(codeBlockRegex, '').trim()
    return {
      cleanContent: cleanContent || 'Code snippet:',
      codeSnippet: {
        language,
        code,
        title: `${language}_snippet`,
      },
    }
  }

  return { cleanContent: content }
}

/**
 * Extracts markdown images (![alt](url)), HTML <img> tags, or base64 data URIs
 * Cleans content of bulky image data tags and collects image URLs
 */
export function extractImages(content: string): {
  cleanContent: string
  images: string[]
} {
  const images: string[] = []

  // 1. Match Markdown images: ![alt](url)
  const mdImgRegex = /!\[([^\]]*)\]\(((?:https?:\/\/[^\s)]+|data:image\/[a-zA-Z0-9.+_-]+;base64,[^\s)]+))\)/g
  let match: RegExpExecArray | null
  while ((match = mdImgRegex.exec(content)) !== null) {
    if (match[2] && !images.includes(match[2])) {
      images.push(match[2])
    }
  }

  // 2. Match HTML <img> tags: <img ... src="..." ... />
  const htmlImgRegex = /<img\s+[^>]*src=["']((?:https?:\/\/[^"']+|data:image\/[a-zA-Z0-9.+_-]+;base64,[^"']+))["'][^>]*\/?>/gi
  while ((match = htmlImgRegex.exec(content)) !== null) {
    if (match[1] && !images.includes(match[1])) {
      images.push(match[1])
    }
  }

  // Clean the text by removing raw markdown image / data URIs
  let cleanContent = content.replace(mdImgRegex, '').trim()
  cleanContent = cleanContent.replace(htmlImgRegex, '').trim()

  return {
    cleanContent,
    images,
  }
}

/**
 * Safely extracts an array of ChatHistoryItem for a given sessionId from raw conversation response.
 * Handles:
 * 1. Direct array of messages: ChatHistoryItem[]
 * 2. API 2 response object: { messages: ChatHistoryItem[] }
 * 3. Nested data object: { data: { messages: [...] } }
 * 4. Dictionary of sessions: { "session_001": [...] }
 */
export function extractMessagesForSession(
  conversation: unknown,
  targetSessionId?: string | null
): ChatHistoryItem[] {
  if (!conversation) return []

  // 1. Direct array of messages
  if (Array.isArray(conversation)) {
    // If it's an array of conversation summaries (API 1), don't treat them as chat messages
    if (
      conversation.length > 0 &&
      typeof conversation[0] === 'object' &&
      conversation[0] !== null &&
      'session_id' in conversation[0] &&
      !('role' in conversation[0])
    ) {
      return []
    }
    return conversation as ChatHistoryItem[]
  }

  // 2. Object response
  if (typeof conversation === 'object' && conversation !== null) {
    const record = conversation as Record<string, unknown>

    // 2a. Object with messages array (API 2 response)
    if (Array.isArray(record.messages)) {
      return record.messages as ChatHistoryItem[]
    }

    // 2b. Object with nested data { messages: [...] } or { conversation: [...] }
    if (record.data && typeof record.data === 'object' && record.data !== null) {
      const dataObj = record.data as Record<string, unknown>
      if (Array.isArray(dataObj.messages)) {
        return dataObj.messages as ChatHistoryItem[]
      }
      if (Array.isArray(dataObj.conversation)) {
        return dataObj.conversation as ChatHistoryItem[]
      }
    }

    // 2c. Object with conversation array
    if (Array.isArray(record.conversation)) {
      return record.conversation as ChatHistoryItem[]
    }

    // 2d. Dictionary of sessions keyed by targetSessionId
    if (targetSessionId && Array.isArray(record[targetSessionId])) {
      return record[targetSessionId] as ChatHistoryItem[]
    }

    // 2e. Case-insensitive / partial match
    if (targetSessionId) {
      const match = Object.keys(record).find(
        (key) => key.toLowerCase() === targetSessionId.toLowerCase()
      )
      if (match && Array.isArray(record[match])) {
        return record[match] as ChatHistoryItem[]
      }
    }

    // 2f. First array of messages found
    for (const [, val] of Object.entries(record)) {
      if (
        Array.isArray(val) &&
        val.length > 0 &&
        typeof val[0] === 'object' &&
        val[0] !== null &&
        'role' in val[0]
      ) {
        return val as ChatHistoryItem[]
      }
    }
  }

  return []
}

/**
 * Converts backend history items to ChatMessage model used in UI.
 * Accepts either:
 * - Flat ChatHistoryItem[]
 * - API 2 response object { messages: [...] }
 * - Dictionary of sessions { [sessionId: string]: ChatHistoryItem[] } with optional targetSessionId
 */
export function mapHistoryToMessages(
  conversation: unknown,
  baseTimestamp = new Date(),
  targetSessionId?: string | null
): ChatMessage[] {
  const items: ChatHistoryItem[] = extractMessagesForSession(conversation, targetSessionId)

  return items.map((item, index) => {
    const isUser = item.role === 'user'

    // 1. Extract code blocks
    const { cleanContent: withoutCode, codeSnippet } = !isUser
      ? extractCodeBlock(item.content || '')
      : { cleanContent: item.content || '', codeSnippet: undefined }

    // 2. Extract images from content markdown or HTML
    const { cleanContent, images: extractedImages } = !isUser
      ? extractImages(withoutCode)
      : { cleanContent: withoutCode, images: [] }

    // 3. Combine with direct image fields from backend
    const directImage = item.image_url || item.imageUrl
    const allImages = [
      ...(directImage ? [directImage] : []),
      ...(item.images || []),
      ...extractedImages,
    ].filter((img, idx, arr) => arr.indexOf(img) === idx)

    const finalImageUrl = allImages[0] || undefined

    // Offset timestamps slightly for sequential display
    const msgTime = new Date(baseTimestamp.getTime() - (items.length - index) * 60000)
    const timeFormatted = msgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return {
      id: `history_msg_${index}_${Date.now()}`,
      sender: isUser ? 'user' : 'assistant',
      content: cleanContent || (finalImageUrl ? 'Here is the generated image:' : (item.content || '')),
      timestamp: timeFormatted,
      codeSnippet,
      imageUrl: finalImageUrl,
      images: allImages.length > 0 ? allImages : undefined,
    }
  })
}

/**
 * Parses all chat sessions from backend conversation history response (API 1).
 * Specifically supports:
 * 1. API 1: Array of ConversationSummaryItem [
 *      {
 *        id: 1,
 *        user_id: "...",
 *        session_id: "session_001",
 *        created_at: "...",
 *        updated_at: "...",
 *        last_message: { role: "user", content: "Hi", image_url: null }
 *      }
 *    ]
 * 2. Legacy flat message arrays
 * 3. Legacy dictionary mapping session_id -> message array
 */
export function parseChatSessionsFromHistory(
  conversationData: unknown,
  baseTimestamp = new Date(),
  defaultSessionId?: string
): ChatSession[] {
  if (!conversationData) return []

  const sessions: ChatSession[] = []

  // Case 1: Array of items
  if (Array.isArray(conversationData)) {
    if (conversationData.length === 0) return []

    // 1a. API 1: Array of ConversationSummaryItem
    const firstItem = conversationData[0]
    if (firstItem && typeof firstItem === 'object' && 'session_id' in firstItem) {
      const summaryItems = conversationData as ConversationSummaryItem[]
      for (const item of summaryItems) {
        const sessionId = item.session_id ? String(item.session_id) : String(item.id)
        const lastMsg = item.last_message
        const content = lastMsg?.content ? lastMsg.content.trim() : ''

        // Generate title and description
        const title = content
          ? content.slice(0, 26) + (content.length > 26 ? '...' : '')
          : `Chat ${sessionId}`
        const description = content
          ? content.slice(0, 48) + (content.length > 48 ? '...' : '')
          : 'No messages yet'

        // Determine icon based on topic
        let icon: 'python' | 'react' | 'rag' | 'agent' | 'default' = 'default'
        const lower = content.toLowerCase()
        if (lower.includes('python') || lower.includes('pip') || lower.includes('def ')) icon = 'python'
        else if (lower.includes('react') || lower.includes('jsx') || lower.includes('component')) icon = 'react'
        else if (lower.includes('rag') || lower.includes('sql') || lower.includes('database')) icon = 'rag'
        else if (lower.includes('agent') || lower.includes('bot') || lower.includes('workflow')) icon = 'agent'

        const updatedAt = formatRelativeTime(item.updated_at || item.created_at)

        sessions.push({
          id: sessionId,
          title,
          icon,
          description,
          updatedAt,
          pinned: false,
          messages: [], // Full message history will be loaded via getSessionMessages
          createdAt: item.created_at,
          updatedAtRaw: item.updated_at,
          lastMessage: lastMsg || null,
        })
      }
      return sessions
    }

    // 1b. Legacy flat array of messages (ChatHistoryItem[])
    const items = conversationData as ChatHistoryItem[]
    const messages = mapHistoryToMessages(items, baseTimestamp)
    const firstUserMsg = items.find((m) => m.role === 'user')?.content || 'Chat Session'
    const lastMsg = items[items.length - 1]
    sessions.push({
      id: defaultSessionId || 'default',
      title: firstUserMsg.slice(0, 24) + (firstUserMsg.length > 24 ? '...' : ''),
      icon: 'default',
      description: (lastMsg?.content || '').slice(0, 48) + ((lastMsg?.content?.length || 0) > 48 ? '...' : ''),
      updatedAt: 'Active',
      pinned: false,
      messages,
    })
    return sessions
  }

  // Case 2: Object mapping session_id -> ChatHistoryItem[]
  if (typeof conversationData === 'object' && conversationData !== null) {
    const entries = Object.entries(conversationData as Record<string, unknown>)
    for (const [sessionId, rawItems] of entries) {
      if (Array.isArray(rawItems) && rawItems.length > 0) {
        const items = rawItems as ChatHistoryItem[]
        const messages = mapHistoryToMessages(items, baseTimestamp, sessionId)
        const firstUserMsg = items.find((m) => m.role === 'user')?.content || 'Chat Session'
        const lastMsg = items[items.length - 1]
        sessions.push({
          id: sessionId,
          title: firstUserMsg.slice(0, 24) + (firstUserMsg.length > 24 ? '...' : ''),
          icon: 'default',
          description: (lastMsg?.content || '').slice(0, 48) + ((lastMsg?.content?.length || 0) > 48 ? '...' : ''),
          updatedAt: 'Active',
          pinned: false,
          messages,
        })
      }
    }
  }

  return sessions
}

function getAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...additionalHeaders }
  const token = dataManager.getToken() || authService.getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export const chatService = {
  /**
   * Send chat message: POST http://127.0.0.1:8000/api/chat/
   *
   * Request payload:
   * {
   *   "user_id": "string", // optional, sent if user is logged in
   *   "session_id": "string",
   *   "message": "string",
   *   "system_prompt": "string" // optional
   * }
   */
  async sendMessage(
    message: string,
    system_prompt?: string,
    sessionId?: string,
    userId?: string
  ): Promise<ChatPostResponse> {
    const targetSessionId = sessionId && sessionId.trim() ? sessionId.trim() : dataManager.generateSessionId()
    const targetUserId = userId !== undefined ? (userId || undefined) : (dataManager.getUserId() || undefined)

    const url = `${API_BASE_URL}/chat/`
    const payload: ChatPostRequest = {
      ...(targetUserId ? { user_id: targetUserId } : {}),
      session_id: targetSessionId,
      message,
      ...(system_prompt ? { system_prompt } : {}),
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
        body: JSON.stringify(payload),
      })

      if (response.status === 401) {
        dataManager.logout()
        throw new Error('Session expired or unauthorized. Please sign in again.')
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`Chat API error (${response.status}): ${errorText || response.statusText}`)
      }

      const data: ChatPostResponse = await response.json()
      return data
    } catch (err: unknown) {
      console.error('[chatService.sendMessage] Failed:', err)
      throw err
    }
  },

  /**
   * API 1: Fetch all conversation history for sidebar display
   * GET http://127.0.0.1:8000/api/chat/history?user_id=646a2b1b-0810-4826-9fbe-6c9dc334d965
   */
  async getConversations(userId?: string): Promise<ConversationListResponse> {
    const resolvedUserId = userId || dataManager.getUserId() || 'guest'

    const queryParams = new URLSearchParams({
      user_id: resolvedUserId,
    })

    const url = `${API_BASE_URL}/chat/history?${queryParams.toString()}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders({
          Accept: 'application/json',
        }),
      })

      if (response.status === 401) {
        dataManager.logout()
        throw new Error('Session expired or unauthorized. Please sign in again.')
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`History API error (${response.status}): ${errorText || response.statusText}`)
      }

      const data: ConversationListResponse = await response.json()
      return data
    } catch (err: unknown) {
      console.error('[chatService.getConversations] Failed:', err)
      throw err
    }
  },

  /**
   * API 2: Fetch history based on session
   * GET http://127.0.0.1:8000/api/chat/history/{session_id}?user_id=646a2b1b-0810-4826-9fbe-6c9dc334d965
   */
  async getSessionMessages(sessionId: string, userId?: string): Promise<SessionHistoryResponse> {
    const resolvedUserId = userId || dataManager.getUserId() || 'guest'

    const queryParams = new URLSearchParams({
      user_id: resolvedUserId,
    })

    const encodedSessionId = encodeURIComponent(sessionId)
    const url = `${API_BASE_URL}/chat/history/${encodedSessionId}?${queryParams.toString()}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders({
          Accept: 'application/json',
        }),
      })

      if (response.status === 401) {
        dataManager.logout()
        throw new Error('Session expired or unauthorized. Please sign in again.')
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`Session messages error (${response.status}): ${errorText || response.statusText}`)
      }

      const data: SessionHistoryResponse = await response.json()
      return data
    } catch (err: unknown) {
      console.error(`[chatService.getSessionMessages] Failed for session ${sessionId}:`, err)
      throw err
    }
  },

  /**
   * Backward-compatible helper for getChatHistory.
   * If sessionId is provided, fetches session messages (API 2).
   * Otherwise, fetches all conversations (API 1).
   */
  async getChatHistory(sessionId?: string, userId?: string): Promise<ConversationListResponse> {
    const resolvedUserId = userId || dataManager.getUserId() || 'guest'

    if (sessionId) {
      try {
        const sessionRes = await this.getSessionMessages(sessionId, resolvedUserId)
        const messages = sessionRes.data?.messages || []
        return {
          success: sessionRes.success,
          message: sessionRes.message,
          data: {
            conversation: messages,
          },
        }
      } catch (err) {
        console.error('[chatService.getChatHistory] Session messages fallback failed:', err)
        throw err
      }
    }

    return this.getConversations(resolvedUserId)
  },

  /**
   * Ask chat and sync history dynamically based on targetSessionId and userId
   */
  async askChatAndSync(
    message: string,
    system_prompt?: string,
    sessionId?: string,
    userId?: string
  ): Promise<{
    chatResponse: ChatPostResponse
    sessionResponse: SessionHistoryResponse
    messages: ChatMessage[]
    sessionId: string
  }> {
    const targetSessionId = sessionId && sessionId.trim() ? sessionId.trim() : dataManager.generateSessionId()
    const resolvedUserId = userId !== undefined ? (userId || undefined) : (dataManager.getUserId() || undefined)

    // 1. Post message to chat API
    const chatResponse = await this.sendMessage(message, system_prompt, targetSessionId, resolvedUserId)

    // 2. Fetch updated session messages from API 2
    const sessionResponse = await this.getSessionMessages(targetSessionId, resolvedUserId)

    // 3. Map conversation to ChatMessage[]
    const messageItems = sessionResponse.data?.messages || []
    const messages = mapHistoryToMessages(messageItems, new Date(), targetSessionId)

    return {
      chatResponse,
      sessionResponse,
      messages,
      sessionId: targetSessionId,
    }
  },
}

export default chatService
