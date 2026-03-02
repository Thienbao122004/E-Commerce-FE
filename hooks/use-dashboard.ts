"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
  fetchActivities,
  fetchStats,
  fetchTopProducts,
  fetchTopShops,
} from "@/services/dashboard"
import { supabase } from "@/lib/supabase"
import type {
  DashboardStats,
  RecentActivity,
  TopProduct,
  TopShop,
} from "@/types/dashboard"

export interface DashboardData {
  stats: DashboardStats | null
  activities: RecentActivity[]
  shops: TopShop[]
  products: TopProduct[]
  statsLoading: boolean
  activitiesLoading: boolean
  shopsLoading: boolean
  productsLoading: boolean
}

export function useDashboard(): DashboardData {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [shops, setShops] = useState<TopShop[]>([])
  const [products, setProducts] = useState<TopProduct[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [shopsLoading, setShopsLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (sessionError) {
      toast.error(sessionError.message)
      if (mountedRef.current) {
        setStatsLoading(false)
        setActivitiesLoading(false)
        setShopsLoading(false)
        setProductsLoading(false)
      }
      return
    }

    const token = sessionData.session?.access_token
    if (!token) {
      toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")
      if (mountedRef.current) {
        setStatsLoading(false)
        setActivitiesLoading(false)
        setShopsLoading(false)
        setProductsLoading(false)
      }
      return
    }

    // Fire all 4 fetches independently — each resolves and updates state on its own
    fetchStats(token)
      .then((res) => {
        if (!mountedRef.current) return
        if (res.success && res.stats) {
          setStats(res.stats)
        } else if (res.message) {
          toast.error(res.message)
        }
      })
      .catch((err: unknown) => {
        if (mountedRef.current) {
          const msg =
            err instanceof Error ? err.message : "Lỗi tải thống kê"
          toast.error(msg)
        }
      })
      .finally(() => {
        if (mountedRef.current) setStatsLoading(false)
      })

    fetchActivities(token)
      .then((res) => {
        if (!mountedRef.current) return
        if (res.success) setActivities(res.activities)
      })
      .catch((err: unknown) => {
        if (mountedRef.current) {
          const msg =
            err instanceof Error ? err.message : "Lỗi tải hoạt động"
          toast.error(msg)
        }
      })
      .finally(() => {
        if (mountedRef.current) setActivitiesLoading(false)
      })

    fetchTopShops(token)
      .then((res) => {
        if (!mountedRef.current) return
        if (res.success) setShops(res.shops)
      })
      .catch((err: unknown) => {
        if (mountedRef.current) {
          const msg =
            err instanceof Error ? err.message : "Lỗi tải top shop"
          toast.error(msg)
        }
      })
      .finally(() => {
        if (mountedRef.current) setShopsLoading(false)
      })

    fetchTopProducts(token)
      .then((res) => {
        if (!mountedRef.current) return
        if (res.success) setProducts(res.products)
      })
      .catch((err: unknown) => {
        if (mountedRef.current) {
          const msg =
            err instanceof Error ? err.message : "Lỗi tải top sản phẩm"
          toast.error(msg)
        }
      })
      .finally(() => {
        if (mountedRef.current) setProductsLoading(false)
      })
  }, [])

  useEffect(() => {
    mountedRef.current = true
    load()
    return () => {
      mountedRef.current = false
    }
  }, [load])

  return {
    stats,
    activities,
    shops,
    products,
    statsLoading,
    activitiesLoading,
    shopsLoading,
    productsLoading,
  }
}
