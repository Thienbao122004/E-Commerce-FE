import { api } from "@/lib/api-client"

export type SellerPlatformFeeResponse = {
  success: boolean
  data?: { commissionPercent: number }
  message?: string
}

export function fetchSellerPlatformFee() {
  return api.get<SellerPlatformFeeResponse>("/api/seller/platform-fee")
}
