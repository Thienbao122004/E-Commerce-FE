import * as React from "react"
import Image from "next/image"
import {
  IconCheck, IconX, IconPlayerPlay, IconPlayerPause, IconDoorExit,
  IconBuildingStore, IconFileText, IconExternalLink, IconArrowLeft,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  VerificationStatus, VerificationStatusLabels, VerificationStatusColors,
  ShopStatus, ShopStatusLabels, ShopStatusColors,
} from "@/types/seller"
import type { ShopVerification } from "@/types/seller"
import { formatDateTimeVN } from "@/lib/formatters"
import { DocumentCard } from "./document-card"

type DialogType = "approve" | "reject" | "suspend" | "close" | null

type Props = {
  shop: ShopVerification
  detailLoading: boolean
  busy: boolean
  onBack: () => void
  onApprove: (shopId: string, note?: string) => Promise<void>
  onReject: (shopId: string, reason: string) => Promise<void>
  onActivate: (shop: ShopVerification) => Promise<void>
  onSuspend: (shopId: string, reason: string) => Promise<void>
  onClose: (shopId: string, reason: string) => Promise<void>
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  individual: "Cá nhân",
  household: "Hộ kinh doanh",
  company: "Công ty",
}

export function SellerDetailView({
  shop, detailLoading, busy,
  onBack, onApprove, onReject, onActivate, onSuspend, onClose,
}: Props) {
  const [previewImg, setPreviewImg] = React.useState<string | null>(null)
  const [dialogType, setDialogType] = React.useState<DialogType>(null)
  const [reason, setReason] = React.useState("")
  const [note, setNote] = React.useState("")

  const businessType = React.useMemo(() => {
    const match = shop.description?.match(/Business\s*Type:\s*([A-Za-z_]+)/i)
    return match?.[1]?.toLowerCase() ?? null
  }, [shop.description])

  const businessTypeLabel = businessType
    ? (BUSINESS_TYPE_LABELS[businessType] ?? businessType)
    : null

  const displayDescription = React.useMemo(() => {
    if (!shop.description) return null

    return shop.description.replace(
      /Business\s*Type:\s*([A-Za-z_]+)/gi,
      (_, rawType: string) => {
        const normalized = rawType.toLowerCase()
        return `Loại hình kinh doanh: ${BUSINESS_TYPE_LABELS[normalized] ?? rawType}`
      }
    )
  }, [shop.description])

  const closeDialog = () => { setDialogType(null); setReason(""); setNote("") }

  const handleDialogAction = async () => {
    if (!dialogType) return
    if (dialogType === "approve") await onApprove(shop.id, note || undefined)
    else if (dialogType === "reject") await onReject(shop.id, reason)
    else if (dialogType === "suspend") await onSuspend(shop.id, reason)
    else if (dialogType === "close") await onClose(shop.id, reason)
    closeDialog()
  }

  const renderActions = () => {
    const isPending = shop.verificationStatus === VerificationStatus.Pending
    const isVerified = shop.verificationStatus === VerificationStatus.Verified
    const isActive = shop.status === ShopStatus.Active
    const isSuspended = shop.status === ShopStatus.Suspended

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {isPending && (
          <>
            <Button variant="outline" size="sm" className="h-8 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => { setDialogType("approve"); setReason(""); setNote("") }} disabled={busy}>
              <IconCheck className="mr-1 size-3.5" />Duyệt
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => { setDialogType("reject"); setReason(""); setNote("") }} disabled={busy}>
              <IconX className="mr-1 size-3.5" />Từ chối
            </Button>
          </>
        )}
        {isVerified && isActive && (
          <>
            <Button variant="outline" size="sm" className="h-8 text-xs text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20" onClick={() => { setDialogType("suspend"); setReason("") }} disabled={busy}>
              <IconPlayerPause className="mr-1 size-3.5" />Đình chỉ
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/20" onClick={() => { setDialogType("close"); setReason("") }} disabled={busy}>
              <IconDoorExit className="mr-1 size-3.5" />Đóng cửa
            </Button>
          </>
        )}
        {isVerified && isSuspended && (
          <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/20" onClick={() => { setDialogType("close"); setReason("") }} disabled={busy}>
            <IconDoorExit className="mr-1 size-3.5" />Đóng cửa
          </Button>
        )}
        {isSuspended && (
          <Button variant="outline" size="sm" className="h-8 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => onActivate(shop)} disabled={busy}>
            <IconPlayerPlay className="mr-1 size-3.5" />Kích hoạt
          </Button>
        )}
      </div>
    )
  }

  const dialogConfig: Record<string, { title: string; desc: string; needReason: boolean; needNote: boolean; btnLabel: string; btnClass: string }> = {
    approve: {
      title: "Duyệt cửa hàng",
      desc: `Xác nhận duyệt shop "${shop.name}"? Các giấy tờ xác minh sẽ được chuyển sang trạng thái "Đã duyệt".`,
      needReason: false, needNote: true,
      btnLabel: "Duyệt", btnClass: "bg-green-600 hover:bg-green-700 text-white",
    },
    reject: {
      title: "Từ chối cửa hàng",
      desc: `Từ chối đăng ký shop "${shop.name}"?`,
      needReason: true, needNote: false,
      btnLabel: "Từ chối", btnClass: "",
    },
    suspend: {
      title: "Đình chỉ cửa hàng",
      desc: `Đình chỉ hoạt động shop "${shop.name}"? Sản phẩm sẽ bị ẩn khỏi tìm kiếm.`,
      needReason: true, needNote: false,
      btnLabel: "Đình chỉ", btnClass: "",
    },
    close: {
      title: "Đóng cửa hàng",
      desc: `Đóng vĩnh viễn shop "${shop.name}"? Hành động này không thể hoàn tác.`,
      needReason: true, needNote: false,
      btnLabel: "Đóng cửa hàng", btnClass: "",
    },
  }

  const cfg = dialogType ? dialogConfig[dialogType] : null

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="size-9" onClick={() => { onBack(); setPreviewImg(null) }}>
              <IconArrowLeft className="size-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">Chi tiết cửa hàng</h1>
              <p className="text-muted-foreground text-sm">Xem thông tin và hồ sơ xác minh của shop</p>
            </div>
            {renderActions()}
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
                    {shop.logoUrl ? (
                      <Image src={shop.logoUrl} alt={shop.name} width={48} height={48} className="size-12 rounded-lg object-cover border" />
                    ) : (
                      <div className="size-12 rounded-lg bg-muted flex items-center justify-center">
                        <IconBuildingStore className="size-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{shop.name}</p>
                      <p className="text-xs text-muted-foreground">/{shop.slug}</p>
                    </div>
                  </div>
                  {displayDescription && (
                    <p className="text-sm text-muted-foreground whitespace-pre-line break-words leading-relaxed">
                      {displayDescription}
                    </p>
                  )}

                  <div className="text-sm">
                    <span className="text-muted-foreground">Ngày đăng ký: </span>
                    <span className="tabular-nums">{formatDateTimeVN(shop.createdAt, "—")}</span>
                  </div>
                </div>

                {/* Owner Info */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Chủ cửa hàng</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-[72px_1fr] gap-2">
                      <span className="text-muted-foreground">Họ tên:</span>
                      <span className="font-medium break-words">{shop.ownerName ?? "—"}</span>
                    </div>
                    <div className="grid grid-cols-[72px_1fr] gap-2">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium break-all">{shop.ownerEmail ?? "Chưa đồng bộ"}</span>
                    </div>
                    <div className="grid grid-cols-[72px_1fr] gap-2">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-mono text-xs break-all">{shop.ownerId}</span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Trạng thái</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Xác minh:</span>
                      <Badge variant="secondary" className={`text-xs ${VerificationStatusColors[shop.verificationStatus] ?? ""}`}>
                        {VerificationStatusLabels[shop.verificationStatus] ?? shop.verificationStatusName}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Hoạt động:</span>
                      <Badge variant="secondary" className={`text-xs ${ShopStatusColors[shop.status] ?? ""}`}>
                        {ShopStatusLabels[shop.status] ?? shop.statusName}
                      </Badge>
                    </div>
                    {shop.rejectionReason && (
                      <div className="mt-2 rounded-md bg-red-50 dark:bg-red-900/20 p-2">
                        <p className="text-xs font-medium text-red-700 dark:text-red-300">Lý do từ chối:</p>
                        <p className="text-xs text-red-600 dark:text-red-400">{shop.rejectionReason}</p>
                      </div>
                    )}
                    {shop.verifiedByName && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Duyệt bởi: {shop.verifiedByName} · {formatDateTimeVN(shop.verifiedAt ?? null, "—")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="rounded-lg border">
                <div className="border-b p-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <IconFileText className="size-5" />
                    Hồ sơ xác minh
                    <Badge variant="outline" className="ml-1">{shop.documents?.length ?? 0} tài liệu</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Các giấy tờ seller đã nộp để xác minh danh tính và cửa hàng</p>
                </div>
                {(!shop.documents || shop.documents.length === 0) ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <IconFileText className="size-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Seller chưa nộp tài liệu nào</p>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {shop.documents.map((doc) => (
                        <DocumentCard key={doc.id} doc={doc} onPreview={(url) => setPreviewImg(url)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image preview dialog */}
      <Dialog open={previewImg !== null} onOpenChange={(v) => { if (!v) setPreviewImg(null) }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Xem tài liệu</DialogTitle></DialogHeader>
          {previewImg && (
            <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
              <Image src={previewImg} alt="Document preview" width={800} height={600} className="max-w-full max-h-[65vh] object-contain rounded-lg" />
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

      {/* Action dialog */}
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
              onClick={handleDialogAction}
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
