"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  fetchMyWallet,
  fetchMyProducts,
  fetchMyOrders,
} from "@/services/seller-dashboard"
import type {
  SellerWallet,
  SellerProduct,
  SellerOrder,
  SellerDashboardStats,
} from "@/types/seller-dashboard"

export interface SellerDashboardData {
  wallet: SellerWallet | null
  products: SellerProduct[]
  orders: SellerOrder[]
  stats: SellerDashboardStats | null
  walletLoading: boolean
  productsLoading: boolean
  ordersLoading: boolean
}

export function useSellerDashboard(): SellerDashboardData {
  const [wallet, setWallet] = useState<SellerWallet | null>(null)
  const [products, setProducts] = useState<SellerProduct[]>([])
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [stats, setStats] = useState<SellerDashboardStats | null>(null)
  const [walletLoading, setWalletLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    // Fetch wallet
    fetchMyWallet()
      .then((res) => {
        if (!mountedRef.current) return
        if (res.success && res.data) {
          setWallet(res.data)
        }
      })
      .catch((err: unknown) => {
        if (mountedRef.current) {
          const msg = err instanceof Error ? err.message : "Lỗi tải ví"
          toast.error(msg)
        }
      })
      .finally(() => {
        if (mountedRef.current) setWalletLoading(false)
      })

    // Fetch products
    fetchMyProducts(1, 100)
      .then((res) => {
        if (!mountedRef.current) return
        if (res.success && res.data) {
          setProducts(res.data)
        }
      })
      .catch((err: unknown) => {
        if (mountedRef.current) {
          const msg = err instanceof Error ? err.message : "Lỗi tải sản phẩm"
          toast.error(msg)
        }
      })
      .finally(() => {
        if (mountedRef.current) setProductsLoading(false)
      })

    // Fetch orders
    fetchMyOrders(1, 100)
      .then((res) => {
        if (!mountedRef.current) return
        if (res.success && res.data) {
          setOrders(res.data)
        }
      })
      .catch((err: unknown) => {
        if (mountedRef.current) {
          const msg = err instanceof Error ? err.message : "Lỗi tải đơn hàng"
          toast.error(msg)
        }
      })
      .finally(() => {
        if (mountedRef.current) setOrdersLoading(false)
      })
  }, [])

  // Compute stats when data loads
  useEffect(() => {
    if (walletLoading || productsLoading || ordersLoading) return

    const uniqueCustomers = new Set(orders.map((o) => o.customerId)).size
    const uniqueCategories = new Set(
      products.filter((p) => p.categoryName).map((p) => p.categoryName)
    ).size
    const activeProducts = products.filter((p) => p.status === 1).length

    const gross = wallet?.totalEarnings ?? 0
    const refunded = wallet?.totalRefunded ?? 0
    const net =
      wallet?.netEarningsAfterRefunds ?? Math.max(0, gross - refunded)

    setStats({
      totalRevenue: net,
      totalOrders: orders.length,
      totalProducts: products.length,
      totalCustomers: uniqueCustomers,
      categoriesCount: uniqueCategories,
      activeProducts,
    })
  }, [wallet, products, orders, walletLoading, productsLoading, ordersLoading])

  useEffect(() => {
    mountedRef.current = true
    load()
    return () => {
      mountedRef.current = false
    }
  }, [load])

  return {
    wallet,
    products,
    orders,
    stats,
    walletLoading,
    productsLoading,
    ordersLoading,
  }
}
