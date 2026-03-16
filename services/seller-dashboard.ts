/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "@/lib/api-client"
import type {
  SellerShopResponse,
  SellerWalletResponse,
  SellerProductsResponse,
  SellerOrdersResponse,
  SellerProductDetailResponse,
  SellerOrderDetailResponse,
  UpdateShopPayload,
  CreateSellerProductPayload,
  UpdateSellerProductPayload,
  UpdateInventoryPayload,
  UpdateSellerOrderStatusPayload,
  WithdrawalsResponse,
  CreateWithdrawalPayload,
} from "@/types/seller-dashboard"

// ====== Shop ======

export function fetchMyShop() {
  return api.get<SellerShopResponse>("/api/seller/shop")
}

export function updateMyShop(dto: UpdateShopPayload) {
  return api.put<{ success: boolean; message?: string }>("/api/seller/shop", dto)
}

// ====== Wallet ======

export function fetchMyWallet() {
  return api.get<SellerWalletResponse>("/api/seller/wallet")
}

export function fetchMyWithdrawals(page = 1, pageSize = 20) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return api.get<WithdrawalsResponse>(`/api/seller/withdrawals?${params}`)
}

export function createWithdrawal(dto: CreateWithdrawalPayload) {
  return api.post<{ success: boolean; message?: string }>("/api/seller/withdrawals", dto)
}

// ====== Products ======

export function fetchMyProducts(page = 1, pageSize = 10, status?: number, search?: string) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (status !== undefined && status !== null) {
    params.set("status", String(status))
  }
  if (search && search.trim()) {
    params.set("search", search.trim())
  }
  return api.get<SellerProductsResponse>(`/api/seller/products?${params}`)
}

export function fetchMyProductById(productId: string) {
  return api.get<SellerProductDetailResponse>(`/api/seller/products/${productId}`)
}

export function createMyProduct(dto: CreateSellerProductPayload) {
  return api.post<{ success: boolean; message?: string; data?: any }>(
    "/api/seller/products",
    dto
  )
}

export function updateMyProduct(productId: string, dto: UpdateSellerProductPayload) {
  return api.put<{ success: boolean; message?: string }>(
    `/api/seller/products/${productId}`,
    dto
  )
}

export function deleteMyProduct(productId: string) {
  return api.delete<{ success: boolean; message?: string }>(
    `/api/seller/products/${productId}`
  )
}

export function updateMyInventory(productId: string, dto: UpdateInventoryPayload) {
  return api.put<{ success: boolean; message?: string }>(
    `/api/seller/products/${productId}/inventory`,
    dto
  )
}

// ====== Orders ======

export function fetchMyOrders(page = 1, pageSize = 20, status?: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (status !== undefined && status !== null) {
    params.set("status", String(status))
  }
  return api.get<SellerOrdersResponse>(`/api/seller/orders?${params}`)
}

export function fetchMyOrderById(orderId: string) {
  return api.get<SellerOrderDetailResponse>(`/api/seller/orders/${orderId}`)
}

export function updateMyOrderStatus(orderId: string, dto: UpdateSellerOrderStatusPayload) {
  return api.put<{ success: boolean; message?: string }>(
    `/api/seller/orders/${orderId}/status`,
    dto
  )
}

