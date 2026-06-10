"use client"

import { useState, useEffect } from "react"
import {
  IconShoppingCart,
  IconAlertCircle,
  IconTruckDelivery,
  IconCurrencyDollar,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { OrderStatus } from "@/types/seller-dashboard"
import type { SellerOrder } from "@/types/seller-dashboard"
import { StatsCard, StatsGrid } from "@/components/common/stats-card"
import { formatNumberVN, formatPriceVND as currency } from "@/lib/formatters"
import { fetchSellerDisputes } from "@/services/disputes"
import { DisputeStatus } from "@/types/dispute"
import { fetchMyOrders, fetchMyWallet } from "@/services/seller-dashboard"

type Props = {
  orders: SellerOrder[]
  totalCount: number
  loading: boolean
}

export function OrderStats({ orders, totalCount, loading }: Props) {
  const [activeDisputeCount, setActiveDisputeCount] = useState<number | null>(null)
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [processingCount, setProcessingCount] = useState<number | null>(null)
  const [revenue, setRevenue] = useState<number | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    let active = true
    const fetchStats = async () => {
      try {
        const activeStatuses = [
          DisputeStatus.Pending,
          DisputeStatus.UnderReview,
          DisputeStatus.WaitingSeller,
          DisputeStatus.WaitingCustomer,
        ]
        
        const [
          disputeResults,
          pendingRes,
          confirmedRes,
          processingRes,
          shippingRes,
          walletRes
        ] = await Promise.all([
          Promise.all(activeStatuses.map((status) => fetchSellerDisputes(1, 1, status))),
          fetchMyOrders(1, 1, OrderStatus.PendingConfirmation),
          fetchMyOrders(1, 1, OrderStatus.Confirmed),
          fetchMyOrders(1, 1, OrderStatus.Processing),
          fetchMyOrders(1, 1, OrderStatus.Shipping),
          fetchMyWallet()
        ])

        if (!active) return

        // 1. Dispute Count
        const totalDisputes = disputeResults.reduce((sum, res) => sum + (res.success ? res.totalCount : 0), 0)
        setActiveDisputeCount(totalDisputes)

        // 2. Pending Count
        setPendingCount(pendingRes.success ? (pendingRes.totalCount ?? 0) : 0)

        // 3. Processing Count
        const totalProcessing = 
          (confirmedRes.success ? (confirmedRes.totalCount ?? 0) : 0) +
          (processingRes.success ? (processingRes.totalCount ?? 0) : 0) +
          (shippingRes.success ? (shippingRes.totalCount ?? 0) : 0)
        setProcessingCount(totalProcessing)

        // 4. Total Revenue
        if (walletRes.success && walletRes.data) {
          const w = walletRes.data
          const gross = w.totalEarnings ?? 0
          const refunded = w.totalRefunded ?? 0
          const net = w.netEarningsAfterRefunds ?? Math.max(0, gross - refunded)
          setRevenue(net)
        } else {
          setRevenue(0)
        }
      } catch (err) {
        console.error("Error fetching seller stats:", err)
      } finally {
        if (active) {
          setStatsLoading(false)
        }
      }
    }

    if (loading || activeDisputeCount === null) {
      fetchStats()
    }

    return () => {
      active = false
    }
  }, [loading, activeDisputeCount])

  const pendingVal = pendingCount ?? 0
  const processingVal = processingCount ?? 0
  const revenueVal = revenue ?? 0
  const disputeCount = activeDisputeCount ?? 0

  const cards = [
    {
      label: "Tổng đơn hàng",
      value: formatNumberVN(totalCount),
      icon: <IconShoppingCart />,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      loading: loading,
    },
    {
      label: "Cần xử lý",
      value: pendingVal,
      icon: <IconAlertCircle />,
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
      valueColor: "text-orange-600 dark:text-orange-400",
      loading: loading || statsLoading,
    },
    {
      label: "Đang xử lý",
      value: processingVal,
      icon: <IconTruckDelivery />,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      valueColor: "text-blue-600 dark:text-blue-400",
      loading: loading || statsLoading,
    },
    {
      label: "Khiếu nại",
      value: disputeCount,
      icon: <IconAlertTriangle />,
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      valueColor: "text-red-600 dark:text-red-400",
      loading: loading || statsLoading,
    },
    {
      label: "Doanh thu (đã giao)",
      value: currency(revenueVal),
      icon: <IconCurrencyDollar />,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      valueColor: "text-green-600 dark:text-green-400",
      loading: loading || statsLoading,
    },
  ]

  return (
    <StatsGrid cols={5}>
      {cards.map((card) => (
        <StatsCard key={card.label} {...card} />
      ))}
    </StatsGrid>
  )
}
