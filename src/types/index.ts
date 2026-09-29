/**
 * Brain AI - Shared TypeScript Types & Interfaces
 */

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user' | 'guest'
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

export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
  image_url?: string
  imageUrl?: string
  images?: string[]
}

export interface ChatHistoryResponse {
  success: boolean
  message: string
  data: {
    conversation: ChatHistoryItem[]
  }
}

export interface ChatPostRequest {
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
  error?: string
}

export type AppScreen = 'landing' | 'login' | 'register' | 'design-system'


