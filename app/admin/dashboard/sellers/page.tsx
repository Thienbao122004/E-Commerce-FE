"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  IconRefresh,
  IconCheck, IconX, IconPlayerPlay, IconPlayerPause, IconDoorExit,
  IconBuildingStore, IconEye, IconFileText,
} from "@tabler/icons-react"
import { toast } from "sonner"
import Image from "next/image"
import dynamic from "next/dynamic"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { fetchSellers, fetchSellerById, approveSeller, rejectSeller, activateSeller, suspendSeller, closeSeller } from "@/services/sellers"
import {
  VerificationStatus, VerificationStatusLabels, VerificationStatusColors,
  ShopStatus, ShopStatusLabels, ShopStatusColors,
} from "@/types/seller"
import type { ShopVerification } from "@/types/seller"
const SellerDetailView = dynamic(() => import("./_components/seller-detail-view").then(m => m.SellerDetailView), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" /></div>,
})
import FilterBar from "@/components/common/filter-bar"
import type { FilterConfig } from "@/components/common/filter-bar"
import TablePagination from "@/components/common/table-pagination"
import { SortableTableHead, getNextSort } from "@/components/common/table-sorting"
import { useDebounce } from "@/hooks/use-debounce"
import { useTableData } from "@/hooks/use-table-data"
import type { SortConfig } from "@/components/common/table-sorting"
import { SetHeaderActions } from "@/hooks/use-header-actions"
import { formatDateTimeVN } from "@/lib/formatters"

type DialogType = "approve" | "reject" | "suspend" | "close" | null

