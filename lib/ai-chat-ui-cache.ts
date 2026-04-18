/** Prefix for persisted AI chat UI (messages + responseMeta products, selection state). */
export const AI_CHAT_UI_STATE_PREFIX = "ai-chat-ui-state:"

export function aiChatUiCacheKey(sessionId: string): string {
  return `${AI_CHAT_UI_STATE_PREFIX}${sessionId}`
}

/**
 * sessionStorage is per browser tab; localStorage is shared. Read both so product cards survive new tabs / remounts when BE history has no responseMeta.
 */
export function readAiChatUiCache(sessionId: string): string | null {
  if (typeof window === "undefined") return null
  const key = aiChatUiCacheKey(sessionId)
  return sessionStorage.getItem(key) ?? localStorage.getItem(key)
}

export function writeAiChatUiCache(sessionId: string, payload: string): void {
  if (typeof window === "undefined") return
  const key = aiChatUiCacheKey(sessionId)
  try {
    sessionStorage.setItem(key, payload)
  } catch {
    /* quota / private mode */
  }
  try {
    localStorage.setItem(key, payload)
  } catch {
    /* quota */
  }
}

export function removeAiChatUiCache(sessionId: string): void {
  if (typeof window === "undefined") return
  const key = aiChatUiCacheKey(sessionId)
  sessionStorage.removeItem(key)
  localStorage.removeItem(key)
}
