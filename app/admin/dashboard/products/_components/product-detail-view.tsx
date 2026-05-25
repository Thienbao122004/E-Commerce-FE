import * as React from "react"
import Image from "next/image"
import {
  IconArrowLeft,
  IconEye,
  IconEyeOff,
  IconTrash,
  IconTag,
  IconBuildingStore,
  IconCurrencyDollar,
  IconCalendar,
  IconPackage,
  IconCircleCheck,
  IconBan,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ProductStatus,
  ProductStatusLabels,
  ProductStatusColors,
} from "@/types/product"
import type { ProductModeration } from "@/types/product"
import { formatDateTimeVN, formatPriceVND } from "@/lib/formatters"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ActionDialog } from "./action-dialog"
import {
  ProductModerationDiff,
  tryParseProductSnapshotJson,
} from "./product-moderation-diff"

type Props = {
  product: ProductModeration
  detailLoading: boolean
  actionLoading: boolean
  onBack: () => void
  onHide: (id: string, reason: string) => Promise<boolean>
  onUnhide: (id: string) => Promise<boolean>
  onRemove: (id: string, reason: string) => Promise<boolean>
  /** Duyệt sản phẩm chờ duyệt (PendingApproval → Active) */
  onApprove?: (
    id: string
  ) => Promise<{ success: boolean; product?: ProductModeration | null }>
  /** Từ chối duyệt (PendingApproval → Draft, có lý do) */
  onReject?: (
    id: string,
    reason: string
  ) => Promise<{ success: boolean; product?: ProductModeration | null }>
  onProductUpdated: (product: ProductModeration | null) => void
}

