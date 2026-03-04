"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { IconArrowDownLeft, IconClock, IconWallet } from "@tabler/icons-react"
import type { SellerWallet } from "@/types/seller-dashboard"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

type Props = {
  wallet: SellerWallet | null
  loading: boolean
}

export function WalletSummary({ wallet, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <Skeleton className="h-[100px] w-full rounded-xl" />
        </div>
        <Skeleton className="h-[100px] w-full rounded-xl" />
        <Skeleton className="h-[100px] w-full rounded-xl" />
      </div>
    )
  }

  const available = wallet?.availableBalance ?? 0
  const pending = wallet?.pendingBalance ?? 0
  const earnings = wallet?.totalEarnings ?? 0

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card className="md:col-span-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground">Số dư khả dụng</p>
            <div className="flex items-center justify-center size-7 rounded-full bg-primary/10">
              <IconWallet className="size-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-primary tabular-nums">{currency(available)}</p>
          <p className="text-xs text-muted-foreground mt-1">Có thể rút ngay</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground">Đang xử lý</p>
            <div className="flex items-center justify-center size-7 rounded-full bg-yellow-50 dark:bg-yellow-950/40">
              <IconClock className="size-4 text-yellow-500" />
            </div>
          </div>
          <p className="text-2xl font-bold tabular-nums text-yellow-500">{currency(pending)}</p>
          <p className="text-xs text-muted-foreground mt-1">Từ đơn chưa hoàn tất</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground">Tổng thu nhập</p>
            <div className="flex items-center justify-center size-7 rounded-full bg-green-50 dark:bg-green-950/40">
              <IconArrowDownLeft className="size-4 text-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold tabular-nums text-green-600">{currency(earnings)}</p>
          <p className="text-xs text-muted-foreground mt-1">Tất cả thời gian</p>
        </CardContent>
      </Card>
    </div>
  )
}
