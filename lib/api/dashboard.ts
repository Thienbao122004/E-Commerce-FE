import {
  DashboardStatsResponse,
  RecentActivity,
  TopProduct,
  TopShop,
} from "@/lib/types/dashboard"

const API_BASE = process.env.NEXT_PUBLIC_API_URL 

async function fetchJson<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  })

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      const text = await res.text().catch(() => "")
      if (text) message = text
    }
    const err = new Error(message)
    throw err
  }

  return res.json() as Promise<T>
}

/** Fetch dashboard stats (may be slow) */
export function fetchStats(token: string) {
  return fetchJson<DashboardStatsResponse>("/api/admin/dashboard/stats", token)
}

/** Fetch recent activities (fast) */
export function fetchActivities(token: string) {
  return fetchJson<{ success: boolean; activities: RecentActivity[] }>(
    "/api/admin/dashboard/recent-activities?limit=10",
    token
  )
}

/** Fetch top shops (fast) */
export function fetchTopShops(token: string) {
  return fetchJson<{ success: boolean; shops: TopShop[] }>(
    "/api/admin/dashboard/top-shops?limit=10",
    token
  )
}

/** Fetch top products (fast) */
export function fetchTopProducts(token: string) {
  return fetchJson<{ success: boolean; products: TopProduct[] }>(
    "/api/admin/dashboard/top-products?limit=10",
    token
  )
}
