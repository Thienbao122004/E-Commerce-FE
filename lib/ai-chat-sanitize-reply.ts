/**
 * Model đôi khi trả prose + JSON dính sau, hoặc cả tin là JSON — tránh hiển thị raw JSON cho user.
 */
function indexOfMatchingJsonEnd(s: string, start: number): number | null {
  if (start >= s.length || s[start] !== "{") return null
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (escape) {
      escape = false
      continue
    }
    if (c === "\\" && inString) {
      escape = true
      continue
    }
    if (c === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (c === "{") depth++
    else if (c === "}") {
      depth--
      if (depth === 0) return i
    }
  }
  return null
}

function tryParseJsonWithReply(slice: string): string | null {
  try {
    const o = JSON.parse(slice) as { reply?: unknown; intent?: unknown; search_query?: unknown }
    if (!o || typeof o !== "object") return null
    if (typeof o.reply !== "string") return null
    if (!("intent" in o) && !("search_query" in o) && !("product_to_add" in o)) return null
    return o.reply.trim()
  } catch {
    return null
  }
}

/** Bỏ khối JSON giao thức (có reply/intent) dính sau văn bản. */
function stripTrailingProtocolJson(s: string): string {
  const idx = s.search(/\n\s*\{/)
  if (idx < 0) return s
  const tail = s.slice(idx).trim()
  if (!tail.startsWith("{")) return s
  const end = indexOfMatchingJsonEnd(tail, 0)
  if (end == null) return s
  const json = tail.slice(0, end + 1)
  const reply = tryParseJsonWithReply(json)
  if (reply == null) return s
  const head = s.slice(0, idx).trimEnd()
  return head.length > 0 ? head : reply
}

export function sanitizeAiAssistantDisplayText(text: string): string {
  if (!text) return text
  let s = text.trim()
  if (s.startsWith("```json")) s = s.slice(7).trim()
  if (s.startsWith("```")) s = s.slice(3).trim()
  if (s.endsWith("```")) s = s.slice(0, -3).trim()

  if (s.startsWith("{")) {
    const end = indexOfMatchingJsonEnd(s, 0)
    if (end != null) {
      const slice = s.slice(0, end + 1)
      const fromJson = tryParseJsonWithReply(slice)
      if (fromJson != null) return fromJson
    }
  }

  const stripped = stripTrailingProtocolJson(s)
  return stripped.trimEnd()
}
