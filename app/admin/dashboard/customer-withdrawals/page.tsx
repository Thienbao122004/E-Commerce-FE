"use client"

import * as React from "react"
import { IconRefresh, IconCheck, IconX } from "@tabler/icons-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  fetchCustomerWithdrawals,
  approveCustomerWithdrawal,
  rejectCustomerWithdrawal,
} from "@/services/customer-withdrawals-admin"
import type { CustomerWithdrawalRequestDto } from "@/types/customer-wallet"

const CustomerWithdrawalDialogs = dynamic(() =>
  import("./_components/withdrawal-dialogs").then((m) => m.CustomerWithdrawalDialogs)
)

import FilterBar from "@/components/common/filter-bar"
import type { FilterConfig } from "@/components/common/filter-bar"
import TablePagination from "@/components/common/table-pagination"
import { SortableTableHead, getNextSort } from "@/components/common/table-sorting"
import type { SortConfig } from "@/components/common/table-sorting"
import { useDebounce } from "@/hooks/use-debounce"
import { useTableData } from "@/hooks/use-table-data"
import { SetHeaderActions } from "@/hooks/use-header-actions"
import { formatCurrencyVN as fmtMoney, formatDateTimeVN } from "@/lib/formatters"

const STATUS_LABELS: Record<number, string> = {
  0: "Chờ xử lý",
  1: "Đã duyệt",
  2: "Từ chối",
  3: "Đã thanh toán",
}

const STATUS_COLORS: Record<number, string> = {
  0: "bg-yellow-100 text-yellow-700 border-yellow-200",
  1: "bg-blue-100 text-blue-700 border-blue-200",
  2: "bg-red-100 text-red-700 border-red-200",
  3: "bg-green-100 text-green-700 border-green-200",
}

type DialogType = "approve" | "reject" | null

