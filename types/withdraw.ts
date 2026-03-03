// ---------- Withdraw Status ----------
export const WithdrawStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
} as const

export const WithdrawStatusLabels: Record<number, string> = {
  [WithdrawStatus.Pending]: "Chờ xử lý",
  [WithdrawStatus.Approved]: "Đã duyệt",
  [WithdrawStatus.Rejected]: "Từ chối",
}

export const WithdrawStatusColors: Record<number, string> = {
  [WithdrawStatus.Pending]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  [WithdrawStatus.Approved]:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  [WithdrawStatus.Rejected]:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

export type WithdrawRequest = {
  id: string
  sellerId: string
  sellerName: string | null
  amount: number
  currency: string
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  status: number
  statusName: string
  rejectionReason: string | null
  adminNote: string | null
  requestedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  reviewedByName: string | null
  paidAt: string | null
}

export type WithdrawListResponse = {
  success: boolean
  message?: string | null
  requests: WithdrawRequest[]
  totalCount: number
  page: number
  pageSize: number
}

export type WithdrawResponse = {
  success: boolean
  message?: string | null
  request?: WithdrawRequest
}
