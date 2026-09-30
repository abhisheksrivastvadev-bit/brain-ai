/**
 * Brain AI - Shared TypeScript Types & Interfaces
 */

export interface User {
  id: string
  user_id?: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user' | 'guest'
  token?: string
}

export interface ApiResponse<T = unknown> {
  data: T
  status: 'success' | 'error'
  message?: string
  timestamp: string
}

export type StatusType = 'idle' | 'loading' | 'success' | 'error'

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  content: string
  timestamp: string
  codeSnippet?: {
    language: string
    code: string
    title?: string
  }
  imageUrl?: string
  images?: string[]
  reasoning?: string
  tags?: string[]
}

export interface ChatSession {
  id: string
  title: string
  icon: 'python' | 'react' | 'rag' | 'agent' | 'default'
  description: string
  updatedAt: string
  pinned?: boolean
  messages: ChatMessage[]
  createdAt?: string
  updatedAtRaw?: string
  lastMessage?: {
    role: string
    content: string
    image_url?: string | null
  } | null
}

export interface DocumentItem {
  id: string
  name: string
  size: string
  pages: number
  type: string
  uploadedAt: string
  previewSnippet: string
  topics: string[]
}

export interface AppSettings {
  model: string
  temperature: number
  systemPrompt: string
  webSearchEnabled: boolean
  streamResponse: boolean
  apiKey?: string
}

/**
 * Single item in conversation history list for sidebar:
 * GET /api/chat/history?user_id={user_id}
 */
export interface ConversationSummaryItem {
  id: number | string
  user_id: string
  session_id: string
  created_at: string
  updated_at: string
  last_message?: {
    role: 'user' | 'assistant' | string
    content: string
    image_url?: string | null
  } | null
}

/**
 * Message item returned by session history:
 * GET /api/chat/history/{session_id}?user_id={user_id}
 */
export interface ChatHistoryItem {
  role: 'user' | 'assistant' | string
  content: string
  image_url?: string | null
  imageUrl?: string | null
  images?: string[]
}

/**
 * API 1: All conversation history for sidebar
 * GET /api/chat/history?user_id={user_id}
 */
export interface ConversationListResponse {
  success: boolean
  message: string
  data: {
    conversation: ConversationSummaryItem[] | ChatHistoryItem[] | Record<string, ChatHistoryItem[]>
  }
}

/**
 * API 2: Get history based on session
 * GET /api/chat/history/{session_id}?user_id={user_id}
 */
export interface SessionHistoryResponse {
  success: boolean
  message: string
  data: {
    messages?: ChatHistoryItem[]
    conversation?: ChatHistoryItem[] | Record<string, ChatHistoryItem[]>
  }
}

// Backward-compatible alias for existing code
export type ChatHistoryResponse = ConversationListResponse

export interface ChatPostRequest {
  user_id?: string
  session_id: string
  message: string
  system_prompt?: string
}

export interface ChatPostResponse {
  message: string
  image_url?: string
  imageUrl?: string
  images?: string[]
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  passwordConfirm: string
  agreeTerms?: boolean
}

export interface AuthResponse {
  success: boolean
  message?: string
  user?: User
  token?: string
  access_token?: string
  error?: string
}

export type AppScreen = 'landing' | 'login' | 'register' | 'design-system'


