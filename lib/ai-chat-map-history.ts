import type { AiChatSendResponse, ProductSuggestion } from "@/types/ai-chat"

function normalizeProducts(products: ProductSuggestion[]): ProductSuggestion[] {
  return products.map((p) => ({
    ...p,
    id: p.id != null ? String(p.id) : "",
  }))
}

/**
 * Map API history row → UI message with optional responseMeta.products.
 */
export function mapHistoryMessageToUi(
  sessionId: string,
  m: {
    id: string | number
    role: "user" | "assistant"
    content: string
    createdAt?: string
    products?: ProductSuggestion[] | null
  }
): {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt?: string
  responseMeta?: AiChatSendResponse
} {
  const id = `${m.id}`
  const base = {
    id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
  }
  const list = m.products?.length ? normalizeProducts(m.products) : []
  if (m.role === "assistant" && list.length > 0) {
    return {
      ...base,
      responseMeta: {
        reply: m.content,
        intent: "general",
        products: list,
        needsConfirmation: false,
        cartUpdated: false,
        sessionId,
      },
    }
  }
  return base
}
