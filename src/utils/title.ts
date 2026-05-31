export function deriveSessionTitle(content: string, fallbackTitle: string, maxLength = 20): string {
  const normalized = content.replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return fallbackTitle
  }

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized
}
