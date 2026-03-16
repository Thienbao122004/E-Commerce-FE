import { api } from '@/lib/api-client'


export interface CartItem {
  id: string
  productId: string
  productName: string
  productImage?: string
  variantId?: string
  variantName?: string
  unitPrice: number
  quantity: number
  lineTotal: number
  stockAvailable: number
}

export interface Cart {
  id: string
  status: number
  items: CartItem[]
  subtotal: number
  totalItems: number
  updatedAt: string
}

export interface AddCartItemRequest {
  productId: string
  variantId?: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface CheckoutRequest {
  cartId: string
  shippingAddressId: string
}

export interface CheckoutResponse {
  success: boolean
  message: string
  orderIds: string[]
  totalAmount: number
}


export const cartService = {
  getMyCart: () =>
    api.get<{ success: boolean; data: Cart }>('/api/cart').then((r) => r.data),

  addItem: (data: AddCartItemRequest) =>
    api.post<{ success: boolean; message: string; data: CartItem }>('/api/cart/items', data),

  updateItem: (itemId: string, data: UpdateCartItemRequest) =>
    api.put<{ success: boolean; message: string }>(`/api/cart/items/${itemId}`, data),

  removeItem: (itemId: string) =>
    api.delete<{ success: boolean; message: string }>(`/api/cart/items/${itemId}`),

  checkout: (data: CheckoutRequest) =>
    api.post<{ success: boolean; message: string; data: CheckoutResponse }>('/api/cart/checkout', data),
}
