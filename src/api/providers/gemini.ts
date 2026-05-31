import { translate } from '@/i18n/messages'
import type { ChatRequest, SendChatOptions } from '@/types/chat'
import { createChatError, readSseStream } from './openaiCompatible'

export async function sendGeminiChat(
  request: ChatRequest,
  options: SendChatOptions,
): Promise<string> {
  const systemMessage = request.messages.find((message) => message.role === 'system')
  const contents = request.messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }))

  const body: Record<string, unknown> = { contents }

  if (systemMessage) {
    body.systemInstruction = {
      parts: [{ text: systemMessage.content }],
    }
  }

  const generationConfig: Record<string, number> = {}

  if (request.advancedParams?.temperature !== undefined) {
    generationConfig.temperature = request.advancedParams.temperature
  }

  if (request.advancedParams?.top_p !== undefined) {
    generationConfig.topP = request.advancedParams.top_p
  }

  if (request.advancedParams?.max_tokens !== undefined) {
    generationConfig.maxOutputTokens = request.advancedParams.max_tokens
  }

  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig
  }

  const mode = request.stream ? 'streamGenerateContent' : 'generateContent'
  const format = request.stream ? 'sse' : 'json'
  const url =
    `${request.provider.baseUrl.replace(/\/+$/, '')}/models/${encodeURIComponent(request.model)}:${mode}` +
    `?alt=${format}&key=${encodeURIComponent(request.provider.apiKey)}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
      const chunk = readGeminiText(payload)

      if (chunk) {
        options.onChunk(chunk)
        return chunk
      }

      return null
    }, options.locale)
  }

  const data = (await response.json()) as Record<string, unknown>
  const content = readGeminiText(data) ?? ''
  options.onChunk(content)
  return content
}

function readGeminiText(payload: Record<string, unknown>): string | null {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : []
  const firstCandidate = candidates[0] as { content?: { parts?: Array<{ text?: string }> } } | undefined
  const text = firstCandidate?.content?.parts?.[0]?.text

  return typeof text === 'string' && text.length > 0 ? text : null
}
