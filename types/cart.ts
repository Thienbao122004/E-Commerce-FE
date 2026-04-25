export interface CartItem {
  id: string
  productId: string
  productName: string
  productSlug?: string
  productImage?: string
  variantId?: string
  variantName?: string
  unitPrice: number
  quantity: number
  lineTotal: number
  stockAvailable: number
  shopId?: string | null
  shopName?: string | null
  /** Slug storefront; ưu tiên dùng cho URL /shop/{slug}, không dùng guid. */
  shopSlug?: string | null
  ghnShopId?: number | null
  fromDistrictId?: number | null
  fromWardCode?: string | null
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

export interface ShopShippingOption {
  shopId: string
  shippingProvider?: string
  shippingServiceId?: string
  shippingFee: number
  estimatedDeliveryDate?: string | null
}

export interface CheckoutRequest {
  cartId: string
  shippingAddressId: string
  shippingOptions?: ShopShippingOption[]
}

export interface CheckoutResponse {
  success: boolean
  message: string
  orderIds: string[]
  totalAmount: number
}
