import type { AiChatSendResponse, ProductSuggestion } from "@/types/ai-chat"
import { extractFirstQuantityFromUserText } from "@/lib/ai-chat-auto-add-cart"
import { defaultVariantIdForProduct } from "@/lib/ai-chat-map-history"

/**
 * Lấy đơn giá hiển thị cho sản phẩm: ưu tiên giá variant đã chọn, fallback về basePrice.
 * Dùng cho confirm preview / order summary để khớp với phân loại người dùng chọn.
 */
export function resolveUnitPriceForProduct(
  p: Pick<ProductSuggestion, "basePrice" | "variants">,
  variantId?: string | null
): number {
  const variants = p.variants ?? []
  if (variantId) {
    const matched = variants.find((v) => String(v.id) === String(variantId))
    if (matched?.price != null) return matched.price
  }
  if (variants.length === 1 && variants[0]?.price != null) return variants[0].price
  return p.basePrice
}

export type ProductSelectionLike = {
  checked?: boolean
  quantity?: number
  variantId?: string
}

export type ImplicitCartLine = {
  productId: string
  variantId?: string
  quantity: number
  name: string
  imageUrl?: string
  basePrice: number
}

/** Tin nhắn có ý đặt hàng / đồng ý / thanh toán (dùng mở confirm + thêm giỏ ngầm). */
export function isOrderIntentUserMessage(text: string): boolean {
  const t = text.trim().toLowerCase()
  return /tạo\s*đơn|đặt\s*hàng|đặt\s*đơn|checkout|thanh\s*toán|mua\s*luôn|chốt\s*đơn|đồng\s*ý|đặt\s*giúp|tạo\s*giúp|chấp\s*nhận|làm\s*luôn|đặt\s*luôn|xác\s*nhận\s*đơn|được\s*ạ|mua\s*hàng|\bok\b|\bừ\b/i.test(
    t
  )
}

export function findLastAssistantWithProductSuggestions<
  T extends { role: string; responseMeta?: AiChatSendResponse },
>(messages: T[]): T | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role === "assistant" && (m.responseMeta?.products?.length ?? 0) > 0) return m
  }
  return null
}

/**
 * Từ thẻ SP của assistant gần nhất + state chọn trên UI (không bắt buộc tick nếu chỉ 1 SP).
 */
export function buildImplicitCartLinesFromLastCard(
  products: ProductSuggestion[],
  selections: Record<string, ProductSelectionLike> | undefined,
  userText: string
): ImplicitCartLine[] | null {
  if (!products.length) return null
  const selMap = selections ?? {}

  if (products.length === 1) {
    const p = products[0]
    const sel = selMap[p.id] ?? {}
    const vCount = p.variants?.length ?? 0
    const variantId = sel.variantId ?? defaultVariantIdForProduct(p)
    if (vCount > 1 && !variantId) return null
    const qty = Math.max(
      1,
      Number(sel.quantity) || extractFirstQuantityFromUserText(userText) || 1
    )
    return [
      {
        productId: p.id,
        variantId: variantId ?? undefined,
        quantity: qty,
        name: p.name,
        imageUrl: p.imageUrl,
        basePrice: resolveUnitPriceForProduct(p, variantId),
      },
    ]
  }

  const lines: ImplicitCartLine[] = []
  for (const p of products) {
    const sel = selMap[p.id]
    if (!sel?.checked) continue
    const vCount = p.variants?.length ?? 0
    const variantId = sel.variantId ?? defaultVariantIdForProduct(p)
    if (vCount > 1 && !variantId) continue
    const qty = Math.max(1, Number(sel.quantity) || extractFirstQuantityFromUserText(userText) || 1)
    lines.push({
      productId: p.id,
      variantId: variantId ?? undefined,
      quantity: qty,
      name: p.name,
      imageUrl: p.imageUrl,
      basePrice: resolveUnitPriceForProduct(p, variantId),
    })
  }
  return lines.length ? lines : null
}

/** Alias ngắn cho widget / page. */
export const findLastAssistantWithProducts = findLastAssistantWithProductSuggestions
