// ---------- Dispute Status ----------
export const DisputeStatus = {
  Pending: 0,
  UnderReview: 1,
  WaitingSeller: 2,
  WaitingCustomer: 3,
  Resolved: 4,
  Rejected: 5,
  Refunded: 6,
  Cancelled: 7,
} as const

export type DisputeStatusValue =
  (typeof DisputeStatus)[keyof typeof DisputeStatus]

export const DisputeStatusLabels: Record<number, string> = {
  [DisputeStatus.Pending]: "Chờ xử lý",
  [DisputeStatus.UnderReview]: "Đang xem xét",
  [DisputeStatus.WaitingSeller]: "Chờ seller",
  [DisputeStatus.WaitingCustomer]: "Chờ customer",
  [DisputeStatus.Resolved]: "Đã giải quyết",
  [DisputeStatus.Rejected]: "Từ chối",
  [DisputeStatus.Refunded]: "Đã hoàn tiền",
  [DisputeStatus.Cancelled]: "Đã hủy",
}

export const DisputeStatusColors: Record<number, string> = {
  [DisputeStatus.Pending]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  [DisputeStatus.UnderReview]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  [DisputeStatus.WaitingSeller]:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  [DisputeStatus.WaitingCustomer]:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  [DisputeStatus.Resolved]:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  [DisputeStatus.Rejected]:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  [DisputeStatus.Refunded]:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  [DisputeStatus.Cancelled]:
    "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
}

// ---------- Dispute Type ----------
export const DisputeType = {
  Refund: 0,
  Return: 1,
  Damaged: 2,
  NotReceived: 3,
  WrongItem: 4,
  QualityIssue: 5,
  Other: 6,
} as const

export const DisputeTypeLabels: Record<number, string> = {
  [DisputeType.Refund]: "Hoàn tiền",
  [DisputeType.Return]: "Trả hàng",
  [DisputeType.Damaged]: "Hư hỏng",
  [DisputeType.NotReceived]: "Không nhận được",
  [DisputeType.WrongItem]: "Sai hàng",
  [DisputeType.QualityIssue]: "Chất lượng",
  [DisputeType.Other]: "Khác",
}

// ---------- Types ----------
/** Dòng đơn nằm trong phạm vi khiếu nại (TMĐT: chọn món + SL). */
export type DisputeAffectedItem = {
  orderItemId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

/** Trần hoàn tiền khi admin duyệt: min(yêu cầu, tổng đơn) — nếu không có orderTotal thì chỉ so với yêu cầu. */
export function disputeRefundCeiling(d: {
  requestedAmount: number
  orderTotal?: number
}): number {
  if (d.requestedAmount > 0) return d.requestedAmount
  return d.orderTotal ?? 0
}

export type AdminDispute = {
  id: string
  orderId: string
  /** Tổng đơn — dùng làm trần khi khách không nhập số tiền yêu cầu */
  orderTotal?: number
  customerId: string
  customerName: string
  shopId: string
  shopName: string
  type: number
  typeName: string
  status: number
  statusName: string
  title: string
  reason: string
  requestedAmount: number
  approvedAmount: number | null
  sellerResponse: string | null
  sellerRespondedAt: string | null
  resolution: string | null
  adminNote: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  evidenceUrls: string[]
  sellerEvidenceUrls: string[]
  customerNote: string | null
  affectedItems?: DisputeAffectedItem[]
}

export type DisputeListResponse = {
  success: boolean
  message?: string | null
  disputes: AdminDispute[]
  totalCount: number
  page: number
  pageSize: number
}

export type DisputeResponse = {
  success: boolean
  message?: string | null
  dispute?: AdminDispute
}

// ---------- Seller Dispute Types ----------
export type SellerDispute = {
  id: string
  orderId: string
  customerId: string
  customerName: string
  shopId: string
  type: number
  typeName: string
  status: number
  statusName: string
  title: string
  reason: string
  requestedAmount: number
  approvedAmount: number | null
  resolution: string | null
  evidenceUrls: string[]
  sellerEvidenceUrls: string[]
  sellerResponse: string | null
  sellerRespondedAt: string | null
  createdAt: string
  updatedAt: string
  canRespond: boolean
  customerNote: string | null
  adminNote: string | null
  affectedItems?: DisputeAffectedItem[]
}

export type SellerDisputeListResponse = {
  success: boolean
  message?: string | null
  disputes: SellerDispute[]
  totalCount: number
  page: number
  pageSize: number
}

export type SellerDisputeResponse = {
  success: boolean
  message?: string | null
  dispute?: SellerDispute
}

// ---------- Customer Dispute Types ----------
export type CustomerDispute = {
  id: string
  orderId: string
  shopId: string
  shopName: string
  type: number
  typeName: string
  status: number
  statusName: string
  title: string
  reason: string
  requestedAmount: number
  approvedAmount: number | null
  resolution: string | null
  evidenceUrls: string[]
  sellerEvidenceUrls: string[]
  sellerResponse: string | null
  sellerRespondedAt: string | null
  createdAt: string
  updatedAt: string
  canUpdateEvidence: boolean
  customerNote: string | null
  adminNote?: string | null
  affectedItems?: DisputeAffectedItem[]
}

export type CustomerDisputeListResponse = {
  success: boolean
  message?: string | null
  disputes: CustomerDispute[]
  totalCount: number
  page: number
  pageSize: number
}

export type CustomerDisputeResponse = {
  success: boolean
  message?: string | null
  dispute?: CustomerDispute
}

export type CreateDisputeRequest = {
  orderId: string
  type: number
  title: string
  reason: string
  requestedAmount: number
  evidenceUrls?: string[]
  /** Bắt buộc: ít nhất một dòng hàng trong đơn. */
  items: { orderItemId: string; quantity: number }[]
}
