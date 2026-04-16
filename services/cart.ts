import { api } from '@/lib/api-client'
import type {
  Cart,
  CartItem,
  AddCartItemRequest,
  UpdateCartItemRequest,
  CheckoutRequest,
  CheckoutResponse,
} from '@/types/cart'

export type {
  CartItem,
  Cart,
  AddCartItemRequest,
  UpdateCartItemRequest,
  ShopShippingOption,
  CheckoutRequest,
  CheckoutResponse,
} from '@/types/cart'

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
