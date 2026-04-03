"use client"

import * as React from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  IconArrowLeft,
  IconEye,
  IconEyeOff,
  IconTrash,
  IconCalendar,
  IconTag,
  IconBuildingStore,
  IconCurrencyDollar,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

import { supabase } from "@/lib/supabase"
import { formatDateTimeVN, formatPriceVND } from "@/lib/formatters"
import { fetchProductById, hideProduct, unhideProduct, removeProduct } from "@/services/products"
import {
  ProductStatus,
  ProductStatusLabels,
  ProductStatusColors,
} from "@/types/product"
import type { ProductModeration } from "@/types/product"

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = React.useState<ProductModeration | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [selectedImage, setSelectedImage] = React.useState(0)
  const [dialogState, setDialogState] = React.useState<{
    type: "hide" | "remove" | "unhide" | null
  }>({ type: null })
  const [reason, setReason] = React.useState("")

  const getToken = React.useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }, [])

  const load = React.useCallback(async () => {
    setLoading(true)
    const token = await getToken()
    if (!token) {
      toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")
      setLoading(false)
      return
    }
    try {
      const res = await fetchProductById(token, params.id)
      if (res.success && res.product) {
        setProduct(res.product)
      } else {
        toast.error(res.message ?? "Không tìm thấy sản phẩm")
        router.push("/admin/dashboard/products")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải sản phẩm")
    } finally {
      setLoading(false)
    }
  }, [getToken, params.id, router])

  React.useEffect(() => {
    load()
  }, [load])

  const handleAction = async () => {
    if (!product || !dialogState.type) return
    setActionLoading(true)
    const token = await getToken()
    if (!token) { setActionLoading(false); return }

    try {
      let res
      if (dialogState.type === "hide") {
        res = await hideProduct(token, product.id, reason)
      } else if (dialogState.type === "unhide") {
        res = await unhideProduct(token, product.id)
      } else {
        res = await removeProduct(token, product.id, reason)
      }
      if (res.success) {
        toast.success(res.message ?? "Thao tác thành công")
        setDialogState({ type: null })
        setReason("")
        await load()
      } else {
        toast.error(res.message ?? "Thao tác thất bại")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra")
    } finally {
      setActionLoading(false)
    }
  }

  const needsReason = dialogState.type === "hide" || dialogState.type === "remove"

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-6 p-4 lg:p-6">

          <div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/dashboard/products">
                <IconArrowLeft className="mr-1.5 size-4" />
                Quay lại danh sách
              </Link>
            </Button>
          </div>

          {loading ? (
            <ProductDetailSkeleton />
          ) : product ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
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
                      Không có hình ảnh
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


              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader className="gap-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={ProductStatusColors[product.status] ?? ""}
                      >
                        {ProductStatusLabels[product.status] ?? product.statusName}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl leading-tight">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <IconCurrencyDollar className="size-4 text-green-600" />
                        <span className="font-semibold text-lg text-foreground">
                          {formatPriceVND(product.basePrice)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconBuildingStore className="size-4" />
                        <span>{product.shopName}</span>
                      </div>
                      {product.categoryName && (
                        <div className="flex items-center gap-2">
                          <IconTag className="size-4" />
                          <span>{product.categoryName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <IconCalendar className="size-4" />
                        <span>Tạo: {formatDateTimeVN(product.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconCalendar className="size-4" />
                        <span>Cập nhật: {formatDateTimeVN(product.updatedAt)}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                </Card>


                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Thao tác kiểm duyệt</CardTitle>
                    <CardDescription>
                      Quản lý trạng thái hiển thị sản phẩm trên hệ thống
                    </CardDescription>
                    <div className="flex flex-col gap-2 pt-2">
                      {product.status === ProductStatus.Hidden ? (
                        <Button
                          variant="outline"
                          className="w-full justify-start text-green-600 hover:text-green-700"
                          onClick={() => { setReason(""); setDialogState({ type: "unhide" }) }}
                          disabled={actionLoading}
                        >
                          <IconEye className="mr-2 size-4" />
                          Hiển thị lại sản phẩm
                        </Button>
                      ) : product.status !== ProductStatus.Removed ? (
                        <Button
                          variant="outline"
                          className="w-full justify-start text-yellow-600 hover:text-yellow-700"
                          onClick={() => { setReason(""); setDialogState({ type: "hide" }) }}
                          disabled={actionLoading}
                        >
                          <IconEyeOff className="mr-2 size-4" />
                          Ẩn sản phẩm
                        </Button>
                      ) : null}
                      {product.status !== ProductStatus.Removed && (
                        <Button
                          variant="outline"
                          className="w-full justify-start text-red-600 hover:text-red-700"
                          onClick={() => { setReason(""); setDialogState({ type: "remove" }) }}
                          disabled={actionLoading}
                        >
                          <IconTrash className="mr-2 size-4" />
                          Gỡ sản phẩm vĩnh viễn
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>
          ) : null}
        </div>
      </div>


      <Dialog
        open={dialogState.type !== null}
        onOpenChange={(v) => { if (!v) setDialogState({ type: null }) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState.type === "hide"
                ? "Ẩn sản phẩm"
                : dialogState.type === "remove"
                  ? "Gỡ sản phẩm vĩnh viễn"
                  : "Hiển thị lại sản phẩm"}
            </DialogTitle>
            <DialogDescription>
              {dialogState.type === "hide"
                ? `Bạn có chắc muốn ẩn "${product?.name}"? Sản phẩm sẽ không còn hiển thị cho người mua.`
                : dialogState.type === "remove"
                  ? `Thao tác này sẽ gỡ "${product?.name}" khỏi hệ thống. Không thể hoàn tác.`
                  : `Bạn có chắc muốn hiển thị lại "${product?.name}"?`}
            </DialogDescription>
          </DialogHeader>
          {needsReason && (
            <Textarea
              placeholder="Nhập lý do..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogState({ type: null })}
              disabled={actionLoading}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleAction}
              disabled={actionLoading || (needsReason && !reason.trim())}
            >
              {actionLoading ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ProductDetailSkeleton() {
  return (
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
        <Card>
          <CardHeader className="gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-44" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-10 w-full mt-2" />
            <Skeleton className="h-10 w-full" />
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
