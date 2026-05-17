"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconRefresh, IconCheck, IconX, IconScale, IconEye,
  IconTruckReturn, IconCash, IconAlertTriangle, IconPackageOff,
  IconSwitchHorizontal, IconStarHalf
} from "@tabler/icons-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchDisputes, approveRefund, rejectDispute } from "@/services/disputes"
import {
  DisputeStatus, DisputeStatusLabels, DisputeStatusColors,
  DisputeType, DisputeTypeLabels,
  disputeRefundCeiling,
} from "@/types/dispute"
import type { AdminDispute } from "@/types/dispute"
const DisputeActionDialog = dynamic(() => import("./_components/dispute-action-dialog").then(m => m.DisputeActionDialog))

import FilterBar from "@/components/common/filter-bar"
import type { FilterConfig } from "@/components/common/filter-bar"
import TablePagination from "@/components/common/table-pagination"
import { SortableTableHead, getNextSort } from "@/components/common/table-sorting"
import type { SortConfig } from "@/components/common/table-sorting"
import { useDebounce } from "@/hooks/use-debounce"
import { useTableData } from "@/hooks/use-table-data"
import { SetHeaderActions } from "@/hooks/use-header-actions"
import { formatDateTimeVN, formatPriceVND } from "@/lib/formatters"
import { fetchStats } from "@/services/dashboard"
import type { DashboardStats } from "@/types/dashboard"

