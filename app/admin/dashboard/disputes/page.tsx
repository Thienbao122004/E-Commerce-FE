"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconChevronLeft, IconChevronRight, IconRefresh,
  IconCheck, IconX, IconFilter, IconScale, IconEye,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { fetchDisputes, approveRefund, rejectDispute } from "@/services/disputes"
import {
  DisputeStatus, DisputeStatusLabels, DisputeStatusColors, DisputeTypeLabels,
} from "@/types/dispute"
import type { AdminDispute } from "@/types/dispute"
import { DisputeActionDialog } from "./_components/dispute-action-dialog"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

const formatDate = (ts: string) =>
  new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

const statusTabs = [
  { label: "Tất cả", value: null },
  { label: "Chờ xử lý", value: DisputeStatus.Pending },
  { label: "Đang xem xét", value: DisputeStatus.UnderReview },
  { label: "Chờ seller", value: DisputeStatus.WaitingSeller },
  { label: "Đã giải quyết", value: DisputeStatus.Resolved },
  { label: "Từ chối", value: DisputeStatus.Rejected },
  { label: "Đã hoàn tiền", value: DisputeStatus.Refunded },
]

export default function DisputesPage() {
  const router = useRouter()
  const [disputes, setDisputes] = React.useState<AdminDispute[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [status, setStatus] = React.useState<number | null>(null)
  const pageSize = 20
  const totalPages = Math.ceil(totalCount / pageSize)

  const [dialogDispute, setDialogDispute] = React.useState<AdminDispute | null>(null)
  const [dialogType, setDialogType] = React.useState<"approve" | "reject" | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) { setLoading(false); return }
    try {
      const res = await fetchDisputes(token, page, pageSize, status)
      if (res.success) { setDisputes(res.disputes); setTotalCount(res.totalCount) }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Lỗi") }
    finally { setLoading(false) }
  }, [page, status])

  React.useEffect(() => { load() }, [load])

  const openDialog = (d: AdminDispute, type: "approve" | "reject") => {
    setDialogDispute(d)
    setDialogType(type)
  }

  const handleAction = async (resolution: string, adminNote: string, approvedAmount?: number) => {
    if (!dialogDispute || !resolution) return
    if (dialogType === "approve" && approvedAmount) {
      if (approvedAmount <= 0) { toast.error("Số tiền duyệt phải lớn hơn 0"); return }
      if (approvedAmount > dialogDispute.requestedAmount) { toast.error("Số tiền duyệt không được vượt quá số tiền yêu cầu"); return }
    }
    setActionLoading(true)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) { setActionLoading(false); return }
    try {
      const res = dialogType === "approve"
        ? await approveRefund(token, dialogDispute.id, approvedAmount, resolution, adminNote || undefined)
        : await rejectDispute(token, dialogDispute.id, resolution, adminNote || undefined)
      if (res.success) { toast.success(res.message ?? "Thao tác thành công"); setDialogDispute(null); setDialogType(null); load() }
      else toast.error(res.message ?? "Lỗi")
    } catch (err) { toast.error(err instanceof Error ? err.message : "Lỗi") }
    finally { setActionLoading(false) }
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <IconScale className="size-7" />Quản lý tranh chấp
              </h1>
              <p className="text-muted-foreground text-sm">{loading ? "Đang tải..." : `${totalCount} tranh chấp`}</p>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <IconRefresh className="mr-1.5 size-4" />Làm mới
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <IconFilter className="size-4 text-muted-foreground" />
              <Select
                value={status === null ? "all" : String(status)}
                onValueChange={(v) => { setStatus(v === "all" ? null : Number(v)); setPage(1) }}
              >
                <SelectTrigger className="w-[160px] bg-background"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                <SelectContent>
                  {statusTabs.map((tab) => (
                    <SelectItem key={tab.value ?? "all"} value={tab.value === null ? "all" : String(tab.value)}>{tab.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>))}
                    </TableRow>
                  ))
                ) : disputes.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="h-32 text-center text-muted-foreground">Không tìm thấy tranh chấp nào.</TableCell></TableRow>
                ) : (
                  disputes.map((d, idx) => (
                    <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/admin/dashboard/disputes/${d.id}`)}>
                      <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell><span className="font-mono text-sm font-medium">{d.id.slice(0, 8)}...</span></TableCell>
                      <TableCell className="text-sm">{d.customerName}</TableCell>
                      <TableCell className="text-sm">{d.shopName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{DisputeTypeLabels[d.type] ?? d.typeName}</Badge></TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{currency(d.requestedAmount)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${DisputeStatusColors[d.status] ?? ""}`}>
                          {DisputeStatusLabels[d.status] ?? d.statusName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm tabular-nums">{formatDate(d.createdAt)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => router.push(`/admin/dashboard/disputes/${d.id}`)}>
                            <IconEye className="size-4" />
                          </Button>
                          {d.status <= DisputeStatus.WaitingCustomer && (
                            <>
                              <Button variant="outline" size="sm" className="h-8 text-xs text-green-600" onClick={() => openDialog(d, "approve")} disabled={actionLoading}>
                                <IconCheck className="mr-1 size-3.5" />Duyệt
                              </Button>
                              <Button variant="outline" size="sm" className="h-8 text-xs text-red-600" onClick={() => openDialog(d, "reject")} disabled={actionLoading}>
                                <IconX className="mr-1 size-3.5" />Từ chối
                              </Button>
                            </>
                          )}
                          {d.status === DisputeStatus.WaitingSeller && (
                            <span className="text-xs text-orange-500 italic">Đang chờ seller</span>
                          )}
                          {d.resolution && d.status > DisputeStatus.WaitingCustomer && (
                            <span className="text-xs text-muted-foreground max-w-[120px] truncate inline-block" title={d.resolution}>{d.resolution}</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Trang {page} / {totalPages} · {totalCount} tranh chấp</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="size-8" onClick={() => setPage(page - 1)} disabled={page <= 1}><IconChevronLeft className="size-4" /></Button>
                <Button variant="outline" size="icon" className="size-8" onClick={() => setPage(page + 1)} disabled={page >= totalPages}><IconChevronRight className="size-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DisputeActionDialog
        dispute={dialogDispute}
        dialogType={dialogType}
        onClose={() => { setDialogDispute(null); setDialogType(null) }}
        loading={actionLoading}
        onConfirm={handleAction}
      />
    </>
  )
}
