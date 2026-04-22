import * as React from "react"
import Image from "next/image"
import {
  IconCheck, IconX, IconPlayerPlay, IconPlayerPause, IconDoorExit,
  IconBuildingStore, IconFileText, IconExternalLink, IconArrowLeft,
  IconId,
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

function displayVal(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "—"
  const s = String(v).trim()
  return s.length > 0 ? s : "—"
}

function identityHasText(identity: ShopVerification["identity"]): boolean {
  if (!identity) return false
  return Object.values(identity).some((v) => v != null && String(v).trim() !== "")
}

export function SellerDetailView({
  shop, detailLoading, busy,
  onBack, onApprove, onReject, onActivate, onSuspend, onClose,
}: Props) {
  const [previewImg, setPreviewImg] = React.useState<string | null>(null)
  const [dialogType, setDialogType] = React.useState<DialogType>(null)
  const [reason, setReason] = React.useState("")
  const [note, setNote] = React.useState("")

  const businessTypeLabel = React.useMemo(() => {
    const raw = (shop.businessType ?? "").trim().toLowerCase()
    if (raw && BUSINESS_TYPE_LABELS[raw]) return BUSINESS_TYPE_LABELS[raw]
    const match = shop.description?.match(/Business\s*Type:\s*([A-Za-z_]+)/i)
    const fromDesc = match?.[1]?.toLowerCase()
    if (fromDesc && BUSINESS_TYPE_LABELS[fromDesc]) return BUSINESS_TYPE_LABELS[fromDesc]
    return raw || fromDesc || null
  }, [shop.businessType, shop.description])

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

                  {shop.shopCode && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Mã shop: </span>
                      <span className="font-mono text-xs">{shop.shopCode}</span>
                    </div>
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

              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Thông tin đăng ký &amp; liên hệ
                </h3>
                <p className="text-xs text-muted-foreground">
                  Các trường seller đã điền khi đăng ký (địa chỉ lấy hàng, giấy tờ doanh nghiệp, ngân hàng). Mã phường/quận/tỉnh hiển thị theo dữ liệu GHN đã chọn lúc đăng ký.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Số điện thoại shop</span>
                    <p className="font-medium break-all">{displayVal(shop.phone)}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                    <span className="text-muted-foreground text-xs">Địa chỉ (số nhà, đường)</span>
                    <p className="font-medium break-words">{displayVal(shop.addressLine)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Tỉnh / Thành (text)</span>
                    <p className="font-medium">{displayVal(shop.city)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Mã tỉnh (provinceId)</span>
                    <p className="font-medium tabular-nums">{shop.provinceId != null ? String(shop.provinceId) : "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Mã quận (districtId)</span>
                    <p className="font-medium tabular-nums">{shop.districtId != null ? String(shop.districtId) : "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Mã phường (wardCode)</span>
                    <p className="font-mono text-xs break-all">{displayVal(shop.wardCode)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Loại hình kinh doanh</span>
                    <p className="font-medium">{displayVal(businessTypeLabel)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Số giấy phép / ĐKKD</span>
                    <p className="font-medium break-all">{displayVal(shop.businessLicenseNumber)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Mã số thuế</span>
                    <p className="font-medium break-all">{displayVal(shop.taxCode)}</p>
                  </div>
                  <div className="space-y-1 lg:col-span-3 border-t pt-3 mt-1">
                    <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Tài khoản ngân hàng nhận thanh toán</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Ngân hàng</span>
                    <p className="font-medium">{displayVal(shop.bankName)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Số tài khoản</span>
                    <p className="font-mono text-xs break-all">{displayVal(shop.bankAccountNumber)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Chủ tài khoản</span>
                    <p className="font-medium break-words">{displayVal(shop.bankAccountName)}</p>
                  </div>
                  {shop.ghnShopId != null && shop.ghnShopId > 0 && (
                    <div className="space-y-1 lg:col-span-3">
                      <span className="text-muted-foreground text-xs">GHN Shop ID (sau khi đồng bộ)</span>
                      <p className="font-mono text-xs">{shop.ghnShopId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CCCD: chỉ snapshot văn bản — không lưu ảnh */}
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <IconId className="size-5 shrink-0" />
                  Thông tin CCCD/CMND (lúc đăng ký)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Hệ thống <strong>không lưu file ảnh</strong> mặt trước/sau thẻ; dưới đây là nội dung văn bản lấy từ OCR tại thời điểm gửi đơn (snapshot trong cơ sở dữ liệu).
                </p>
                {!identityHasText(shop.identity) ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có dữ liệu CCCD trên hồ sơ — thường gặp với đăng ký cũ trước khi hệ thống lưu snapshot, hoặc đơn chưa gửi kèm thông tin định danh.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                    {(
                      [
                        ["Họ và tên (thẻ)", shop.identity?.fullName],
                        ["Số CCCD/CMND", shop.identity?.idNumber],
                        ["Ngày sinh", shop.identity?.dateOfBirth],
                        ["Giới tính", shop.identity?.sex],
                        ["Quốc tịch", shop.identity?.nationality],
                        ["Quê quán", shop.identity?.homeTown],
                        ["Nơi thường trú", shop.identity?.permanentAddress],
                        ["Tỉnh/TP (tách từ địa chỉ)", shop.identity?.addrProvince],
                        ["Quận/Huyện", shop.identity?.addrDistrict],
                        ["Phường/Xã", shop.identity?.addrWard],
                        ["Số nhà, đường", shop.identity?.addrStreet],
                        ["Ngày hết hạn", shop.identity?.dateOfExpiry],
                        ["Loại thẻ", shop.identity?.cardType],
                        ["Ngày cấp", shop.identity?.issueDate],
                        ["Nơi cấp", shop.identity?.issuePlace],
                        ["Tôn giáo", shop.identity?.religion],
                        ["Dân tộc", shop.identity?.ethnicity],
                      ] as const
                    ).map(([label, val]) => (
                      <div key={label} className="space-y-1">
                        <span className="text-muted-foreground text-xs">{label}</span>
                        <p className="font-medium break-words">{displayVal(val)}</p>
                      </div>
                    ))}
                    <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                      <span className="text-muted-foreground text-xs">Đặc điểm nhận dạng (mặt sau)</span>
                      <p className="font-medium break-words whitespace-pre-wrap text-sm">
                        {displayVal(shop.identity?.features)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Documents — file GPKD, thuế (Supabase) */}
              <div className="rounded-lg border">
                <div className="border-b p-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <IconFileText className="size-5" />
                    Hồ sơ &amp; giấy tờ có file
                    <Badge variant="outline" className="ml-1">{shop.documents?.length ?? 0} tài liệu</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Các tệp upload (GPKD, mã số thuế…). Ảnh CCCD không nằm ở đây — xem khối &quot;Thông tin CCCD&quot; phía trên.
                  </p>
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
