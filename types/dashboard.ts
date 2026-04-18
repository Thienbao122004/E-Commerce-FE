export type DashboardStats = {
  users: {
    total: number
    active: number
    suspended: number
    newThisMonth: number
    customers: number
    sellers: number
  }
  shops: {
    total: number
    active: number
    pendingVerification: number
    suspended: number
    newThisMonth: number
  }
  products: {
    total: number
    active: number
    draft: number
    hidden: number
    outOfStock: number
    newThisMonth: number
  }
  orders: {
    total: number
    pending: number
    processing: number
    /** Đã xác nhận (seller đã nhận đơn) */
    confirmed: number
    /** Đã giao đến khách, chưa hoàn tất */
    delivered: number
    completed: number
    cancelled: number
    refunded: number
    todayOrders: number
    thisMonthOrders: number
  }
  /** Doanh thu sàn: tổng phí đã ghi nhận (bản ghi chưa bị hoàn). */
  revenue: {
    totalRevenue: number
    todayRevenue: number
    thisMonthRevenue: number
    lastMonthRevenue: number
    growthPercentage: number
  }
  /** GMV: tổng giá trị đơn hoàn thành (khác thu nhập sàn). */
  completedOrderGmv?: {
    totalGmv: number
    todayGmv: number
    thisMonthGmv: number
    lastMonthGmv: number
    growthPercentage: number
  }
  disputes: {
    total: number
    pending: number
    underReview: number
    resolved: number
    refunded: number
  }
  /** Phí sàn từ đơn đã quyết toán ví (API có thể chưa gửi — dùng mặc định 0) */
  platformFees?: {
    totalFees: number
    todayFees: number
    thisMonthFees: number
    lastMonthFees: number
    settledOrdersCount: number
  }
}

export type DashboardStatsResponse = {
  success: boolean
  message?: string | null
  stats?: DashboardStats
}

export type RecentActivity = {
  type: string
  description: string
  timestamp: string
}

export type TopProduct = {
  id: string
  name: string
  code: string
  shopName: string
  totalSold: number
  revenue: number
}

export type TopShop = {
  id: string
  name: string
  totalOrders: number
  totalRevenue: number
}

