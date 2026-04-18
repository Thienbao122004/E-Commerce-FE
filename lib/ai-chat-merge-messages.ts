/**
 * Merge cache (client ids) + BE history (numeric ids): same text, different ids → duplicates.
 * Normalize text and compare time within a window (server vs client clock skew).
 * Assistant: keep the entry that has responseMeta.products.
 */
export type MergeableChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt?: string
  responseMeta?: { products?: unknown[] | null }
}

/** Trim and collapse whitespace for stable content comparison. */
export function normalizeChatMessageContent(content: string): string {
  return content.trim().replace(/\s+/g, " ")
}

/** Same role + normalized content + createdAt within this window → duplicate. */
const DEDUPE_WINDOW_MS = 120_000

function timeMs(m: MergeableChatMessage): number | null {
  if (!m.createdAt) return null
  const t = new Date(m.createdAt).getTime()
  return Number.isFinite(t) ? t : null
}

function isDuplicatePair(a: MergeableChatMessage, b: MergeableChatMessage): boolean {
  if (a.role !== b.role) return false
  if (normalizeChatMessageContent(a.content) !== normalizeChatMessageContent(b.content)) return false

  const ta = timeMs(a)
  const tb = timeMs(b)
  if (ta === null && tb === null) return true
  if (ta === null || tb === null) return false
  return Math.abs(ta - tb) <= DEDUPE_WINDOW_MS
}

export function dedupeMergedChatMessages<T extends MergeableChatMessage>(messages: T[]): T[] {
  const sorted = [...messages].sort((a, b) => {
    const ta = timeMs(a) ?? 0
    const tb = timeMs(b) ?? 0
    return ta - tb
  })

  const out: T[] = []
  for (const m of sorted) {
    const dupIdx = out.findIndex((x) => isDuplicatePair(x, m))

    if (dupIdx < 0) {
      out.push(m)
      continue
    }

    const prev = out[dupIdx]
    if (m.role === "assistant") {
      const mRich = (m.responseMeta?.products?.length ?? 0) > 0
      const pRich = (prev.responseMeta?.products?.length ?? 0) > 0
      if (mRich && !pRich) out[dupIdx] = m
      continue
    }

    // User: prefer client id (u-*) for stable keys; otherwise keep existing
    const preferM = m.id.startsWith("u-") && !prev.id.startsWith("u-")
    if (preferM) out[dupIdx] = m
  }
  return out
}
