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
import { ActionDialog } from "./action-dialog"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v)

const formatDate = (ts: string) =>
  new Date(ts).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

type Props = {
  product: ProductModeration
  detailLoading: boolean
  actionLoading: boolean
  onBack: () => void
  onHide: (id: string, reason: string) => Promise<boolean>
  onUnhide: (id: string) => Promise<boolean>
  onRemove: (id: string, reason: string) => Promise<boolean>
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
  onProductUpdated,
}: Props) {
  const [selectedImage, setSelectedImage] = React.useState(0)
  const [dialogState, setDialogState] = React.useState<{
    type: "hide" | "remove" | "unhide" | null
  }>({ type: null })

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
    }
    if (ok) setDialogState({ type: null })
  }

  const renderActions = () => (
    <div className="flex items-center gap-1 flex-wrap">
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
                  <Badge variant="secondary" className={ProductStatusColors[product.status] ?? ""}>
                    {ProductStatusLabels[product.status] ?? product.statusName}
                  </Badge>
                  <p className="font-semibold text-lg leading-tight">{product.name}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <IconCurrencyDollar className="size-4 text-green-600" />
                      <span className="font-semibold text-lg text-foreground">{currency(product.basePrice)}</span>
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
                      <span>Tạo: {formatDate(product.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconCalendar className="size-4 text-muted-foreground" />
                      <span>Cập nhật: {formatDate(product.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Thao tác kiểm duyệt</h3>
                  <p className="text-sm text-muted-foreground">Quản lý trạng thái hiển thị sản phẩm trên hệ thống</p>
                  <div className="flex flex-col gap-2 pt-1">
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
    </>
  )
}
