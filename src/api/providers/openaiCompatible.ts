import { translate } from '@/i18n/messages'
import type { ChatError, ChatRequest, SendChatOptions } from '@/types/chat'

export async function sendOpenAICompatibleChat(
  request: ChatRequest,
  options: SendChatOptions,
): Promise<string> {
  const body: Record<string, unknown> = {
    model: request.model,
    messages: request.messages,
    stream: request.stream,
  }

  if (request.advancedParams?.temperature !== undefined) {
    body.temperature = request.advancedParams.temperature
  }

  if (request.advancedParams?.top_p !== undefined) {
    body.top_p = request.advancedParams.top_p
  }

  if (request.advancedParams?.max_tokens !== undefined) {
    body.max_tokens = request.advancedParams.max_tokens
  }

  if (request.advancedParams?.presence_penalty !== undefined) {
    body.presence_penalty = request.advancedParams.presence_penalty
  }

  if (request.advancedParams?.frequency_penalty !== undefined) {
    body.frequency_penalty = request.advancedParams.frequency_penalty
  }

  const response = await fetch(buildUrl(request.provider.baseUrl, 'chat/completions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${request.provider.apiKey}`,
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
    throw await readHttpError(response, options.locale)
  }

  if (request.stream && response.body) {
    return readSseStream(response.body, (payload) => {
      const data = payload as {
        choices?: Array<{ delta?: { content?: string } }>
      }
      const chunk = data.choices?.[0]?.delta?.content

      if (typeof chunk === 'string' && chunk.length > 0) {
        options.onChunk(chunk)
        return chunk
      }

      return null
    }, options.locale)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = data.choices?.[0]?.message?.content ?? ''
  options.onChunk(content)
  return content
}

export function buildUrl(baseUrl: string, path: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, '')
  const trimmedPath = path.replace(/^\/+/, '')
  return `${trimmedBase}/${trimmedPath}`
}

export async function readSseStream(
  stream: ReadableStream<Uint8Array>,
  readChunk: (payload: Record<string, unknown>) => string | null,
  locale?: SendChatOptions['locale'],
): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const rawLine of lines) {
        const line = rawLine.trim()

        if (!line.startsWith('data:')) {
          continue
        }

        const dataString = line.slice(5).trim()

        if (!dataString || dataString === '[DONE]') {
          continue
        }

        try {
          const payload = JSON.parse(dataString) as Record<string, unknown>
          const chunk = readChunk(payload)

          if (chunk) {
            result += chunk
          }
        } catch {
          continue
        }
      }
    }
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw createChatError(
      'network',
      translate(locale ?? 'en', 'errors.streamingInterrupted'),
    )
  } finally {
    reader.releaseLock()
  }

  return result
}

async function readHttpError(response: Response, locale: SendChatOptions['locale']): Promise<ChatError> {
  const body = await response.text().catch(() => '')

  if (response.status === 401 || response.status === 403) {
    return createChatError('auth', translate(locale, 'errors.authFailed'), response.status)
  }

  if (response.status === 429) {
    return createChatError('rate_limit', translate(locale, 'errors.rateLimitReached'), response.status)
  }

  if (response.status >= 500) {
    return createChatError('server', translate(locale, 'errors.providerServerError'), response.status)
  }

  return createChatError(
    'unknown',
    body
      ? translate(locale, 'errors.requestFailed', { details: body.slice(0, 240) })
      : translate(locale, 'errors.requestFailedStatus', { status: response.status }),
    response.status,
  )
}

export function createChatError(
  type: ChatError['type'],
  message: string,
  statusCode?: number,
): ChatError {
  return { type, message, statusCode }
}
