"use client"

import * as React from "react"
import {
  IconSearch, IconChevronLeft, IconChevronRight, IconRefresh,
  IconCheck, IconX, IconPlayerPlay, IconPlayerPause, IconDoorExit,
  IconFilter, IconBuildingStore, IconEye, IconFileText, IconPhoto,
  IconCreditCard, IconArrowLeft, IconExternalLink,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { fetchSellers, fetchSellerById, approveSeller, rejectSeller, activateSeller, suspendSeller, closeSeller } from "@/lib/api/sellers"
import {
  VerificationStatus, VerificationStatusLabels, VerificationStatusColors,
  ShopStatus, ShopStatusLabels, ShopStatusColors,
} from "@/lib/types/seller"
import type { ShopVerification, ShopDocument } from "@/lib/types/seller"

const fmtDate = (t: string | null) =>
  t ? new Date(t).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"

const DocStatusColors: Record<number, string> = {
  0: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  1: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  2: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

const DocStatusLabels: Record<number, string> = {
  0: "Chờ duyệt",
  1: "Đã duyệt",
  2: "Từ chối",
}

const DocTypeLabels: Record<string, string> = {
  cccd_front: "CCCD mặt trước",
  cccd_back: "CCCD mặt sau",
  business_license: "Giấy phép kinh doanh",
  bank_account: "Tài khoản ngân hàng",
  portrait: "Ảnh chân dung",
  other: "Tài liệu khác",
}

const DocTypeIcons: Record<string, React.ReactNode> = {
  cccd_front: <IconCreditCard className="size-4" />,
  cccd_back: <IconCreditCard className="size-4" />,
  business_license: <IconFileText className="size-4" />,
  bank_account: <IconCreditCard className="size-4" />,
  portrait: <IconPhoto className="size-4" />,
  other: <IconFileText className="size-4" />,
}

type DialogType = "approve" | "reject" | "suspend" | "close" | null

export default function SellersPage() {
  const [sellers, setSellers] = React.useState<ShopVerification[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [pg, setPg] = React.useState(1)
  const [vStatus, setVStatus] = React.useState<number | null>(null)
  const ps = 10
  const tp = Math.ceil(total / ps)

  // Detail view
  const [selectedShop, setSelectedShop] = React.useState<ShopVerification | null>(null)
  const [detailLoading, setDetailLoading] = React.useState(false)
  const [previewImg, setPreviewImg] = React.useState<string | null>(null)

  // Search
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null)
  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => { setSearch(val); setPg(1) }, 400)
  }

  // Dialogs
  const [dialogType, setDialogType] = React.useState<DialogType>(null)
  const [target, setTarget] = React.useState<ShopVerification | null>(null)
  const [reason, setReason] = React.useState("")
  const [note, setNote] = React.useState("")

  const openDialog = (type: DialogType, shop: ShopVerification) => {
    setDialogType(type)
    setTarget(shop)
    setReason("")
    setNote("")
  }
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

  const viewDetail = async (shop: ShopVerification) => {
    setDetailLoading(true)
    setSelectedShop(shop) 
    const tk = await getToken()
    if (!tk) { setDetailLoading(false); return }
    try {
      const r = await fetchSellerById(tk, shop.id)
      if (r.success && r.shop) setSelectedShop(r.shop)
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi tải chi tiết") }
    finally { setDetailLoading(false) }
  }

  const handleApprove = async () => {
    if (!target) return
    setBusy(true)
    const tk = await getToken()
    if (!tk) { setBusy(false); return }
    try {
      const r = await approveSeller(tk, target.id, note || undefined)
      if (r.success) { toast.success(r.message ?? "Đã duyệt"); closeDialog(); if (selectedShop?.id === target.id && r.shop) setSelectedShop(r.shop); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const handleReject = async () => {
    if (!target || !reason) return
    setBusy(true)
    const tk = await getToken()
    if (!tk) { setBusy(false); return }
    try {
      const r = await rejectSeller(tk, target.id, reason)
      if (r.success) { toast.success(r.message ?? "Đã từ chối"); closeDialog(); if (selectedShop?.id === target.id && r.shop) setSelectedShop(r.shop); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const handleActivate = async (shop: ShopVerification) => {
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

  const handleSuspend = async () => {
    if (!target || !reason) return
    setBusy(true)
    const tk = await getToken()
    if (!tk) { setBusy(false); return }
    try {
      const r = await suspendSeller(tk, target.id, reason)
      if (r.success) { toast.success(r.message ?? "Đã đình chỉ"); closeDialog(); if (selectedShop?.id === target.id && r.shop) setSelectedShop(r.shop); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const handleClose = async () => {
    if (!target || !reason) return
    setBusy(true)
    const tk = await getToken()
    if (!tk) { setBusy(false); return }
    try {
      const r = await closeSeller(tk, target.id, reason)
      if (r.success) { toast.success(r.message ?? "Đã đóng cửa"); closeDialog(); if (selectedShop?.id === target.id && r.shop) setSelectedShop(r.shop); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
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

  const renderActions = (shop: ShopVerification, compact = false) => {
    const isPending = shop.verificationStatus === VerificationStatus.Pending
    const isVerified = shop.verificationStatus === VerificationStatus.Verified
    const isActive = shop.status === ShopStatus.Active
    const isSuspended = shop.status === ShopStatus.Suspended

    return (
      <div className={`flex items-center gap-1 ${compact ? "flex-wrap" : "justify-end"}`}>
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
          <Button variant="outline" size="sm" className="h-8 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => handleActivate(shop)} disabled={busy}>
            <IconPlayerPlay className="mr-1 size-3.5" />Kích hoạt
          </Button>
        )}
      </div>
    )
  }

  const dialogConfig: Record<string, { title: string; desc: string; needReason: boolean; needNote: boolean; action: () => void; btnLabel: string; btnClass: string }> = {
    approve: {
      title: "Duyệt cửa hàng",
      desc: `Xác nhận duyệt shop "${target?.name}"? Các giấy tờ xác minh sẽ được chuyển sang trạng thái "Đã duyệt".`,
      needReason: false, needNote: true,
      action: handleApprove,
      btnLabel: "Duyệt", btnClass: "bg-green-600 hover:bg-green-700 text-white",
    },
    reject: {
      title: "Từ chối cửa hàng",
      desc: `Từ chối đăng ký shop "${target?.name}"?`,
      needReason: true, needNote: false,
      action: handleReject,
      btnLabel: "Từ chối", btnClass: "",
    },
    suspend: {
      title: "Đình chỉ cửa hàng",
      desc: `Đình chỉ hoạt động shop "${target?.name}"? Sản phẩm sẽ bị ẩn khỏi tìm kiếm. Nếu shop có đơn hàng đang xử lý, cần hoàn thành trước.`,
      needReason: true, needNote: false,
      action: handleSuspend,
      btnLabel: "Đình chỉ", btnClass: "",
    },
    close: {
      title: "Đóng cửa hàng",
      desc: `Đóng vĩnh viễn shop "${target?.name}"? Hành động này không thể hoàn tác. Nếu shop còn đơn hàng đang xử lý, hệ thống sẽ từ chối.`,
      needReason: true, needNote: false,
      action: handleClose,
      btnLabel: "Đóng cửa hàng", btnClass: "",
    },
  }

  const cfg = dialogType ? dialogConfig[dialogType] : null

  if (selectedShop) {
    return (
      <>
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {/* Back + Header */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="size-9" onClick={() => { setSelectedShop(null); setPreviewImg(null) }}>
                <IconArrowLeft className="size-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold tracking-tight">Chi tiết cửa hàng</h1>
                <p className="text-muted-foreground text-sm">
                  Xem thông tin và hồ sơ xác minh của shop
                </p>
              </div>
              {renderActions(selectedShop, true)}
            </div>

            {detailLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <Skeleton className="h-4 w-32 mb-3" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-40 mt-2" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border p-4 space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Thông tin cửa hàng</h3>
                    <div className="flex items-center gap-3">
                      {selectedShop.logoUrl ? (
                        <img src={selectedShop.logoUrl} alt={selectedShop.name} className="size-12 rounded-lg object-cover border" />
                      ) : (
                        <div className="size-12 rounded-lg bg-muted flex items-center justify-center">
                          <IconBuildingStore className="size-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{selectedShop.name}</p>
                        <p className="text-xs text-muted-foreground">/{selectedShop.slug}</p>
                      </div>
                    </div>
                    {selectedShop.description && (
                      <p className="text-sm text-muted-foreground">{selectedShop.description}</p>
                    )}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Ngày đăng ký: </span>
                      <span className="tabular-nums">{fmtDate(selectedShop.createdAt)}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Chủ cửa hàng</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Họ tên: </span>
                        <span className="font-medium">{selectedShop.ownerName ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email: </span>
                        <span className="font-medium">{selectedShop.ownerEmail ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ID: </span>
                        <span className="font-mono text-xs">{selectedShop.ownerId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Trạng thái</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Xác minh:</span>
                        <Badge variant="secondary" className={`text-xs ${VerificationStatusColors[selectedShop.verificationStatus] ?? ""}`}>
                          {VerificationStatusLabels[selectedShop.verificationStatus] ?? selectedShop.verificationStatusName}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Hoạt động:</span>
                        <Badge variant="secondary" className={`text-xs ${ShopStatusColors[selectedShop.status] ?? ""}`}>
                          {ShopStatusLabels[selectedShop.status] ?? selectedShop.statusName}
                        </Badge>
                      </div>
                      {selectedShop.rejectionReason && (
                        <div className="mt-2 rounded-md bg-red-50 dark:bg-red-900/20 p-2">
                          <p className="text-xs font-medium text-red-700 dark:text-red-300">Lý do từ chối:</p>
                          <p className="text-xs text-red-600 dark:text-red-400">{selectedShop.rejectionReason}</p>
                        </div>
                      )}
                      {selectedShop.verifiedByName && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Duyệt bởi: {selectedShop.verifiedByName} · {fmtDate(selectedShop.verifiedAt ?? null)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border">
                  <div className="border-b p-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <IconFileText className="size-5" />
                      Hồ sơ xác minh
                      <Badge variant="outline" className="ml-1">{selectedShop.documents?.length ?? 0} tài liệu</Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Các giấy tờ seller đã nộp để xác minh danh tính và cửa hàng
                    </p>
                  </div>

                  {(!selectedShop.documents || selectedShop.documents.length === 0) ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <IconFileText className="size-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Seller chưa nộp tài liệu nào</p>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedShop.documents.map((doc) => (
                          <DocumentCard
                            key={doc.id}
                            doc={doc}
                            onPreview={(url) => setPreviewImg(url)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <Dialog open={previewImg !== null} onOpenChange={(v) => { if (!v) setPreviewImg(null) }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Xem tài liệu</DialogTitle>
            </DialogHeader>
            {previewImg && (
              <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
                <img src={previewImg} alt="Document preview" className="max-w-full max-h-[65vh] object-contain rounded-lg" />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" size="sm" asChild>
                <a href={previewImg ?? "#"} target="_blank" rel="noreferrer">
                  <IconExternalLink className="mr-1.5 size-4" />Mở trong tab mới
                </a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                onClick={cfg?.action}
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
              <Input
                placeholder="Tìm tên shop, chủ shop, email..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <IconFilter className="size-4 text-muted-foreground" />
              <Select value={vStatus === null ? "all" : String(vStatus)} onValueChange={(v) => { setVStatus(v === "all" ? null : Number(v)); setPg(1) }}>
                <SelectTrigger className="w-[160px] bg-background">
                  <SelectValue placeholder="Trạng thái xác minh" />
                </SelectTrigger>
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
                        {renderActions(s)}
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
              onClick={cfg?.action}
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

function DocumentCard({ doc, onPreview }: { doc: ShopDocument; onPreview: (url: string) => void }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(doc.fileUrl)
  const label = DocTypeLabels[doc.docType] ?? doc.docType
  const icon = DocTypeIcons[doc.docType] ?? <IconFileText className="size-4" />

  return (
    <div className="rounded-lg border overflow-hidden group hover:shadow-md transition-shadow">
      {/* Thumbnail / Preview */}
      {isImage ? (
        <div
          className="relative h-40 bg-muted cursor-pointer overflow-hidden"
          onClick={() => onPreview(doc.fileUrl)}
        >
          <img
            src={doc.fileUrl}
            alt={label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <IconEye className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </div>
      ) : (
        <div
          className="relative h-40 bg-muted flex items-center justify-center cursor-pointer"
          onClick={() => window.open(doc.fileUrl, "_blank")}
        >
          <div className="text-center">
            <IconFileText className="size-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Xem tài liệu</p>
          </div>
        </div>
      )}

      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-sm font-medium truncate">{label}</span>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={`text-xs ${DocStatusColors[doc.status] ?? ""}`}>
            {DocStatusLabels[doc.status] ?? doc.statusName}
          </Badge>
          <span className="text-xs text-muted-foreground tabular-nums">
            {fmtDate(doc.submittedAt)}
          </span>
        </div>
        {doc.rejectionReason && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-1.5 rounded">
            {doc.rejectionReason}
          </p>
        )}
        {doc.reviewedByName && (
          <p className="text-xs text-muted-foreground">
            Duyệt bởi: {doc.reviewedByName} · {fmtDate(doc.reviewedAt ?? null)}
          </p>
        )}
      </div>
    </div>
  )
}
