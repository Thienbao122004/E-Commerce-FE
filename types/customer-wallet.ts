import type { ApiDataResponse } from "./api"

export interface CustomerWalletDto {
  id?: string
  availableBalance: number
  totalRefunded: number
  totalWithdrawn: number
  updatedAt: string
}

/** Response `getWallet` — bọc `CustomerWalletDto` trong `data` */
export type CustomerWalletApiResponse = ApiDataResponse<CustomerWalletDto>

export interface CustomerWalletLedgerItem {
  id: string
  type: 'refund' | 'withdrawal' | string
  amount: number
  referenceType?: string
  referenceId?: string
  note?: string
  createdAt: string
}

export interface CustomerWalletLedgerResponse {
  success: boolean
  message?: string
  transactions: CustomerWalletLedgerItem[]
  totalCount: number
  page: number
  pageSize: number
}

export interface CreateCustomerWithdrawalDto {
  amount: number
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
}

export interface CustomerWithdrawalRequestDto {
  id: string
  amount: number
  currency?: string
  availableBalance?: number
  customerName?: string
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  status: 0 | 1 | 2 | 3
  statusName: string
  rejectionReason?: string
  adminNote?: string
  requestedAt: string
  reviewedAt?: string
  paidAt?: string
}

export interface CustomerWithdrawalListResponse {
  success: boolean
  message?: string
  requests: CustomerWithdrawalRequestDto[]
  totalCount: number
  page: number
  pageSize: number
}

export interface CustomerWithdrawalResponse {
  success: boolean
  message?: string
  request?: CustomerWithdrawalRequestDto
}
