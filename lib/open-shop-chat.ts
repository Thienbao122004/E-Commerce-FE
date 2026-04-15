import type { OrderItem, OrderSummary } from '@/services/orders'

/** Mở widget chat (user↔seller) và gắn sản phẩm ngữ cảnh — lắng nghe trong `chat-widget.tsx`. */
export function openShopChatWithOrderProduct(order: OrderSummary, lineItem?: OrderItem) {
  if (typeof window === 'undefined') return
  const item = lineItem ?? order.items[0]
  if (!item?.productId || !order.shopId) return

  window.dispatchEvent(
    new CustomEvent('open-chat-widget', {
      detail: {
        shopId: order.shopId,
        product: {
          id: item.productId,
          name: item.productName,
          imageUrl: item.thumbnailUrl ?? null,
          price: item.unitPrice,
          shopId: order.shopId,
        },
      },
    })
  )
}
