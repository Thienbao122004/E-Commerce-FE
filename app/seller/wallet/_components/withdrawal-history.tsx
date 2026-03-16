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

const formatDateTime = (ts: string) =>
  new Date(ts).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const STATUS_MAP: Record<number, { label: string; icon: React.ElementType; cls: string; dotCls: string }> = {
  0: {
    label: "Đang xử lý",
    icon: IconClock,
    cls: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    dotCls: "bg-yellow-500",
  },
  1: {
    label: "Thành công",
    icon: IconCircleCheck,
    cls: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    dotCls: "bg-green-500",
  },
  2: {
    label: "Từ chối",
    icon: IconCircleX,
    cls: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    dotCls: "bg-red-500",
  },
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
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
    <Card>
      <CardHeader className="py-3.5 px-4 lg:px-5 border-b">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-muted">
            <IconBuildingBank className="size-3.5 text-muted-foreground" />
          </div>
          <span>Lịch sử rút tiền</span>
          {total > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs font-normal">
              {total} yêu cầu
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading && (
          <div className="grid divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 lg:px-5 py-3.5">
                <Skeleton className="size-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-4 w-24 ml-auto" />
                  <Skeleton className="h-3 w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && withdrawals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <IconBuildingBank className="size-7 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">Chưa có yêu cầu rút tiền</p>
              <p className="text-xs mt-1">Yêu cầu rút tiền của bạn sẽ hiển thị ở đây</p>
            </div>
          </div>
        )}

        {/* Withdrawal List */}
        {!loading && withdrawals.length > 0 && (
          <div className="divide-y">
            {withdrawals.map((w) => {
              const s = STATUS_MAP[w.status] ?? STATUS_MAP[0]
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-3 px-4 lg:px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center size-10 rounded-lg shrink-0 bg-muted/60">
                    <IconArrowUpRight className="size-4.5 text-muted-foreground" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      Rút về {w.bankName}
                      <span className="text-muted-foreground ml-1.5">
                        ···{w.bankAccountNumber.slice(-4)}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDateTime(w.createdAt)}
                      </span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-[18px] border ${s.cls}`}>
                        <s.icon className="size-2.5 mr-0.5" />
                        {s.label}
                      </Badge>
                    </div>
                    {w.note && (
                      <p className="text-xs text-muted-foreground mt-1 truncate italic">
                        &ldquo;{w.note}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm tabular-nums">-{currency(w.amount)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{w.bankAccountName}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between px-4 lg:px-5 py-3 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Hiển thị <span className="font-medium text-foreground">{startItem}–{endItem}</span> trong số{" "}
            <span className="font-medium text-foreground">{total}</span>
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <IconChevronLeft className="size-3.5" />
              </Button>
              <span className="text-xs tabular-nums min-w-[50px] text-center">
                {page} / {totalPages}
              </span>
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
          )}
        </div>
      )}
    </Card>
  )
}
