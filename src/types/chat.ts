import type { Provider } from './provider'
import type { SupportedLocale } from './settings'

export type ChatRole = 'system' | 'user' | 'assistant'
export type ChatMessageStatus = 'normal' | 'streaming' | 'error'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  status: ChatMessageStatus
  createdAt: number
  errorMessage?: string
}

export interface ChatSession {
  id: string
  title: string
  providerId: string
  model: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export interface AdvancedParams {
  temperature?: number
  top_p?: number
  max_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
}

export interface ChatRequestMessage {
  role: ChatRole
  content: string
}

export interface ChatRequest {
  provider: Provider
  model: string
  messages: ChatRequestMessage[]
  stream: boolean
  advancedParams?: AdvancedParams
}

export interface ChatError {
  type: 'auth' | 'network' | 'rate_limit' | 'server' | 'validation' | 'unknown'
  message: string
  statusCode?: number
}

export interface SendChatOptions {
  signal: AbortSignal
  locale: SupportedLocale
  onChunk: (chunk: string) => void
}
