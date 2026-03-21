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
    completed: number
    cancelled: number
    todayOrders: number
    thisMonthOrders: number
  }
  revenue: {
    totalRevenue: number
    todayRevenue: number
    thisMonthRevenue: number
    lastMonthRevenue: number
    growthPercentage: number
  }
  disputes: {
    total: number
    pending: number
    underReview: number
    resolved: number
    refunded: number
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

