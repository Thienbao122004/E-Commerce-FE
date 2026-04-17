import { api } from "@/lib/api-client"
import {
  DashboardStatsResponse,
  RecentActivity,
  TopProduct,
  TopShop,
} from "@/types/dashboard"

export function fetchStats() {
  return api.get<DashboardStatsResponse>("/api/admin/dashboard/stats")
}

export function fetchActivities() {
  return api.get<{ success: boolean; activities: RecentActivity[] }>(
    "/api/admin/dashboard/recent-activities?limit=10"
  )
}

export function fetchTopShops() {
  return api.get<{ success: boolean; shops: TopShop[] }>(
    "/api/admin/dashboard/top-shops?limit=10"
  )
}

export function fetchTopProducts() {
  return api.get<{ success: boolean; products: TopProduct[] }>(
    "/api/admin/dashboard/top-products?limit=10"
  )
}