export default function CustomerWithdrawalsPage() {
  const [requests, setRequests] = React.useState<CustomerWithdrawalRequestDto[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [pg, setPg] = React.useState(1)
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [searchInput, setSearchInput] = React.useState("")
  const debouncedSearch = useDebounce(searchInput)
  const [sort, setSort] = React.useState<SortConfig | null>(null)
  const ps = 10
  const tp = Math.ceil(total / ps)

  const [dialogType, setDialogType] = React.useState<DialogType>(null)
  const [target, setTarget] = React.useState<CustomerWithdrawalRequestDto | null>(null)

  const openDialog = (type: DialogType, req: CustomerWithdrawalRequestDto) => {
    setDialogType(type)
    setTarget(req)
  }
  const closeDialog = () => { setDialogType(null); setTarget(null) }

  React.useEffect(() => { setPg(1) }, [debouncedSearch])

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetchCustomerWithdrawals(pg, ps, null)
      if (r.success) { setRequests(r.requests); setTotal(r.totalCount) }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setLoading(false)
    }
  }, [pg])

  React.useEffect(() => { load() }, [load])

  const handleApprove = async (adminNote: string) => {
    if (!target) return
    setBusy(true)
    try {
      const r = await approveCustomerWithdrawal(target.id, adminNote || undefined)
      if (r.success) { toast.success(r.message ?? "Đã duyệt"); closeDialog(); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setBusy(false)
    }
  }

  const handleReject = async (reason: string, adminNote: string) => {
    if (!target || !reason) return
    setBusy(true)
    try {
      const r = await rejectCustomerWithdrawal(target.id, reason, adminNote || undefined)
      if (r.success) { toast.success(r.message ?? "Đã từ chối"); closeDialog(); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setBusy(false)
    }
  }

  const sortAccessor = React.useCallback((row: CustomerWithdrawalRequestDto, key: string): string | number => {
    switch (key) {
      case "customerName": return row.customerName ?? ""
      case "amount": return row.amount
      case "bankName": return row.bankName ?? ""
      case "status": return row.status
      case "requestedAt": return row.requestedAt ?? ""
      case "reviewedAt": return row.reviewedAt ?? ""
      default: return ""
    }
  }, [])

  const tableFilters = React.useMemo(() => [
    { key: "status", value: statusFilter, match: (r: CustomerWithdrawalRequestDto) => r.status },
  ], [statusFilter])

  const { filtered: sorted } = useTableData<CustomerWithdrawalRequestDto>({
    data: requests,
    search: debouncedSearch,
    searchKeys: ["customerName", "bankAccountName", "bankAccountNumber"],
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
        { value: "0", label: "Chờ xử lý" },
        { value: "1", label: "Đã duyệt" },
        { value: "2", label: "Từ chối" },
        { value: "3", label: "Đã thanh toán" },
      ],
    },
  ], [statusFilter])

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
            searchPlaceholder="Tìm khách hàng, tên TK, số TK..."
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
                  <SortableTableHead sortKey="customerName" currentSort={sort} onSort={handleSort}>Khách hàng</SortableTableHead>
                  <SortableTableHead sortKey="amount" currentSort={sort} onSort={handleSort}>Số tiền rút</SortableTableHead>
                  <TableHead>Số dư ví</TableHead>
                  <SortableTableHead sortKey="bankName" currentSort={sort} onSort={handleSort}>Ngân hàng</SortableTableHead>
                  <TableHead>Số TK</TableHead>
                  <TableHead>Chủ TK</TableHead>
                  <SortableTableHead sortKey="status" currentSort={sort} onSort={handleSort}>Trạng thái</SortableTableHead>
                  <SortableTableHead sortKey="requestedAt" currentSort={sort} onSort={handleSort}>Ngày yêu cầu</SortableTableHead>
                  <SortableTableHead sortKey="reviewedAt" currentSort={sort} onSort={handleSort}>Ngày duyệt</SortableTableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                      Không có yêu cầu rút tiền nào.
                    </TableCell>
                  </TableRow>
                ) : sorted.map((r, idx) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-center text-sm text-muted-foreground tabular-nums">
                      {(pg - 1) * ps + idx + 1}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{r.customerName ?? "—"}</TableCell>
                    <TableCell className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {fmtMoney(r.amount)}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {r.availableBalance != null
                        ? <span className="font-medium text-blue-600 dark:text-blue-400">{fmtMoney(r.availableBalance)}</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell className="text-sm">{r.bankName}</TableCell>
                    <TableCell className="text-sm font-mono">{r.bankAccountNumber}</TableCell>
                    <TableCell className="text-sm">{r.bankAccountName}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_COLORS[r.status] ?? ""}`}
                      >
                        {STATUS_LABELS[r.status] ?? r.statusName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">
                      {formatDateTimeVN(r.requestedAt, "—")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">
                      {formatDateTimeVN(r.reviewedAt, "—")}
                    </TableCell>
                    <TableCell>
                      {r.status === 0 && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 shadow-sm text-xs text-green-700 bg-green-50/50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-900"
                            onClick={() => openDialog("approve", r)}
                            disabled={busy}
                          >
                            <IconCheck className="mr-1.5 size-3.5" />Duyệt
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 shadow-sm text-xs text-red-700 bg-red-50/50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-900"
                            onClick={() => openDialog("reject", r)}
                            disabled={busy}
                          >
                            <IconX className="mr-1.5 size-3.5" />Từ chối
                          </Button>
                        </div>
                      )}
                      {r.status === 2 && (
                        <div className="flex flex-col items-end gap-1.5">
                          {r.rejectionReason && (
                            <div className="flex items-center gap-1.5 max-w-[160px] truncate rounded-full bg-red-50 px-2.5 py-1 w-fit border border-red-100 dark:bg-red-950/30 dark:border-red-900/50" title={r.rejectionReason}>
                              <IconX className="size-3.5 shrink-0 text-red-500" />
                              <span className="text-[11px] font-medium text-red-600 dark:text-red-400 truncate">{r.rejectionReason}</span>
                            </div>
                          )}
                          {r.adminNote && (
                            <span className="text-[11px] text-muted-foreground italic max-w-[160px] truncate" title={r.adminNote}>
                              {r.adminNote}
                            </span>
                          )}
                        </div>
                      )}
                      {(r.status === 1 || r.status === 3) && r.adminNote && (
                        <div className="flex justify-end">
                          <div className="flex items-center gap-1.5 max-w-[160px] truncate rounded-full bg-green-50 px-2.5 py-1 w-fit border border-green-100 dark:bg-green-950/30 dark:border-green-900/50" title={r.adminNote}>
                            <IconCheck className="size-3.5 shrink-0 text-green-500" />
                            <span className="text-[11px] font-medium text-green-700 dark:text-green-400 truncate">{r.adminNote}</span>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!loading && (
            <TablePagination
              currentPage={pg}
              totalPages={tp}
              totalItems={total}
              onPageChange={setPg}
              itemLabel="yêu cầu"
            />
          )}
        </div>
      </div>

      <CustomerWithdrawalDialogs
        dialogType={dialogType}
        target={target}
        busy={busy}
        onClose={closeDialog}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  )
}