export default function SellersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shopIdFromUrl = searchParams.get("id")

  const [sellers, setSellers] = React.useState<ShopVerification[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [pg, setPg] = React.useState(1)
  const [vStatus, setVStatus] = React.useState("all")
  const [searchInput, setSearchInput] = React.useState("")
  const debouncedSearch = useDebounce(searchInput)
  const [sort, setSort] = React.useState<SortConfig | null>(null)
  const ps = 10
  const tp = Math.ceil(total / ps)

  const [selectedShop, setSelectedShop] = React.useState<ShopVerification | null>(null)
  const [detailLoading, setDetailLoading] = React.useState(false)

  const [dialogType, setDialogType] = React.useState<DialogType>(null)
  const [target, setTarget] = React.useState<ShopVerification | null>(null)
  const [reason, setReason] = React.useState("")
  const [note, setNote] = React.useState("")

  const openDialog = (type: DialogType, shop: ShopVerification) => { setDialogType(type); setTarget(shop); setReason(""); setNote("") }
  const closeDialog = () => { setDialogType(null); setTarget(null); setReason(""); setNote("") }

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  React.useEffect(() => { setPg(1) }, [debouncedSearch])

  const load = React.useCallback(async () => {
    setLoading(true)
    const tk = await getToken()
    if (!tk) { setLoading(false); return }
    try {
      const r = await fetchSellers(tk, pg, ps, null)
      if (r.success) { setSellers(r.shops); setTotal(r.totalCount) }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }, [pg])

  React.useEffect(() => { load() }, [load])

  const loadShopById = React.useCallback(async (id: string) => {
    setDetailLoading(true)
    const tk = await getToken()
    if (!tk) { setDetailLoading(false); return }
    try {
      const r = await fetchSellerById(tk, id)
      if (r.success && r.shop) setSelectedShop(r.shop)
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi tải chi tiết") }
    finally { setDetailLoading(false) }
  }, [])

  React.useEffect(() => {
    if (shopIdFromUrl) {
      loadShopById(shopIdFromUrl)
    } else {
      setSelectedShop(null)
    }
  }, [shopIdFromUrl, loadShopById])

  const viewDetail = (shop: ShopVerification) => {
    setSelectedShop(shop)
    router.push(`/admin/dashboard/sellers?id=${shop.id}`, { scroll: false })
    loadShopById(shop.id)
  }

  const goBack = () => {
    setSelectedShop(null)
    router.push("/admin/dashboard/sellers", { scroll: false })
  }

  const handleApproveAction = async (shopId: string, noteVal?: string) => {
    setBusy(true)
    const tk = await getToken()
    if (!tk) { setBusy(false); return }
    try {
      const r = await approveSeller(tk, shopId, noteVal)
      if (r.success) { toast.success(r.message ?? "Đã duyệt"); if (selectedShop?.id === shopId && r.shop) setSelectedShop(r.shop); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const handleRejectAction = async (shopId: string, reasonVal: string) => {
    setBusy(true)
    const tk = await getToken()
    if (!tk) { setBusy(false); return }
    try {
      const r = await rejectSeller(tk, shopId, reasonVal)
      if (r.success) { toast.success(r.message ?? "Đã từ chối"); if (selectedShop?.id === shopId && r.shop) setSelectedShop(r.shop); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const handleActivateAction = async (shop: ShopVerification) => {
    setBusy(true)
    const tk = await getToken()
    if (!tk) { setBusy(false); return }
    try {
      const r = await activateSeller(tk, shop.id)
      if (r.success) { toast.success(r.message ?? "Đã kích hoạt"); if (selectedShop?.id === shop.id && r.shop) setSelectedShop(r.shop); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const handleSuspendAction = async (shopId: string, reasonVal: string) => {
    setBusy(true)
    const tk = await getToken()
    if (!tk) { setBusy(false); return }
    try {
      const r = await suspendSeller(tk, shopId, reasonVal)
      if (r.success) { toast.success(r.message ?? "Đã đình chỉ"); if (selectedShop?.id === shopId && r.shop) setSelectedShop(r.shop); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const handleCloseAction = async (shopId: string, reasonVal: string) => {
    setBusy(true)
    const tk = await getToken()
    if (!tk) { setBusy(false); return }
    try {
      const r = await closeSeller(tk, shopId, reasonVal)
      if (r.success) { toast.success(r.message ?? "Đã đóng cửa"); if (selectedShop?.id === shopId && r.shop) setSelectedShop(r.shop); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const handleListDialogAction = async () => {
    if (!target) return
    if (dialogType === "approve") await handleApproveAction(target.id, note || undefined)
    else if (dialogType === "reject" && reason) await handleRejectAction(target.id, reason)
    else if (dialogType === "suspend" && reason) await handleSuspendAction(target.id, reason)
    else if (dialogType === "close" && reason) await handleCloseAction(target.id, reason)
    closeDialog()
  }

  const sortAccessor = React.useCallback((row: ShopVerification, key: string): string | number => {
    switch (key) {
      case "name": return row.name ?? ""
      case "ownerName": return row.ownerName ?? ""
      case "verificationStatus": return row.verificationStatus
      case "status": return row.status
      case "createdAt": return row.createdAt ?? ""
      default: return ""
    }
  }, [])

  const tableFilters = React.useMemo(() => [
    { key: "vStatus", value: vStatus, match: (r: Record<string, unknown>) => r.verificationStatus },
  ], [vStatus])

  const { filtered: sorted } = useTableData<ShopVerification>({
    data: sellers,
    search: debouncedSearch,
    searchKeys: ["name", "ownerName", "ownerEmail"],
    filters: tableFilters,
    sort,
    sortAccessor,
  })

  const handleSort = (key: string) => setSort(getNextSort(sort, key))

  const filters: FilterConfig[] = React.useMemo(() => [
    {
      key: "vStatus",
      label: "Xác minh",
      value: vStatus,
      onChange: (v: string) => { setVStatus(v); setPg(1) },
      width: "w-[160px]",
      options: [
        { value: "all", label: "Tất cả" },
        { value: String(VerificationStatus.Pending), label: "Chờ duyệt" },
        { value: String(VerificationStatus.Verified), label: "Đã duyệt" },
        { value: String(VerificationStatus.Rejected), label: "Từ chối" },
      ],
    },
  ], [vStatus])

  const renderListActions = (shop: ShopVerification) => {
    const isPending = shop.verificationStatus === VerificationStatus.Pending
    const isVerified = shop.verificationStatus === VerificationStatus.Verified
    const isActive = shop.status === ShopStatus.Active
    const isSuspended = shop.status === ShopStatus.Suspended

    return (
      <div className="flex items-center gap-1 justify-end">
        {isPending && (
          <>
            <Button variant="outline" size="sm" className="h-8 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => openDialog("approve", shop)} disabled={busy}>
              <IconCheck className="mr-1 size-3.5" />Duyệt
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => openDialog("reject", shop)} disabled={busy}>
              <IconX className="mr-1 size-3.5" />Từ chối
            </Button>
          </>
        )}
        {isVerified && isActive && (
          <>
            <Button variant="outline" size="sm" className="h-8 text-xs text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20" onClick={() => openDialog("suspend", shop)} disabled={busy}>
              <IconPlayerPause className="mr-1 size-3.5" />Đình chỉ
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/20" onClick={() => openDialog("close", shop)} disabled={busy}>
              <IconDoorExit className="mr-1 size-3.5" />Đóng cửa
            </Button>
          </>
        )}
        {isVerified && isSuspended && (
          <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/20" onClick={() => openDialog("close", shop)} disabled={busy}>
            <IconDoorExit className="mr-1 size-3.5" />Đóng cửa
          </Button>
        )}
        {isSuspended && (
          <Button variant="outline" size="sm" className="h-8 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => handleActivateAction(shop)} disabled={busy}>
            <IconPlayerPlay className="mr-1 size-3.5" />Kích hoạt
          </Button>
        )}
      </div>
    )
  }

  const dialogConfig: Record<string, { title: string; desc: string; needReason: boolean; needNote: boolean; btnLabel: string; btnClass: string }> = {
    approve: { title: "Duyệt cửa hàng", desc: `Xác nhận duyệt shop "${target?.name}"?`, needReason: false, needNote: true, btnLabel: "Duyệt", btnClass: "bg-green-600 hover:bg-green-700 text-white" },
    reject: { title: "Từ chối cửa hàng", desc: `Từ chối đăng ký shop "${target?.name}"?`, needReason: true, needNote: false, btnLabel: "Từ chối", btnClass: "" },
    suspend: { title: "Đình chỉ cửa hàng", desc: `Đình chỉ hoạt động shop "${target?.name}"?`, needReason: true, needNote: false, btnLabel: "Đình chỉ", btnClass: "" },
    close: { title: "Đóng cửa hàng", desc: `Đóng vĩnh viễn shop "${target?.name}"? Không thể hoàn tác.`, needReason: true, needNote: false, btnLabel: "Đóng cửa hàng", btnClass: "" },
  }
  const cfg = dialogType ? dialogConfig[dialogType] : null

  if (selectedShop) {
    return (
      <SellerDetailView
        shop={selectedShop}
        detailLoading={detailLoading}
        busy={busy}
        onBack={goBack}
        onApprove={handleApproveAction}
        onReject={handleRejectAction}
        onActivate={handleActivateAction}
        onSuspend={handleSuspendAction}
        onClose={handleCloseAction}
      />
    )
  }

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
            searchPlaceholder="Tìm tên shop, chủ shop, email..."
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
                  <SortableTableHead sortKey="name" currentSort={sort} onSort={handleSort}>Cửa hàng</SortableTableHead>
                  <SortableTableHead sortKey="ownerName" currentSort={sort} onSort={handleSort}>Chủ shop</SortableTableHead>
                  <TableHead>Hồ sơ</TableHead>
                  <SortableTableHead sortKey="verificationStatus" currentSort={sort} onSort={handleSort}>Xác minh</SortableTableHead>
                  <SortableTableHead sortKey="status" currentSort={sort} onSort={handleSort}>Trạng thái</SortableTableHead>
                  <SortableTableHead sortKey="createdAt" currentSort={sort} onSort={handleSort}>Ngày tạo</SortableTableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>))}</TableRow>
                )) : sorted.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Không có cửa hàng nào.</TableCell></TableRow>
                ) : sorted.map((s, idx) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewDetail(s)}>
                    <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(pg - 1) * ps + idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {s.logoUrl ? (
                          <Image src={s.logoUrl} alt={s.name} width={32} height={32} className="size-8 rounded-md object-cover border" />
                        ) : (
                          <div className="size-8 rounded-md bg-muted flex items-center justify-center">
                            <IconBuildingStore className="size-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-medium">{s.name}</span>
                          {s.slug && <p className="text-xs text-muted-foreground">/{s.slug}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="text-sm">{s.ownerName ?? "—"}</span>
                        {s.ownerEmail && <p className="text-xs text-muted-foreground">{s.ownerEmail}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconFileText className="size-4 text-muted-foreground" />
                        <span className="text-sm">{s.documents?.length ?? 0} tài liệu</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${VerificationStatusColors[s.verificationStatus] ?? ""}`}>
                        {VerificationStatusLabels[s.verificationStatus] ?? s.verificationStatusName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${ShopStatusColors[s.status] ?? ""}`}>
                        {ShopStatusLabels[s.status] ?? s.statusName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">{formatDateTimeVN(s.createdAt, "—")}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => viewDetail(s)}>
                          <IconEye className="size-4" />
                        </Button>
                        {renderListActions(s)}
                      </div>
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
              itemLabel="cửa hàng"
            />
          )}
        </div>
      </div>

      <Dialog open={dialogType !== null} onOpenChange={(v) => { if (!v) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{cfg?.title}</DialogTitle>
            <DialogDescription>{cfg?.desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {cfg?.needReason && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Lý do *</label>
                <Textarea placeholder="Nhập lý do..." value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[60px]" />
              </div>
            )}
            {cfg?.needNote && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Ghi chú (tùy chọn)</label>
                <Textarea placeholder="Ghi chú..." value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px]" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={busy}>Hủy</Button>
            <Button
              variant={dialogType === "approve" ? "default" : "destructive"}
              className={cfg?.btnClass}
              onClick={handleListDialogAction}
              disabled={busy || (cfg?.needReason && !reason)}
            >
              {busy ? "Đang xử lý..." : cfg?.btnLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
