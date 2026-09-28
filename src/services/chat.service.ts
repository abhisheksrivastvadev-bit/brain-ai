/**
 * Brain AI - Chat & History Service
 * Connects to:
 * 1. POST /api/chat/
 * 2. GET  /api/chat/history/?session_id={session_id}
 */

import type {
  ChatHistoryItem,
  ChatHistoryResponse,
  ChatMessage,
  ChatPostRequest,
  ChatPostResponse,
} from '../types'

// Base URL: In dev, '/api' proxies to http://127.0.0.1:8000/api in vite.config.ts
const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

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

  // Clean the text by removing the raw markdown image / data URIs so they don't clutter textual paragraphs
  let cleanContent = content.replace(mdImgRegex, '').trim()
  cleanContent = cleanContent.replace(htmlImgRegex, '').trim()

  return {
    cleanContent,
    images,
  }
}

/**
 * Converts backend history items to ChatMessage model used in UI
 */
export function mapHistoryToMessages(
  conversation: ChatHistoryItem[],
  baseTimestamp = new Date()
): ChatMessage[] {
  return conversation.map((item, index) => {
    const isUser = item.role === 'user'

    // 1. Extract code blocks
    const { cleanContent: withoutCode, codeSnippet } = !isUser
      ? extractCodeBlock(item.content)
      : { cleanContent: item.content, codeSnippet: undefined }

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
    const msgTime = new Date(baseTimestamp.getTime() - (conversation.length - index) * 60000)
    const timeFormatted = msgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return {
      id: `history_msg_${index}_${Date.now()}`,
      sender: isUser ? 'user' : 'assistant',
      content: cleanContent || (finalImageUrl ? 'Here is the generated image:' : item.content),
      timestamp: timeFormatted,
      codeSnippet,
      imageUrl: finalImageUrl,
      images: allImages.length > 0 ? allImages : undefined,
    }
  })
}

export const chatService = {
  /**
   * 1. Send chat message: POST http://127.0.0.1:8000/api/chat/
   */
  async sendMessage(message: string, system_prompt?: string, sessionId: string = '002'): Promise<ChatPostResponse> {
    const url = `${API_BASE_URL}/chat/`
    const payload: ChatPostRequest = {
      session_id: sessionId,
      message,
      system_prompt
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

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
   * 2. Fetch chat history: GET http://127.0.0.1:8000/api/chat/history/?session_id={sessionId}
   */
  async getChatHistory(sessionId: string = '002'): Promise<ChatHistoryResponse> {
    const url = `${API_BASE_URL}/chat/history/?session_id=${encodeURIComponent(sessionId)}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`History API error (${response.status}): ${errorText || response.statusText}`)
      }

      const data: ChatHistoryResponse = await response.json()
      return data
    } catch (err: unknown) {
      console.error('[chatService.getChatHistory] Failed:', err)
      throw err
    }
  },

  /**
   * Ask chat and sync history:
   * First posts the user's message to /api/chat/,
   * then fetches the latest conversation history from /api/chat/history/?session_id={sessionId}
   */
  async askChatAndSync(
    message: string,
    system_prompt?: string,
    sessionId: string = '002'
  ): Promise<{
    chatResponse: ChatPostResponse
    historyResponse: ChatHistoryResponse
    messages: ChatMessage[]
  }> {
    // 1. Post message to chat API
    const chatResponse = await this.sendMessage(message, system_prompt, sessionId)

    // 2. Fetch updated history from history API
    const historyResponse = await this.getChatHistory(sessionId)

    // 3. Map conversation to ChatMessage[]
    const conversation = historyResponse.data?.conversation || []
    const messages = mapHistoryToMessages(conversation)

    return {
      chatResponse,
      historyResponse,
      messages,
    }
  },
}

export default chatService
