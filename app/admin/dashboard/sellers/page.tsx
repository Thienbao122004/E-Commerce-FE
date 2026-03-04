"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  IconSearch, IconChevronLeft, IconChevronRight, IconRefresh,
  IconCheck, IconX, IconPlayerPlay, IconPlayerPause, IconDoorExit,
  IconFilter, IconBuildingStore, IconEye, IconFileText,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { SellerDetailView } from "./_components/seller-detail-view"

const fmtDate = (t: string | null) =>
  t ? new Date(t).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"

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
  const [vStatus, setVStatus] = React.useState<number | null>(null)
  const ps = 10
  const tp = Math.ceil(total / ps)

  const [selectedShop, setSelectedShop] = React.useState<ShopVerification | null>(null)
  const [detailLoading, setDetailLoading] = React.useState(false)

  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null)
  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => { setSearch(val); setPg(1) }, 400)
  }

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

  const load = React.useCallback(async () => {
    setLoading(true)
    const tk = await getToken()
    if (!tk) { setLoading(false); return }
    try {
      const r = await fetchSellers(tk, pg, ps, vStatus)
      if (r.success) { setSellers(r.shops); setTotal(r.totalCount) }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }, [pg, vStatus])

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

  const filtered = React.useMemo(() => {
    if (!search) return sellers
    const q = search.toLowerCase()
    return sellers.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      s.ownerName?.toLowerCase().includes(q) ||
      s.ownerEmail?.toLowerCase().includes(q)
    )
  }, [sellers, search])

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
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <IconBuildingStore className="size-7" />Quản lý người bán
              </h1>
              <p className="text-muted-foreground text-sm">{loading ? "Đang tải..." : `${total} cửa hàng`}</p>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <IconRefresh className="mr-1.5 size-4" />Làm mới
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input placeholder="Tìm tên shop, chủ shop, email..." value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} className="pl-9 bg-background" />
            </div>
            <div className="flex items-center gap-2">
              <IconFilter className="size-4 text-muted-foreground" />
              <Select value={vStatus === null ? "all" : String(vStatus)} onValueChange={(v) => { setVStatus(v === "all" ? null : Number(v)); setPg(1) }}>
                <SelectTrigger className="w-[160px] bg-background"><SelectValue placeholder="Trạng thái xác minh" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value={String(VerificationStatus.Pending)}>Chờ duyệt</SelectItem>
                  <SelectItem value={String(VerificationStatus.Verified)}>Đã duyệt</SelectItem>
                  <SelectItem value={String(VerificationStatus.Rejected)}>Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>Cửa hàng</TableHead>
                  <TableHead>Chủ shop</TableHead>
                  <TableHead>Hồ sơ</TableHead>
                  <TableHead>Xác minh</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>))}</TableRow>
                )) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Không có cửa hàng nào.</TableCell></TableRow>
                ) : filtered.map((s, idx) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewDetail(s)}>
                    <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(pg - 1) * ps + idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {s.logoUrl ? (
                          <img src={s.logoUrl} alt={s.name} className="size-8 rounded-md object-cover border" />
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
                    <TableCell className="text-muted-foreground text-sm tabular-nums">{fmtDate(s.createdAt)}</TableCell>
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

          {!loading && tp > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Trang {pg} / {tp} · {total} cửa hàng</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="size-8" onClick={() => setPg(pg - 1)} disabled={pg <= 1}><IconChevronLeft className="size-4" /></Button>
                <Button variant="outline" size="icon" className="size-8" onClick={() => setPg(pg + 1)} disabled={pg >= tp}><IconChevronRight className="size-4" /></Button>
              </div>
            </div>
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
