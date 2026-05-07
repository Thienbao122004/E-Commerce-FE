import type { AiChatSendResponse, ProductSuggestion } from "@/types/ai-chat"
import { sanitizeAiAssistantDisplayText } from "@/lib/ai-chat-sanitize-reply"

function normalizeProducts(products: ProductSuggestion[]): ProductSuggestion[] {
  return products.map((p) => ({
    ...p,
    id: p.id != null ? String(p.id) : "",
    variants: p.variants?.map((v) => ({
      ...v,
      id: v.id != null ? String(v.id) : "",
    })),
  }))
}

/** Một biến thể duy nhất → tự gán; nhiều biến thể → người dùng phải chọn trước khi thêm giỏ */
export function defaultVariantIdForProduct(p: Pick<ProductSuggestion, "variants">): string | undefined {
  const v = p.variants
  if (!v?.length) return undefined
  if (v.length === 1) return String(v[0].id)
  return undefined
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
  const rawContent = m.content ?? ""
  const displayContent =
    m.role === "assistant" ? sanitizeAiAssistantDisplayText(rawContent) : rawContent
  const base = {
    id,
    role: m.role,
    content: displayContent,
    createdAt: m.createdAt,
  }
  const list = m.products?.length ? normalizeProducts(m.products) : []
  if (m.role === "assistant" && list.length > 0) {
    return {
      ...base,
      responseMeta: {
        reply: displayContent,
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
