export type PlatformFeeConfigDto = {
  id: string
  commissionPercent: number
  changedBy: string
  changedByName: string | null
  note: string | null
  createdAt: string
}

export type UpdatePlatformFeeSettingsRequest = {
  commissionPercent: number
  note?: string | null
}

export type PlatformFeeSettingsApiResponse = {
  success: boolean
  data?: PlatformFeeConfigDto | null
  message?: string
}

export type PlatformFeeSettingsHistoryApiResponse = {
  success: boolean
  data?: {
    items: PlatformFeeConfigDto[]
    totalCount: number
    page: number
    pageSize: number
  }
  message?: string
}

export type PlatformFeeSummary = {
  totalFeeAmount: number
  totalGrossSubtotal: number
  totalNetToSeller: number
  recordCount: number
  fromUtc?: string | null
  toUtc?: string | null
}

export type PlatformFeeRecordRow = {
  id: string
  orderId: string
  orderCode: string
  paymentId: string | null
  shopId: string
  shopName: string | null
  sellerId: string
  sellerName: string | null
  grossSubtotal: number
  commissionPercent: number
  feeAmount: number
  netToSeller: number
  currency: string
  createdAt: string
}

export type PlatformFeeRecordsApiData = {
  records: PlatformFeeRecordRow[]
  totalCount: number
  page: number
  pageSize: number
  summary: PlatformFeeSummary | null
}

export type PlatformFeeSummaryApiResponse = {
  success: boolean
  data?: PlatformFeeSummary
  message?: string
}

export type PlatformFeeRecordsApiResponse = {
  success: boolean
  data?: PlatformFeeRecordsApiData
  message?: string
}
