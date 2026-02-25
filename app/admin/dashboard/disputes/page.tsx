"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh,
  IconExternalLink,
  IconCheck,
  IconX,
  IconFilter,
} from "@tabler/icons-react"
import { toast } from "sonner"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { fetchDisputes, approveRefund, rejectDispute } from "@/lib/api/disputes"
import {
  DisputeStatus,
  DisputeStatusLabels,
  DisputeStatusColors,
  DisputeTypeLabels,
} from "@/lib/types/dispute"
import type { AdminDispute } from "@/lib/types/dispute"

// ---------- Formatters ----------
const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v)

const formatDate = (ts: string) =>
  new Date(ts).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const statusTabs = [
  { label: "Tất cả", value: null },
  { label: "Chờ xử lý", value: DisputeStatus.Pending },
  { label: "Đang xem xét", value: DisputeStatus.UnderReview },
  { label: "Chờ seller", value: DisputeStatus.WaitingSeller },
  { label: "Đã giải quyết", value: DisputeStatus.Resolved },
  { label: "Từ chối", value: DisputeStatus.Rejected },
  { label: "Đã hoàn tiền", value: DisputeStatus.Refunded },
]

// ---------- Table Skeleton ----------
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

export default function DisputesPage() {
  const [disputes, setDisputes] = React.useState<AdminDispute[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [status, setStatus] = React.useState<number | null>(null)
  const pageSize = 20
  const totalPages = Math.ceil(totalCount / pageSize)

  // Dialog state
  const [dialogDispute, setDialogDispute] = React.useState<AdminDispute | null>(null)
  const [dialogType, setDialogType] = React.useState<"approve" | "reject">("approve")
  const [resolution, setResolution] = React.useState("")
  const [adminNote, setAdminNote] = React.useState("")
  const [approvedAmount, setApprovedAmount] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) { setLoading(false); return }
    try {
      const res = await fetchDisputes(token, page, pageSize, status)
      if (res.success) {
        setDisputes(res.disputes)
        setTotalCount(res.totalCount)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải tranh chấp")
    } finally {
      setLoading(false)
    }
  }, [page, status])

  React.useEffect(() => { load() }, [load])

  const openDialog = (d: AdminDispute, type: "approve" | "reject") => {
    setDialogDispute(d)
    setDialogType(type)
    setResolution("")
    setAdminNote("")
    setApprovedAmount(type === "approve" ? String(d.requestedAmount) : "")
  }

  const handleAction = async () => {
    if (!dialogDispute || !resolution) return
    setActionLoading(true)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) { setActionLoading(false); return }
    try {
      const res =
        dialogType === "approve"
          ? await approveRefund(
            token,
            dialogDispute.id,
            approvedAmount ? Number(approvedAmount) : undefined,
            resolution,
            adminNote || undefined
          )
          : await rejectDispute(
            token,
            dialogDispute.id,
            resolution,
            adminNote || undefined
          )
      if (res.success) {
        toast.success(res.message ?? "Thao tác thành công")
        setDialogDispute(null)
        load()
      } else {
        toast.error(res.message ?? "Lỗi thao tác")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi thao tác")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {/* Filter */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <IconFilter className="size-4 text-muted-foreground" />
              <Select
                value={status === null ? "all" : String(status)}
                onValueChange={(v) => { setStatus(v === "all" ? null : Number(v)); setPage(1) }}
              >
                <SelectTrigger className="w-[160px] bg-background">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {statusTabs.map((tab) => (
                    <SelectItem key={tab.value ?? "all"} value={tab.value === null ? "all" : String(tab.value)}>
                      {tab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Cửa hàng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="text-right">Số tiền YC</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton />
                ) : disputes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      Không tìm thấy tranh chấp nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  disputes.map((d, idx) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/disputes/${d.id}`}
                          className="font-mono text-sm font-medium hover:underline"
                        >
                          {d.id.slice(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{d.customerName}</TableCell>
                      <TableCell className="text-sm">{d.shopName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {DisputeTypeLabels[d.type] ?? d.typeName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {currency(d.requestedAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${DisputeStatusColors[d.status] ?? ""}`}
                        >
                          {DisputeStatusLabels[d.status] ?? d.statusName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm tabular-nums">
                        {formatDate(d.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" asChild>
                            <Link href={`/dashboard/disputes/${d.id}`}>
                              <IconExternalLink className="size-4" />
                            </Link>
                          </Button>
                          {d.status <= DisputeStatus.WaitingCustomer && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs text-green-600"
                                onClick={() => openDialog(d, "approve")}
                                disabled={actionLoading}
                              >
                                <IconCheck className="mr-1 size-3.5" />
                                Duyệt
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs text-red-600"
                                onClick={() => openDialog(d, "reject")}
                                disabled={actionLoading}
                              >
                                <IconX className="mr-1 size-3.5" />
                                Từ chối
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Trang {page} / {totalPages} · {totalCount} tranh chấp
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="size-8" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                  <IconChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="size-8" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                  <IconChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action dialog */}
      <Dialog open={dialogDispute !== null} onOpenChange={(v) => { if (!v) setDialogDispute(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "approve" ? "Duyệt hoàn tiền" : "Từ chối tranh chấp"}
            </DialogTitle>
            <DialogDescription>
              Tranh chấp: {dialogDispute?.id.slice(0, 8)}... · {dialogDispute?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {dialogType === "approve" && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Số tiền duyệt</label>
                <Input
                  type="number"
                  placeholder="Nhập số tiền..."
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Yêu cầu: {dialogDispute ? currency(dialogDispute.requestedAmount) : ""}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Kết luận *</label>
              <Textarea
                placeholder="Nhập kết luận xử lý..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ghi chú admin (tùy chọn)</label>
              <Textarea
                placeholder="Ghi chú nội bộ..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="min-h-[40px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDispute(null)} disabled={actionLoading}>
              Hủy
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading || !resolution}
              variant={dialogType === "approve" ? "default" : "destructive"}
            >
              {actionLoading ? "Đang xử lý..." : dialogType === "approve" ? "Duyệt hoàn tiền" : "Từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
