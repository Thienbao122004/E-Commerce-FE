import type { AiChatSendResponse } from "@/types/ai-chat"

/** Lấy số lượng từ câu khách (vd. "2 cái", "3 x"). */
export function extractFirstQuantityFromUserText(text: string): number | null {
  const t = text.trim()
  const m =
    t.match(/(\d+)\s*(x|×)\s*(cái|chiếc|hộp|gói)?/i) ??
    t.match(/(\d+)\s*(cái|chiếc|hộp|gói|sp)\b/i) ??
    t.match(/\b(\d+)\s*cái\b/i)
  if (!m?.[1]) return null
  const n = parseInt(m[1], 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Quyết định có gọi POST /api/cart/items sau tin AI hay không:
 * - Ưu tiên productToAdd từ BE;
 * - Fallback: intent add_to_cart + đúng 1 SP trong kết quả tìm → khớp variant theo từ trong câu user.
 */
export function resolveAutoAddToCartPayload(
  res: AiChatSendResponse,
  userMessage: string
): { productId: string; variantId?: string; quantity: number } | null {
  const pta = res.productToAdd
  if (pta?.productId) {
    return {
      productId: String(pta.productId),
      variantId: pta.variantId ? String(pta.variantId) : undefined,
      quantity: Math.max(1, Number(pta.quantity) || 1),
    }
  }

  if ((res.intent || "").trim() !== "add_to_cart") return null
  const products = res.products ?? []
  if (products.length !== 1) return null

  const p = products[0]
  const lower = userMessage.trim().toLowerCase()
  const qtyFromUser = extractFirstQuantityFromUserText(userMessage)
  const qtyFromReply = extractFirstQuantityFromUserText(res.reply ?? "")
  const quantity = Math.max(1, qtyFromUser ?? qtyFromReply ?? 1)

  if (!p.variants?.length) {
    return { productId: p.id, quantity }
  }
  if (p.variants.length === 1) {
    return { productId: p.id, variantId: String(p.variants[0].id), quantity }
  }

  const match = p.variants.find((v) => {
    const vn = v.variantName.trim().toLowerCase()
    if (vn.length < 2) return false
    if (lower.includes(vn)) return true
    return vn
      .split(/[\s\-–/]+/)
      .filter((w) => w.length >= 3)
      .some((w) => lower.includes(w))
  })
  if (!match) return null
  return { productId: p.id, variantId: String(match.id), quantity }
}
