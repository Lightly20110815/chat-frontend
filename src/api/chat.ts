import type { ChatRequest, SendChatOptions } from '@/types/chat'
import { sendAnthropicChat } from './providers/anthropic'
import { sendGeminiChat } from './providers/gemini'
import { sendOpenAICompatibleChat } from './providers/openaiCompatible'

export async function sendChatRequest(
  request: ChatRequest,
  options: SendChatOptions,
): Promise<string> {
  switch (request.provider.type) {
    case 'anthropic':
      return sendAnthropicChat(request, options)
    case 'gemini':
      return sendGeminiChat(request, options)
    case 'openai-compatible':
    case 'custom':
    default:
      return sendOpenAICompatibleChat(request, options)
  }
}
