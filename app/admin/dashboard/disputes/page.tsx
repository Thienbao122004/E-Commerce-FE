"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconRefresh, IconCheck, IconX, IconScale, IconEye,
} from "@tabler/icons-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { fetchDisputes, approveRefund, rejectDispute } from "@/services/disputes"
import {
  DisputeStatus, DisputeStatusLabels, DisputeStatusColors,
  DisputeType, DisputeTypeLabels,
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

export default function DisputesPage() {
  const router = useRouter()
  const [disputes, setDisputes] = React.useState<AdminDispute[]>([])
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
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) { setLoading(false); return }
    try {
      const res = await fetchDisputes(token, pg, ps, null, null)
      if (res.success) { setDisputes(res.disputes); setTotalCount(res.totalCount) }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Lỗi") }
    finally { setLoading(false) }
  }, [pg])

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

  const tableFilters = React.useMemo(() => [
    { key: "status", value: statusFilter, match: (r: Record<string, unknown>) => r.status },
    { key: "type", value: typeFilter, match: (r: Record<string, unknown>) => r.type },
  ], [statusFilter, typeFilter])

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