export default function DisputesPage() {
  const router = useRouter()
  const [disputes, setDisputes] = React.useState<AdminDispute[]>([])
  const [dashboardStats, setDashboardStats] = React.useState<DashboardStats | null>(null)
  const [totalCount, setTotalCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [pg, setPg] = React.useState(1)
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [searchInput, setSearchInput] = React.useState("")
  const debouncedSearch = useDebounce(searchInput)
  const [sort, setSort] = React.useState<SortConfig | null>(null)
  const ps = 10
  const tp = Math.ceil(totalCount / ps)

  const [dialogDispute, setDialogDispute] = React.useState<AdminDispute | null>(null)
  const [dialogType, setDialogType] = React.useState<"approve" | "reject" | null>(null)

  React.useEffect(() => { setPg(1) }, [debouncedSearch])

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const statusVal = statusFilter === "all" ? null : Number(statusFilter)
      const typeVal = typeFilter === "all" ? null : Number(typeFilter)
      
      const [res, statsRes] = await Promise.all([
        fetchDisputes(pg, ps, statusVal, typeVal),
        fetchStats()
      ])
      
      if (res.success) { setDisputes(res.disputes); setTotalCount(res.totalCount) }
      if (statsRes.success && statsRes.stats) { setDashboardStats(statsRes.stats) }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Lỗi") }
    finally { setLoading(false) }
  }, [pg, statusFilter, typeFilter])

  React.useEffect(() => { load() }, [load])

  const openDialog = (d: AdminDispute, type: "approve" | "reject") => {
    setDialogDispute(d)
    setDialogType(type)
  }

  const handleAction = async (resolution: string, adminNote: string, approvedAmount?: number) => {
    if (!dialogDispute || !resolution) return
    let finalApproveAmount: number | undefined
    if (dialogType === "approve") {
      const d = dialogDispute
      const ceiling = disputeRefundCeiling(d)
      let amt = approvedAmount
      if ((amt === undefined || Number.isNaN(amt)) && d.requestedAmount > 0) {
        amt = d.requestedAmount
      }
      if (amt === undefined || Number.isNaN(amt)) {
        toast.error("Vui lòng nhập số tiền hoàn.")
        return
      }
      if (amt <= 0) { toast.error("Số tiền duyệt phải lớn hơn 0"); return }
      if (amt > ceiling) {
        const lineSum = d.affectedItems && d.affectedItems.length > 0
          ? d.affectedItems.reduce((s, i) => s + i.lineTotal, 0)
          : 0
        toast.error(
          d.requestedAmount > 0
            ? lineSum > 0 && lineSum < d.requestedAmount
              ? "Số tiền duyệt không được vượt quá tổng giá trị dòng hàng khiếu nại"
              : "Số tiền duyệt không được vượt quá số tiền yêu cầu"
            : lineSum > 0
              ? "Số tiền duyệt không được vượt quá tổng giá trị dòng hàng khiếu nại"
              : "Số tiền duyệt không được vượt quá tổng đơn hàng"
        )
        return
      }
      finalApproveAmount = amt
    }
    setActionLoading(true)
    try {
      const res = dialogType === "approve"
        ? await approveRefund(
            dialogDispute.id,
            finalApproveAmount,
            resolution,
            adminNote || undefined
          )
        : await rejectDispute(dialogDispute.id, resolution, adminNote || undefined)
      if (res.success) { toast.success(res.message ?? "Thao tác thành công"); setDialogDispute(null); setDialogType(null); load() }
      else toast.error(res.message ?? "Lỗi")
    } catch (err) { toast.error(err instanceof Error ? err.message : "Lỗi") }
    finally { setActionLoading(false) }
  }

  const sortAccessor = React.useCallback((row: AdminDispute, key: string): string | number => {
    switch (key) {
      case "customerName": return row.customerName ?? ""
      case "shopName": return row.shopName ?? ""
      case "type": return row.type
      case "requestedAmount": return row.requestedAmount
      case "status": return row.status
      case "createdAt": return row.createdAt ?? ""
      default: return ""
    }
  }, [])

  // Trạng thái / loại lọc từ API (fetchDisputes); chỉ lọc cục bộ theo ô tìm kiếm
  const tableFilters = React.useMemo(() => [], [])

  const { filtered: sorted } = useTableData<AdminDispute>({
    data: disputes,
    search: debouncedSearch,
    searchKeys: ["customerName", "shopName", "title", "id"],
    filters: tableFilters,
    sort,
    sortAccessor,
  })

  const handleSort = (key: string) => setSort(getNextSort(sort, key))

  const filters: FilterConfig[] = React.useMemo(() => [
    {
      key: "status",
      label: "Trạng thái",
      value: statusFilter,
      onChange: (v: string) => { setStatusFilter(v); setPg(1) },
      width: "w-[160px]",
      options: [
        { value: "all", label: "Tất cả trạng thái" },
        { value: String(DisputeStatus.Pending), label: "Chờ xử lý" },
        { value: String(DisputeStatus.UnderReview), label: "Đang xem xét" },
        { value: String(DisputeStatus.WaitingSeller), label: "Chờ seller" },
        { value: String(DisputeStatus.WaitingCustomer), label: "Chờ customer" },
        { value: String(DisputeStatus.Resolved), label: "Đã giải quyết" },
        { value: String(DisputeStatus.Rejected), label: "Từ chối" },
        { value: String(DisputeStatus.Refunded), label: "Đã hoàn tiền" },
        { value: String(DisputeStatus.Cancelled), label: "Đã hủy" },
      ],
    },
    {
      key: "type",
      label: "Loại",
      value: typeFilter,
      onChange: (v: string) => { setTypeFilter(v); setPg(1) },
      width: "w-[160px]",
      options: [
        { value: "all", label: "Tất cả loại" },
        { value: String(DisputeType.Refund), label: "Hoàn tiền" },
        { value: String(DisputeType.Return), label: "Trả hàng" },
        { value: String(DisputeType.Damaged), label: "Hư hỏng" },
        { value: String(DisputeType.NotReceived), label: "Không nhận được" },
        { value: String(DisputeType.WrongItem), label: "Sai hàng" },
        { value: String(DisputeType.QualityIssue), label: "Chất lượng" },
        { value: String(DisputeType.Other), label: "Khác" },
      ],
    },
  ], [statusFilter, typeFilter])

  return (
    <>
      <SetHeaderActions>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <IconRefresh className="mr-1.5 size-4" />Làm mới
        </Button>
      </SetHeaderActions>

      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4">
          
          {/* Dashboard Stats Cards */}
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
            {[
              { label: "Trả hàng", icon: IconTruckReturn, count: dashboardStats?.disputes.typeReturn ?? 0, color: "text-blue-600", bg: "bg-blue-100" },
              { label: "Hoàn tiền", icon: IconCash, count: dashboardStats?.disputes.typeRefund ?? 0, color: "text-emerald-600", bg: "bg-emerald-100" },
              { label: "Hư hỏng", icon: IconAlertTriangle, count: dashboardStats?.disputes.typeDamaged ?? 0, color: "text-orange-600", bg: "bg-orange-100" },
              { label: "Không nhận", icon: IconPackageOff, count: dashboardStats?.disputes.typeNotReceived ?? 0, color: "text-red-600", bg: "bg-red-100" },
              { label: "Sai hàng", icon: IconSwitchHorizontal, count: dashboardStats?.disputes.typeWrongItem ?? 0, color: "text-purple-600", bg: "bg-purple-100" },
              { label: "Chất lượng", icon: IconStarHalf, count: dashboardStats?.disputes.typeQualityIssue ?? 0, color: "text-amber-600", bg: "bg-amber-100" },
            ].map((stat, i) => (
              <Card key={i} data-slot="card" className="@container/card border-muted/50 hover:border-primary/20 transition-colors">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-3">
                  <div className={`p-2.5 rounded-full ${stat.bg} ${stat.color} shadow-sm`}>
                    <stat.icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold tabular-nums leading-none">
                      {loading && !dashboardStats ? "-" : stat.count}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <FilterBar
            searchPlaceholder="Tìm khách hàng, cửa hàng, mã tranh chấp..."
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearch={load}
            filters={filters}
          />

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>Mã</TableHead>
                  <SortableTableHead sortKey="customerName" currentSort={sort} onSort={handleSort}>Khách hàng</SortableTableHead>
                  <SortableTableHead sortKey="shopName" currentSort={sort} onSort={handleSort}>Cửa hàng</SortableTableHead>
                  <SortableTableHead sortKey="type" currentSort={sort} onSort={handleSort}>Loại</SortableTableHead>
                  <SortableTableHead sortKey="requestedAmount" currentSort={sort} onSort={handleSort}>Số tiền YC</SortableTableHead>
                  <SortableTableHead sortKey="status" currentSort={sort} onSort={handleSort}>Trạng thái</SortableTableHead>
                  <SortableTableHead sortKey="createdAt" currentSort={sort} onSort={handleSort}>Ngày tạo</SortableTableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>))}</TableRow>
                  ))
                ) : sorted.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="h-32 text-center text-muted-foreground">Không tìm thấy tranh chấp nào.</TableCell></TableRow>
                ) : (
                  sorted.map((d, idx) => (
                    <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/admin/dashboard/disputes/${d.id}`)}>
                      <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(pg - 1) * ps + idx + 1}</TableCell>
                      <TableCell><span className="font-mono text-sm font-medium">{d.id.slice(0, 8)}...</span></TableCell>
                      <TableCell className="text-sm">{d.customerName}</TableCell>
                      <TableCell className="text-sm">{d.shopName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{DisputeTypeLabels[d.type] ?? d.typeName}</Badge></TableCell>
                      <TableCell className="font-medium tabular-nums">{formatPriceVND(d.requestedAmount)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${DisputeStatusColors[d.status] ?? ""}`}>
                          {DisputeStatusLabels[d.status] ?? d.statusName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm tabular-nums">{formatDateTimeVN(d.createdAt)}</TableCell>
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

          {!loading && (
            <TablePagination
              currentPage={pg}
              totalPages={tp}
              totalItems={totalCount}
              onPageChange={setPg}
              itemLabel="tranh chấp"
            />
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
