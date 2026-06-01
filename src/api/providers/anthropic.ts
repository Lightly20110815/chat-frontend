import { translate } from '@/i18n/messages'
import type { ChatRequest, SendChatOptions } from '@/types/chat'
import { buildUrl, createChatError, readSseStream } from './openaiCompatible'

const DEFAULT_ANTHROPIC_MAX_TOKENS = 1024

export async function sendAnthropicChat(
  request: ChatRequest,
  options: SendChatOptions,
): Promise<string> {
  const systemMessage = request.messages.find((message) => message.role === 'system')
  const messages = request.messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))

  const body: Record<string, unknown> = {
    model: request.model,
    max_tokens: request.advancedParams?.max_tokens ?? DEFAULT_ANTHROPIC_MAX_TOKENS,
    messages,
    stream: request.stream,
  }

  if (systemMessage) {
    body.system = systemMessage.content
  }

  if (request.advancedParams?.temperature !== undefined) {
    body.temperature = request.advancedParams.temperature
  }

  if (request.advancedParams?.top_p !== undefined) {
    body.top_p = request.advancedParams.top_p
  }

  const response = await fetch(buildUrl(request.provider.baseUrl, 'messages'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': request.provider.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
    signal: options.signal,
  }).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw createChatError('network', translate(options.locale, 'errors.networkRequestFailed'))
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '')

    if (response.status === 401 || response.status === 403) {
      throw createChatError('auth', translate(options.locale, 'errors.authFailed'), response.status)
    }

    throw createChatError(
      response.status >= 500 ? 'server' : 'unknown',
      bodyText
        ? translate(options.locale, 'errors.requestFailed', { details: bodyText.slice(0, 240) })
        : translate(options.locale, 'errors.requestFailedStatus', { status: response.status }),
      response.status,
    )
  }

  if (request.stream && response.body) {
    return readSseStream(response.body, (payload) => {
      if (payload.type !== 'content_block_delta') {
        return null
      }

      const delta = payload.delta as { text?: string } | undefined

      if (typeof delta?.text === 'string' && delta.text.length > 0) {
        options.onChunk(delta.text)
        return delta.text
      }

      return null
    }, options.locale)
  }

  const data = (await response.json()) as {
    content?: Array<{ text?: string }>
  }
  const content = readAnthropicText(data.content)
  options.onChunk(content)
  return content
}

function readAnthropicText(content: Array<{ text?: string }> | undefined): string {
  return content
    ?.map((block) => (typeof block.text === 'string' ? block.text : ''))
    .join('') ?? ''
}