export function ProductDetailView({
  product,
  detailLoading,
  actionLoading,
  onBack,
  onHide,
  onUnhide,
  onRemove,
  onApprove,
  onReject,
  onProductUpdated,
}: Props) {
  const [selectedImage, setSelectedImage] = React.useState(0)
  const [dialogState, setDialogState] = React.useState<{
    type: "hide" | "remove" | "unhide" | "reject" | null
  }>({ type: null })

  const lastApprovedSnapshot = React.useMemo(
    () => tryParseProductSnapshotJson(product.lastApprovedSnapshotJson),
    [product.lastApprovedSnapshotJson]
  )

  React.useEffect(() => { setSelectedImage(0) }, [product.id])

  const handleAction = async (reason: string) => {
    if (!dialogState.type) return
    let ok = false
    if (dialogState.type === "hide") {
      ok = await onHide(product.id, reason)
    } else if (dialogState.type === "unhide") {
      ok = await onUnhide(product.id)
    } else if (dialogState.type === "remove") {
      ok = await onRemove(product.id, reason)
    } else if (dialogState.type === "reject" && onReject) {
      const res = await onReject(product.id, reason)
      if (res.success) {
        if (res.product) onProductUpdated(res.product)
        ok = true
      }
    }
    if (ok) setDialogState({ type: null })
  }

  const handleApprove = async () => {
    if (!onApprove) return
    const res = await onApprove(product.id)
    if (res.success) {
      const updated: ProductModeration =
        res.product ??
        {
          ...product,
          status: ProductStatus.Active,
          statusName: ProductStatusLabels[ProductStatus.Active] ?? "Active",
        }
      onProductUpdated(updated)
    }
  }

  const renderActions = () => (
    <div className="flex items-center gap-1 flex-wrap">
      {product.status === ProductStatus.PendingApproval && onApprove ? (
        <Button
          size="sm"
          className="h-8 text-xs bg-[var(--color-primary)] text-white shadow-sm hover:bg-[var(--color-primary-hover)]"
          onClick={handleApprove}
          disabled={actionLoading}
        >
          <IconCircleCheck className="mr-1 size-3.5" />
          Duyệt
        </Button>
      ) : null}
      {product.status === ProductStatus.PendingApproval && onReject ? (
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={() => setDialogState({ type: "reject" })}
          disabled={actionLoading}
        >
          <IconBan className="mr-1 size-3.5" />
          Từ chối
        </Button>
      ) : null}
      {product.status === ProductStatus.Hidden ? (
        <Button
          variant="outline" size="sm"
          className="h-8 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
          onClick={() => setDialogState({ type: "unhide" })}
          disabled={actionLoading}
        >
          <IconEye className="mr-1 size-3.5" />Hiển thị lại
        </Button>
      ) : product.status !== ProductStatus.Removed ? (
        <Button
          variant="outline" size="sm"
          className="h-8 text-xs text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
          onClick={() => setDialogState({ type: "hide" })}
          disabled={actionLoading}
        >
          <IconEyeOff className="mr-1 size-3.5" />Ẩn
        </Button>
      ) : null}
      {product.status !== ProductStatus.Removed && product.status !== ProductStatus.Draft && (
        <Button
          variant="outline" size="sm"
          className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => setDialogState({ type: "remove" })}
          disabled={actionLoading}
        >
          <IconTrash className="mr-1 size-3.5" />Gỡ
        </Button>
      )}
    </div>
  )

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {/* Back + Header */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="size-9" onClick={onBack}>
              <IconArrowLeft className="size-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">Chi tiết sản phẩm</h1>
              <p className="text-muted-foreground text-sm">Xem thông tin và kiểm duyệt sản phẩm</p>
            </div>
            {renderActions()}
          </div>

          {detailLoading ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <div className="flex flex-col gap-4">
                <Skeleton className="aspect-square max-h-[500px] w-full rounded-xl" />
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="size-16 shrink-0 rounded-lg" />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border p-4">
                  <Skeleton className="h-6 w-20 rounded-full mb-3" />
                  <Skeleton className="h-7 w-full mb-2" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              {/* Left: Images */}
              <div className="flex flex-col gap-4">
                <div className="relative aspect-square max-h-[500px] overflow-hidden rounded-xl border bg-muted">
                  {product.imageUrls.length > 0 ? (
                    <Image
                      src={product.imageUrls[selectedImage] ?? product.imageUrls[0]}
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <IconPackage className="size-12 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Không có hình ảnh</p>
                      </div>
                    </div>
                  )}
                </div>
                {product.imageUrls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {product.imageUrls.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`relative shrink-0 size-16 rounded-lg border-2 overflow-hidden transition-all ${selectedImage === i
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-muted-foreground/30"
                          }`}
                      >
                        <Image src={url} alt="" fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Info */}
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Thông tin sản phẩm</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={ProductStatusColors[product.status] ?? ""}>
                      {ProductStatusLabels[product.status] ?? product.statusName}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {product.productCode}
                    </span>
                  </div>
                  <p className="font-semibold text-lg leading-tight">{product.name}</p>
                  {product.description ? (
                    <div className="pt-0.5">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Mô tả</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words mt-1 max-h-48 overflow-y-auto">
                        {product.description}
                      </p>
                    </div>
                  ) : null}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <IconCurrencyDollar className="size-4 text-green-600" />
                      <span className="font-semibold text-lg text-foreground">{formatPriceVND(product.basePrice)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconBuildingStore className="size-4 text-muted-foreground" />
                      <span>{product.shopName}</span>
                    </div>
                    {product.categoryName && (
                      <div className="flex items-center gap-2">
                        <IconTag className="size-4 text-muted-foreground" />
                        <span>{product.categoryName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <IconCalendar className="size-4 text-muted-foreground" />
                      <span>Tạo: {formatDateTimeVN(product.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconCalendar className="size-4 text-muted-foreground" />
                      <span>Cập nhật: {formatDateTimeVN(product.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Thao tác kiểm duyệt</h3>
                  <p className="text-sm text-muted-foreground">Quản lý trạng thái hiển thị sản phẩm trên hệ thống</p>
                  <div className="flex flex-col gap-2 pt-1">
                    {product.status === ProductStatus.PendingApproval && onApprove ? (
                      <Button
                        className="w-full justify-start bg-[var(--color-primary)] text-white shadow-sm hover:bg-[var(--color-primary-hover)]"
                        onClick={handleApprove}
                        disabled={actionLoading}
                      >
                        <IconCircleCheck className="mr-2 size-4" />
                        Duyệt và mở bán
                      </Button>
                    ) : null}
                    {product.status === ProductStatus.PendingApproval && onReject ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setDialogState({ type: "reject" })}
                        disabled={actionLoading}
                      >
                        <IconBan className="mr-2 size-4" />
                        Từ chối (về nháp)
                      </Button>
                    ) : null}
                    {product.status === ProductStatus.Hidden ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-green-600 hover:text-green-700"
                        onClick={() => setDialogState({ type: "unhide" })}
                        disabled={actionLoading}
                      >
                        <IconEye className="mr-2 size-4" />Hiển thị lại sản phẩm
                      </Button>
                    ) : product.status !== ProductStatus.Removed ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-yellow-600 hover:text-yellow-700"
                        onClick={() => setDialogState({ type: "hide" })}
                        disabled={actionLoading}
                      >
                        <IconEyeOff className="mr-2 size-4" />Ẩn sản phẩm
                      </Button>
                    ) : null}
                    {product.status !== ProductStatus.Removed && (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700"
                        onClick={() => setDialogState({ type: "remove" })}
                        disabled={actionLoading}
                      >
                        <IconTrash className="mr-2 size-4" />Gỡ sản phẩm vĩnh viễn
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Local Brand block — hiển thị cho admin khi duyệt ── */}
          {!detailLoading && product.localMeta && (
            <div className="rounded-xl border p-4 flex flex-col gap-3"
              style={{ borderColor: "#d4a96a", background: "linear-gradient(135deg,#fffbf2,#fef6e8)" }}>
              {/* Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="material-symbols-outlined text-[18px]" style={{ color: "#b06017" }}>workspace_premium</span>
                <span className="text-sm font-bold" style={{ color: "#7a4a1e" }}>Thông tin Local Brand</span>
                {product.status === ProductStatus.PendingApproval ? (
                  <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                    style={{ background: "#fef9c3", color: "#854d0e", borderColor: "#fde047" }}>
                    Chờ admin xác nhận
                  </span>
                ) : product.status === ProductStatus.Draft ? (
                  <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                    style={{ background: "#f3f4f6", color: "#374151", borderColor: "#e5e7eb" }}>
                    Chưa xác nhận
                  </span>
                ) : (
                  <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                    style={{ background: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" }}>
                    Đã xác nhận
                  </span>
                )}
              </div>

              {/* Profile info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Loại cà phê đặc sản</p>
                  <p className="font-semibold" style={{ color: "#7a4a1e" }}>{product.localMeta.archetypeName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Vùng xuất xứ (chuẩn hóa)</p>
                  <p className="font-semibold flex items-center gap-1" style={{ color: "#7a4a1e" }}>
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {product.localMeta.provinceName}
                  </p>
                </div>
              </div>

              {/* Traits comparison */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Đặc điểm seller khai báo vs. chuẩn hồ sơ</p>
                <div className="flex flex-wrap gap-2">
                  {product.localMeta.expectedTraits.map((trait) => {
                    const declared = product.localMeta!.selectedTraits.includes(trait)
                    return (
                      <span key={trait}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border"
                        style={{
                          background: declared ? "#fde8c8" : "#f3f4f6",
                          color: declared ? "#7a4a1e" : "#9ca3af",
                          borderColor: declared ? "#f0c890" : "#e5e7eb",
                        }}>
                        <span className="material-symbols-outlined text-[11px]">
                          {declared ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        {trait}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Mismatch warning nếu có */}
              {product.localMeta.mismatchWarning && (
                <div className="rounded-lg border px-3 py-2 flex items-start gap-2"
                  style={{ borderColor: "#f0a030", background: "#fffbf0" }}>
                  <span className="material-symbols-outlined text-[15px] mt-0.5 shrink-0" style={{ color: "#c07030" }}>warning</span>
                  <p className="text-xs" style={{ color: "#8a4010" }}>{product.localMeta.mismatchWarning}</p>
                </div>
              )}

              {product.localMeta.displayNote && (
                <p className="text-xs italic" style={{ color: "#8a6030" }}>
                  💡 {product.localMeta.displayNote}
                </p>
              )}
            </div>
          )}

          {!detailLoading && product.status === ProductStatus.PendingApproval ? (
            lastApprovedSnapshot ? (
              <ProductModerationDiff
                product={product}
                snapshot={lastApprovedSnapshot}
              />
            ) : (
              <Alert className="border-amber-500/40 bg-amber-500/5">
                <AlertTitle>Chưa có bản đã duyệt để so sánh</AlertTitle>
                <AlertDescription>
                  Hệ thống chưa lưu “ảnh chụp” lần duyệt trước (lần đăng/chỉnh sửa đầu hoặc dữ liệu
                  từ phiên bản cũ). Bạn vẫn thấy đủ nội dung hiện tại ở trên; sau lần duyệt tiếp
                  theo, phần so sánh cũ ↔ mới sẽ hoạt động.
                </AlertDescription>
              </Alert>
            )
          ) : null}
        </div>
      </div>

      <ActionDialog
        open={dialogState.type === "hide"}
        onOpenChange={(v) => !v && setDialogState({ type: null })}
        title="Ẩn sản phẩm"
        description={`Bạn có chắc muốn ẩn "${product.name}"? Sản phẩm sẽ không còn hiển thị cho người mua.`}
        loading={actionLoading}
        onConfirm={handleAction}
        requireReason
      />
      <ActionDialog
        open={dialogState.type === "unhide"}
        onOpenChange={(v) => !v && setDialogState({ type: null })}
        title="Hiển thị lại sản phẩm"
        description={`Bạn có chắc muốn hiển thị lại "${product.name}"?`}
        loading={actionLoading}
        onConfirm={handleAction}
        requireReason={false}
      />
      <ActionDialog
        open={dialogState.type === "remove"}
        onOpenChange={(v) => !v && setDialogState({ type: null })}
        title="Gỡ sản phẩm vĩnh viễn"
        description={`Thao tác này sẽ gỡ "${product.name}" (shop: ${product.shopName}) khỏi nền tảng. Hành động này không thể hoàn tác.`}
        loading={actionLoading}
        onConfirm={handleAction}
        requireReason
      />
      <ActionDialog
        open={dialogState.type === "reject"}
        onOpenChange={(v) => !v && setDialogState({ type: null })}
        title="Từ chối duyệt"
        description="Sản phẩm sẽ về nháp. Nhập lý do (gửi tới shop)."
        loading={actionLoading}
        onConfirm={handleAction}
        requireReason
      />
    </>
  )
}
