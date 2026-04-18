"use client"

import * as React from "react"
import Link from "next/link"
import { IconRefresh, IconExternalLink } from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  fetchPlatformFeeRecords,
  fetchPlatformFeeSummary,
} from "@/services/admin-platform-fees"
import type { PlatformFeeRecordRow, PlatformFeeSummary } from "@/types/admin-platform-fees"
import { SetHeaderActions } from "@/hooks/use-header-actions"
import { formatDateTimeVN, formatPriceVND } from "@/lib/formatters"

function startOfDayUtcIso(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00.000Z")
  return d.toISOString()
}

function endOfDayUtcIso(dateStr: string) {
  const d = new Date(dateStr + "T23:59:59.999Z")
  return d.toISOString()
}

export default function AdminPlatformFeesPage() {
  const [summary, setSummary] = React.useState<PlatformFeeSummary | null>(null)
  const [records, setRecords] = React.useState<PlatformFeeRecordRow[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")
  const pageSize = 15

  const rangeParams = React.useCallback(() => {
    const fromUtc = fromDate ? startOfDayUtcIso(fromDate) : undefined
    const toUtc = toDate ? endOfDayUtcIso(toDate) : undefined
    return { fromUtc, toUtc }
  }, [fromDate, toDate])

  const load = React.useCallback(async () => {
    setLoading(true)
    const { fromUtc, toUtc } = rangeParams()
    try {
      const [sumRes, recRes] = await Promise.all([
        fetchPlatformFeeSummary(fromUtc, toUtc),
        fetchPlatformFeeRecords(page, pageSize, fromUtc, toUtc),
      ])
      if (sumRes.success && sumRes.data) setSummary(sumRes.data)
      else setSummary(null)
      if (recRes.success && recRes.data) {
        setRecords(recRes.data.records)
        setTotal(recRes.data.totalCount)
      } else {
        setRecords([])
        setTotal(0)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải dữ liệu phí sàn")
    } finally {
      setLoading(false)
    }
  }, [page, rangeParams])

  React.useEffect(() => {
    load()
  }, [load])

  React.useEffect(() => {
    setPage(1)
  }, [fromDate, toDate])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <>
      <SetHeaderActions>
        <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
          <IconRefresh className={`mr-1.5 size-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </SetHeaderActions>
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lọc theo thời gian</CardTitle>
            <CardDescription>UTC theo ngày — để trống để xem toàn bộ</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pf-from">Từ ngày</Label>
              <Input
                id="pf-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-to">Đến ngày</Label>
              <Input
                id="pf-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <Button variant="secondary" type="button" onClick={() => { setFromDate(""); setToDate("") }}>
              Xóa lọc
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading && !summary ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Tổng phí sàn</CardDescription>
                  <CardTitle className="text-xl tabular-nums">
                    {formatPriceVND(summary?.totalFeeAmount ?? 0)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Tổng tiền hàng (subtotal)</CardDescription>
                  <CardTitle className="text-xl tabular-nums">
                    {formatPriceVND(summary?.totalGrossSubtotal ?? 0)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Đã trả seller (net)</CardDescription>
                  <CardTitle className="text-xl tabular-nums">
                    {formatPriceVND(summary?.totalNetToSeller ?? 0)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Số đơn quyết toán</CardDescription>
                  <CardTitle className="text-xl tabular-nums">{summary?.recordCount ?? 0}</CardTitle>
                </CardHeader>
              </Card>
            </>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Chi tiết theo đơn</CardTitle>
            <CardDescription>
              {total} bản ghi — trang {page}/{totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời điểm</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Phí sàn</TableHead>
                    <TableHead className="text-right">Net seller</TableHead>
                    <TableHead>Mã đơn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        Đang tải…
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-sm">{formatDateTimeVN(r.createdAt)}</TableCell>
                        <TableCell className="max-w-[140px] truncate">{r.shopName ?? "—"}</TableCell>
                        <TableCell className="max-w-[120px] truncate">{r.sellerName ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatPriceVND(r.grossSubtotal)}</TableCell>
                        <TableCell className="text-right">{r.commissionPercent}%</TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-amber-700 dark:text-amber-400">
                          {formatPriceVND(r.feeAmount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatPriceVND(r.netToSeller)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {r.orderCode}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                  Trước
                </Button>
                <span className="text-sm text-muted-foreground">
                  Trang {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <IconExternalLink className="size-3.5" />
                Tổng phí sàn trên dashboard hiển thị ở thẻ &quot;Doanh thu sàn (phí)&quot;
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
