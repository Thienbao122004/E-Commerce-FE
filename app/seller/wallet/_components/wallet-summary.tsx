"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  IconArrowDownRight,
  IconClock,
  IconTrendingUp,
  IconWallet,
} from "@tabler/icons-react"
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className={i === 0 ? "md:col-span-2" : ""}>
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-28" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const available = wallet?.availableBalance ?? 0
  const pending = wallet?.pendingBalance ?? 0
  const earnings = wallet?.totalEarnings ?? 0
  const withdrawn = wallet?.totalWithdrawn ?? 0
  const refunded = wallet?.totalRefunded ?? 0

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card className="md:col-span-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent transition-shadow hover:shadow-md">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <IconWallet className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Số dư khả dụng</p>
              <p className="text-2xl lg:text-3xl font-bold text-primary tabular-nums mt-1">
                {currency(available)}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">Có thể rút ngay</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30 shrink-0">
              <IconClock className="size-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Đang xử lý</p>
              <p className="text-xl font-bold tabular-nums text-yellow-600 dark:text-yellow-400 mt-1">
                {currency(pending)}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">Từ đơn chưa hoàn tất</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
              <IconTrendingUp className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Tổng thu nhập</p>
              <p className="text-xl font-bold tabular-nums text-green-600 dark:text-green-400 mt-1">
                {currency(earnings)}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">Tất cả thời gian</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
              <IconArrowDownRight className="size-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Đã rút</p>
              <p className="text-xl font-bold tabular-nums mt-1">{currency(withdrawn)}</p>
              {refunded > 0 ? (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Hoàn tác đơn: {currency(refunded)}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1.5">Sau khi admin duyệt</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
