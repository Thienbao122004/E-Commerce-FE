"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  IconArrowUpRight,
  IconBuildingBank,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconClock,
  IconCircleX,
} from "@tabler/icons-react"
import type { WithdrawalRecord } from "@/types/seller-dashboard"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

const STATUS_MAP: Record<number, { label: string; icon: React.ElementType; cls: string }> = {
  0: { label: "Đang xử lý", icon: IconClock, cls: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400" },
  1: { label: "Thành công", icon: IconCircleCheck, cls: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
  2: { label: "Từ chối", icon: IconCircleX, cls: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" },
}

type Props = {
  withdrawals: WithdrawalRecord[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  onPageChange: (p: number) => void
}

export function WithdrawalHistory({ withdrawals, total, page, pageSize, loading, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm flex items-center gap-2">
          <IconBuildingBank className="size-4 text-muted-foreground" />
          Lịch sử rút tiền
          {total > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">{total} yêu cầu</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading && (
          <div className="grid divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="size-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        )}

        {!loading && withdrawals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
            <IconBuildingBank className="size-9 opacity-20" />
            <p className="text-sm">Chưa có yêu cầu rút tiền nào</p>
          </div>
        )}

        {!loading && withdrawals.map((w, i) => {
          const s = STATUS_MAP[w.status] ?? STATUS_MAP[0]
          return (
            <div
              key={w.id}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${i < withdrawals.length - 1 ? "border-b" : ""}`}
            >
              <div className="flex items-center justify-center size-9 rounded-full shrink-0 bg-muted">
                <IconArrowUpRight className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  Rút về {w.bankName} · {w.bankAccountNumber.slice(-4).padStart(w.bankAccountNumber.length, "*")}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {new Date(w.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <Badge className={`text-[10px] px-1.5 py-0 h-4 ${s.cls}`}>
                    <s.icon className="size-2.5 mr-0.5" />
                    {s.label}
                  </Badge>
                </div>
                {w.note && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{w.note}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm tabular-nums">-{currency(w.amount)}</p>
                <p className="text-xs text-muted-foreground">{w.bankAccountName}</p>
              </div>
            </div>
          )
        })}
      </CardContent>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-xs text-muted-foreground">{total} yêu cầu</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <IconChevronLeft className="size-3.5" />
            </Button>
            <span className="text-xs tabular-nums">{page}/{totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <IconChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
