"use client"

import * as React from "react"
import {
  IconRefresh, IconEye, IconMessageCircle, IconExternalLink,
} from "@tabler/icons-react"
import Link from "next/link"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { fetchSellerDisputes, respondToSellerDispute } from "@/services/disputes"
import { EvidenceUploader } from "@/components/common/evidence-uploader"
import {
  DisputeStatus, DisputeStatusLabels, DisputeStatusColors,
  DisputeType, DisputeTypeLabels,
} from "@/types/dispute"
import type { SellerDispute } from "@/types/dispute"

import FilterBar from "@/components/common/filter-bar"
import type { FilterConfig } from "@/components/common/filter-bar"
import TablePagination from "@/components/common/table-pagination"
import { SortableTableHead, getNextSort } from "@/components/common/table-sorting"
import type { SortConfig } from "@/components/common/table-sorting"
import { useDebounce } from "@/hooks/use-debounce"
import { useTableData } from "@/hooks/use-table-data"
import { SetHeaderActions } from "@/hooks/use-header-actions"
import { formatDateTimeVN as formatDate, formatPriceVND as currency } from "@/lib/formatters"

export default function SellerDisputesPage() {
  const [disputes, setDisputes] = React.useState<SellerDispute[]>([])
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

  // Detail / respond dialog
  const [selectedDispute, setSelectedDispute] = React.useState<SellerDispute | null>(null)
  const [respondText, setRespondText] = React.useState("")
  const [respondEvidenceUrls, setRespondEvidenceUrls] = React.useState<string[]>([])

  React.useEffect(() => { setPg(1) }, [debouncedSearch])

  const load = React.useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) { setLoading(false); return }
    try {
      const res = await fetchSellerDisputes(token, pg, ps)
      if (res.success) { setDisputes(res.disputes); setTotalCount(res.totalCount) }
      else toast.error(res.message ?? "Lỗi tải dữ liệu")
    } catch (err) { toast.error(err instanceof Error ? err.message : "Lỗi") }
    finally { setLoading(false) }
  }, [pg])

  React.useEffect(() => { load() }, [load])

  const openRespond = (d: SellerDispute) => {
    setSelectedDispute(d)
    setRespondText(d.sellerResponse ?? "")
    setRespondEvidenceUrls(d.sellerEvidenceUrls ?? [])
  }

  const handleRespond = async () => {
    if (!selectedDispute || !respondText.trim()) return
    setActionLoading(true)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) { setActionLoading(false); return }
    try {
      const res = await respondToSellerDispute(
        token, selectedDispute.id, respondText.trim(),
        respondEvidenceUrls.length > 0 ? respondEvidenceUrls : undefined
      )
      if (res.success) {
        toast.success("Đã gửi phản hồi thành công")
        setSelectedDispute(null)
        load()
      } else {
        toast.error(res.message ?? "Lỗi gửi phản hồi")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi")
    } finally {
      setActionLoading(false)
    }
  }

  const sortAccessor = React.useCallback((row: SellerDispute, key: string): string | number => {
    switch (key) {
      case "customerName": return row.customerName ?? ""
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

  const { filtered: sorted } = useTableData<SellerDispute>({
    data: disputes,
    search: debouncedSearch,
    searchKeys: ["customerName", "title", "id"],
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
        { value: String(DisputeStatus.WaitingSeller), label: "Chờ phản hồi" },
        { value: String(DisputeStatus.WaitingCustomer), label: "Chờ khách" },
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
            searchPlaceholder="Tìm khách hàng, tiêu đề, mã tranh chấp..."
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
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Không tìm thấy tranh chấp nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((d, idx) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-center text-sm text-muted-foreground tabular-nums">
                        {(pg - 1) * ps + idx + 1}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-medium">{d.id.slice(0, 8)}...</span>
                      </TableCell>
                      <TableCell className="text-sm">{d.customerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {DisputeTypeLabels[d.type] ?? d.typeName}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">{currency(d.requestedAmount)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${DisputeStatusColors[d.status] ?? ""}`}>
                          {DisputeStatusLabels[d.status] ?? d.statusName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm tabular-nums">
                        {formatDate(d.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {d.canRespond && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => openRespond(d)}
                              disabled={actionLoading}
                            >
                              <IconMessageCircle className="mr-1 size-3.5" />
                              {d.sellerResponse ? "Sửa phản hồi" : "Phản hồi"}
                            </Button>
                          )}
                          <Link href={`/seller/disputes/${d.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title="Xem chi tiết"
                            >
                              <IconExternalLink className="size-4" />
                            </Button>
                          </Link>
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

      {/* Respond Dialog */}
      <Dialog open={selectedDispute !== null} onOpenChange={(v) => { if (!v) setSelectedDispute(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDispute?.canRespond ? "Phản hồi tranh chấp" : "Phản hồi đã gửi"}
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium">{selectedDispute?.title}</span>
              {" · "}Khách: {selectedDispute?.customerName}
              <br />
              <span className="text-xs">
                Lý do: {selectedDispute?.reason}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nội dung phản hồi *</label>
              <Textarea
                placeholder="Nhập phản hồi của bạn..."
                value={respondText}
                onChange={(e) => setRespondText(e.target.value)}
                className="min-h-[100px]"
                disabled={!selectedDispute?.canRespond || actionLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">{respondText.length}/2000 ký tự</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Bằng chứng đính kèm
                <span className="ml-1.5 text-xs text-muted-foreground font-normal">ảnh / video, tối đa 10</span>
              </label>
              <EvidenceUploader
                urls={respondEvidenceUrls}
                onChange={setRespondEvidenceUrls}
                disabled={!selectedDispute?.canRespond || actionLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDispute(null)} disabled={actionLoading}>
              Đóng
            </Button>
            {selectedDispute?.canRespond && (
              <Button
                onClick={handleRespond}
                disabled={actionLoading || respondText.trim().length < 10}
              >
                {actionLoading ? "Đang gửi..." : "Gửi phản hồi"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
