export const VerificationStatus = {
  Pending: 0,
  Verified: 1,
  Rejected: 2,
} as const

export const VerificationStatusLabels: Record<number, string> = {
  [VerificationStatus.Pending]: "Chờ duyệt",
  [VerificationStatus.Verified]: "Đã duyệt",
  [VerificationStatus.Rejected]: "Từ chối",
}

export const VerificationStatusColors: Record<number, string> = {
  [VerificationStatus.Pending]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  [VerificationStatus.Verified]:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  [VerificationStatus.Rejected]:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

// ---------- Shop Status ----------
export const ShopStatus = {
  Inactive: 0,
  Active: 1,
  Suspended: 2,
  Closed: 3,
} as const

export const ShopStatusLabels: Record<number, string> = {
  [ShopStatus.Inactive]: "Chưa kích hoạt",
  [ShopStatus.Active]: "Đang hoạt động",
  [ShopStatus.Suspended]: "Bị đình chỉ",
  [ShopStatus.Closed]: "Đã đóng cửa",
}

export const ShopStatusColors: Record<number, string> = {
  [ShopStatus.Inactive]:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  [ShopStatus.Active]:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  [ShopStatus.Suspended]:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  [ShopStatus.Closed]:
    "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
}

export type ShopDocument = {
  id: string
  docType: string
  fileUrl: string
  status: number
  statusName: string
  rejectionReason: string | null
  submittedAt: string
  reviewedAt: string | null
  reviewedByName: string | null
}

export type ShopVerification = {
  id: string
  ownerId: string
  ownerName: string | null
  ownerEmail: string | null
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  status: number
  statusName: string
  verificationStatus: number
  verificationStatusName: string
  rejectionReason: string | null
  verifiedAt: string | null
  verifiedBy: string | null
  verifiedByName: string | null
  createdAt: string
  documents: ShopDocument[]
}

export type ShopListResponse = {
  success: boolean
  message?: string | null
  shops: ShopVerification[]
  totalCount: number
  page: number
  pageSize: number
}

export type ShopResponse = {
  success: boolean
  message?: string | null
  shop?: ShopVerification
}
