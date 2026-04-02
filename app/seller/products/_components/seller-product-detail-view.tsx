"use client"

import * as React from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import {
  IconArrowLeft,
  IconCalendar,
  IconEdit,
  IconRefresh,
  IconTag,
  IconTrash,
  IconPhoto,
  IconClipboard,
  IconBox,
  IconReceipt2,
  IconStatusChange,
  IconAlignLeft,
  IconPlus,
  IconPackage,
  IconAlertTriangle,
  IconCheck,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  fetchMyProductById,
  updateMyProduct,
  deleteMyProduct,
} from "@/services/seller-dashboard"
import { ProductStatus } from "@/types/seller-dashboard"
import type { SellerProductDetail } from "@/types/seller-dashboard"
import { supabase } from "@/lib/supabase"
import { formatDateTimeVN as fmtDate, formatPriceVND as currency } from "@/lib/formatters"

const statusMap: Record<number, { label: string; cls: string; dotCls: string }> = {
  [ProductStatus.Draft]: {
    label: "Nháp",
    cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
    dotCls: "bg-zinc-400",
  },
  [ProductStatus.Active]: {
    label: "Đang bán",
    cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dotCls: "bg-emerald-500",
  },
  [ProductStatus.Hidden]: {
    label: "Đã ẩn",
    cls: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dotCls: "bg-amber-500",
  },
  [ProductStatus.Deleted]: {
    label: "Đã xóa",
    cls: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800",
    dotCls: "bg-red-500",
  },
}

type NativeImageFile = {
  id: string
  url: string
  file?: File
  uploading?: boolean
  error?: boolean
}

type Props = { productId: string; onBack: () => void }

function DetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr] xl:grid-cols-[460px_1fr] items-start">
      <div className="flex flex-col gap-4">
        <Skeleton className="aspect-[4/3] w-full" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-[280px]" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-[200px]" />
      </div>
    </div>
  )
}

export function SellerProductDetailView({ productId, onBack }: Props) {
  const { resolvedTheme } = useTheme()

  const [product, setProduct] = React.useState<SellerProductDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [selectedImg, setSelectedImg] = React.useState(0)

  const [editName, setEditName] = React.useState("")
  const [editDesc, setEditDesc] = React.useState("")
  const [editPrice, setEditPrice] = React.useState("")
  const [editStatus, setEditStatus] = React.useState("")
  const [dirty, setDirty] = React.useState(false)

  const [fileList, setFileList] = React.useState<NativeImageFile[]>([])
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchMyProductById(productId)
      if (res.success && res.data) {
        const p = res.data
        setProduct(p)
        setEditName(p.name)
        setEditDesc(p.description ?? "")
        setEditPrice(String(p.basePrice))
        setEditStatus(String(p.status))
        setDirty(false)
        setSelectedImg(0)
        setFileList(
          (p.images ?? []).map((img, idx) => ({
            id: img.id || idx.toString(),
            url: img.imageUrl,
          }))
        )
      } else {
        toast.error(res.message ?? "Không tìm thấy sản phẩm")
        onBack()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải sản phẩm")
      onBack()
    } finally {
      setLoading(false)
    }
  }, [productId, onBack])

  React.useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    if (!product) return
    setSaving(true)
    try {
      const res = await updateMyProduct(product.id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        basePrice: Number(editPrice),
        status: Number(editStatus),
        imageUrls: fileList.map((f) => f.url).filter(Boolean),
      })
      if (res.success) {
        toast.success("Cập nhật thành công")
        await load()
      } else toast.error(res.message ?? "Lỗi cập nhật")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi cập nhật")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!product) return
    setDeleting(true)
    try {
      const res = await deleteMyProduct(product.id)
      if (res.success) {
        toast.success("Đã xóa sản phẩm")
        onBack()
      } else toast.error(res.message ?? "Lỗi xóa")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi xóa")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const mark = () => setDirty(true)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleNativeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const newItems = files.map((f) => ({
      id: Math.random().toString(36).slice(2),
      url: URL.createObjectURL(f),
      file: f,
      uploading: true,
    }))

    setFileList((prev) => [...prev, ...newItems])
    mark()

    for (const item of newItems) {
      try {
        const ext = item.file!.name.split(".").pop()
        const path = `products/${Date.now()}-${item.id}.${ext}`
        const { data, error } = await supabase.storage
          .from("product-images")
          .upload(path, item.file!, { cacheControl: "3600", upsert: false })

        if (error) throw error
        const { data: pub } = supabase.storage
          .from("product-images")
          .getPublicUrl(data.path)

        setFileList((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, url: pub.publicUrl, uploading: false } : p
          )
        )
      } catch (err) {
        toast.error(`Tải ảnh ${item.file?.name} thất bại`)
        setFileList((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, uploading: false, error: true } : p))
        )
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const images = fileList
  const mainUrl = images[selectedImg]?.url || images[0]?.url
  const st = product ? statusMap[product.status] : null
  const stockLevel = product?.totalStock ?? 0

  return (
    <>
      <div className="flex flex-1 flex-col gap-5 p-4 lg:p-6 pb-28 md:pb-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="outline"
              size="icon"
              className="size-9 shrink-0 rounded-xl border shadow-sm hover:bg-muted"
              onClick={onBack}
            >
              <IconArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate leading-tight">
                  {loading ? "Đang tải..." : product?.name ?? "Chi tiết sản phẩm"}
                </h1>
                {!loading && st && (
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>
                    <span className={`size-1.5 rounded-full ${st.dotCls}`} />
                    {st.label}
                  </span>
                )}
              </div>
              {!loading && product && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mã SP: <span className="font-mono">{product.productCode}</span>
                  {product.categoryName && (
                    <> · <span className="text-foreground/70">{product.categoryName}</span></>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Desktop quick actions */}
          {!loading && product && (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5 h-9 rounded-xl">
                <IconRefresh className="size-3.5" />
                Tải lại
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 h-9 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleting}
              >
                <IconTrash className="size-3.5" />
                Xóa
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!dirty || saving}
                className="gap-1.5 h-9 rounded-xl min-w-[130px] shadow-sm"
              >
                {saving ? (
                  <><div className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Đang lưu...</>
                ) : (
                  <><IconCheck className="size-3.5" /> Lưu thay đổi</>
                )}
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <DetailSkeleton />
        ) : product ? (
          <div className="grid gap-6 lg:grid-cols-[420px_1fr] xl:grid-cols-[460px_1fr] items-start">

            {/* ══ LEFT COLUMN ══ */}
            <div className="flex flex-col gap-4">
              <Card className="overflow-hidden rounded border shadow-sm">
                {/* Main image */}
                <div className="relative aspect-[4/3] w-full bg-muted/30 group">
                  {mainUrl ? (
                    <Image
                      src={mainUrl}
                      alt="Main Preview"
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <IconPhoto className="size-8 opacity-30" />
                      </div>
                      <span className="text-sm font-medium opacity-50">Chưa có hình ảnh</span>
                    </div>
                  )}

                  {/* Overlay top bar */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      {fileList.length > 0 && (
                        <span className="bg-black/50 text-white text-[10px] font-semibold px-2 py-1 rounded-lg backdrop-blur-sm">
                          {selectedImg + 1} / {fileList.length}
                        </span>
                      )}
                    </div>
                    {mainUrl && (
                      <button
                        className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white size-8 rounded-lg flex items-center justify-center backdrop-blur-sm transition-colors"
                        onClick={() => { setPreviewUrl(mainUrl); setPreviewOpen(true) }}
                        title="Phóng to"
                      >
                        <IconPhoto className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="p-3 border-t bg-muted/10">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Ảnh sản phẩm
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground tabular-nums">{fileList.length}/6</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-6 text-[10px] px-2 gap-1 rounded-lg"
                        disabled={fileList.length >= 6}
                      >
                        <IconPlus className="size-3" /> Thêm
                      </Button>
                    </div>
                  </div>

                  {fileList.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                      {fileList.map((file, idx) => (
                        <div
                          key={file.id}
                          className={`group relative aspect-square rounded-xl overflow-hidden border-2 bg-muted/20 cursor-pointer transition-all duration-150 ${
                            idx === selectedImg
                              ? "border-primary shadow-md shadow-primary/20"
                              : "border-transparent hover:border-muted-foreground/30"
                          } ${file.uploading ? "opacity-60" : ""}`}
                          onClick={() => setSelectedImg(idx)}
                        >
                          {file.url && !file.error ? (
                            <Image src={file.url} alt="Thumbnail" fill className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted">
                              {file.uploading ? (
                                <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <IconX className="size-3.5 text-red-500" />
                              )}
                            </div>
                          )}

                          {/* Delete overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              title="Xóa ảnh"
                              className="bg-red-500 hover:bg-red-600 text-white size-6 rounded-lg flex items-center justify-center shadow-lg transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                const newFiles = [...fileList]
                                newFiles.splice(idx, 1)
                                setFileList(newFiles)
                                mark()
                                if (selectedImg >= newFiles.length)
                                  setSelectedImg(Math.max(0, newFiles.length - 1))
                              }}
                            >
                              <IconTrash className="size-3" />
                            </button>
                          </div>

                          {idx === 0 && (
                            <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase shadow">
                              Main
                            </div>
                          )}
                        </div>
                      ))}

                      {fileList.length < 6 && (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="relative aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-primary"
                        >
                          <IconPlus className="size-4" />
                          <span className="text-[9px] font-semibold">Thêm</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary"
                    >
                      <IconPlus className="size-6" />
                      <span className="text-xs font-medium">Nhấn để thêm ảnh</span>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleNativeUpload}
                  />
                </div>
              </Card>

              {/* ── Quick stats (mobile only, shown below image) ── */}
              <div className="grid grid-cols-3 gap-3 lg:hidden">
                <StatCard
                  label="Tồn kho"
                  value={String(stockLevel)}
                  color={stockLevel === 0 ? "red" : stockLevel <= 10 ? "amber" : "green"}
                  icon={<IconPackage className="size-4" />}
                />
                <StatCard
                  label="Phân loại"
                  value={String(product.variants?.length ?? 0)}
                  color="blue"
                  icon={<IconClipboard className="size-4" />}
                />
                <StatCard
                  label="Giá gốc"
                  value={currency(product.basePrice)}
                  color="purple"
                  icon={<IconReceipt2 className="size-4" />}
                  small
                />
              </div>
            </div>

            {/* ══ RIGHT COLUMN ══ */}
            <div className="flex flex-col gap-4">

              {/* ── Quick stats (desktop) ── */}
              <div className="hidden lg:grid grid-cols-3 gap-3">
                <StatCard
                  label="Tồn kho"
                  value={String(stockLevel)}
                  color={stockLevel === 0 ? "red" : stockLevel <= 10 ? "amber" : "green"}
                  icon={<IconPackage className="size-4" />}
                />
                <StatCard
                  label="Phân loại"
                  value={String(product.variants?.length ?? 0)}
                  color="blue"
                  icon={<IconClipboard className="size-4" />}
                />
                <StatCard
                  label="Ngày tạo"
                  value={fmtDate(product.createdAt).split(",")[0]}
                  subValue={fmtDate(product.createdAt).split(",")[1]?.trim()}
                  color="default"
                  icon={<IconCalendar className="size-4" />}
                  small
                />
              </div>

              <Card className="rounded shadow-sm overflow-hidden">
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ed-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <IconBox className="size-3.5" />
                      Tên sản phẩm <span className="text-red-500 normal-case font-normal tracking-normal">*</span>
                    </Label>
                    <Input
                      id="ed-name"
                      value={editName}
                      onChange={(e) => { setEditName(e.target.value); mark() }}
                      className="h-10 text-sm font-medium rounded-xl bg-muted/20 border-muted focus-visible:bg-background"
                      placeholder="Tên sản phẩm..."
                    />
                  </div>

                  {/* Price + Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="ed-price" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <IconReceipt2 className="size-3.5" />
                        Giá bán (VND) <span className="text-red-500 normal-case font-normal tracking-normal">*</span>
                      </Label>
                      <Input
                        id="ed-price"
                        type="number"
                        min={0}
                        value={editPrice}
                        onChange={(e) => { setEditPrice(e.target.value); mark() }}
                        className="h-10 text-sm font-semibold text-primary rounded-xl bg-muted/20 border-muted focus-visible:bg-background tabular-nums"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ed-status" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <IconStatusChange className="size-3.5" />
                        Trạng thái
                      </Label>
                      <Select
                        value={editStatus}
                        onValueChange={(v) => { setEditStatus(v); mark() }}
                      >
                        <SelectTrigger id="ed-status" className="h-10 text-sm rounded-xl bg-muted/20 border-muted focus-visible:bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value={String(ProductStatus.Active)}>Đang bán</SelectItem>
                          <SelectItem value={String(ProductStatus.Draft)}>Lưu nháp</SelectItem>
                          <SelectItem value={String(ProductStatus.Hidden)}>Đã ẩn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Category + Date info row */}
                  {(product.categoryName) && (
                    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/20 rounded-xl border">
                      {product.categoryName && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <IconTag className="size-3.5" />
                          </span>
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider leading-none mb-0.5">Danh mục</p>
                            <p className="text-sm font-semibold text-foreground leading-none">{product.categoryName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator className="my-1" />

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ed-desc" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <IconAlignLeft className="size-3.5" />
                      Mô tả sản phẩm
                    </Label>
                    <Textarea
                      id="ed-desc"
                      rows={6}
                      value={editDesc}
                      onChange={(e) => { setEditDesc(e.target.value); mark() }}
                      placeholder="Nhập mô tả chi tiết sản phẩm..."
                      className="text-sm resize-y min-h-[120px] rounded-xl bg-muted/20 border-muted focus-visible:bg-background"
                    />
                  </div>
                </CardContent>
              </Card>

              {(product.variants?.length ?? 0) > 0 ? (
                <Card className="rounded shadow-sm overflow-hidden">
                  <CardHeader className="py-3 px-5 bg-muted/20 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <IconClipboard className="size-3.5" />
                      </div>
                      Phân loại sản phẩm
                    </CardTitle>
                    <Badge variant="secondary" className="rounded-lg tabular-nums text-[11px] font-semibold">
                      {product.variants!.length} loại
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[320px]">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold border-b">
                            <th className="text-left py-2.5 px-5">Tên loại</th>
                            <th className="text-right py-2.5 px-5">Giá</th>
                            <th className="text-right py-2.5 px-5">Tồn kho</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {product.variants!.map((v) => (
                            <tr key={v.id} className="hover:bg-muted/20 transition-colors group">
                              <td className="py-3 px-5 max-w-[160px]">
                                <div className="font-semibold text-[12px] truncate" title={v.variantName}>
                                  {v.variantName}
                                </div>
                                {v.sku && (
                                  <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5" title={v.sku}>
                                    {v.sku}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-5 text-right font-bold text-primary tabular-nums text-[12px]">
                                {v.price != null ? currency(v.price) : "—"}
                              </td>
                              <td className="py-3 px-5 text-right">
                                <span className={`inline-flex items-center justify-center min-w-[32px] h-6 rounded-lg px-2 text-[11px] font-bold tabular-nums ${
                                  (v.stock ?? 0) === 0
                                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                    : (v.stock ?? 0) <= 10
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                }`}>
                                  {v.stock ?? 0}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-sm border-dashed rounded">
                  <CardContent className="py-10 flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <IconClipboard className="size-6 opacity-30" />
                    </div>
                    <p className="text-sm font-medium opacity-50">Sản phẩm không có phân loại</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Mobile sticky action bar ── */}
      {!loading && product && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-t px-4 py-3 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 h-9 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleting}
          >
            <IconTrash className="size-4" />
            Xóa
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5 h-9 rounded-xl">
              <IconRefresh className="size-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="gap-1.5 h-9 rounded-xl min-w-[120px] shadow-sm"
            >
              {saving ? (
                <><div className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Đang lưu...</>
              ) : (
                <><IconCheck className="size-3.5" /> Lưu thay đổi</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Image preview overlay ── */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewUrl || mainUrl}
              alt="preview"
              className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              className="absolute top-3 right-3 size-10 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 rounded-full shadow-xl flex items-center justify-center transition-all"
              onClick={() => setPreviewOpen(false)}
            >
              <IconX className="size-5" />
            </button>

            {/* Navigate between images */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    className={`rounded-full transition-all ${idx === selectedImg ? "size-2.5 bg-white" : "size-2 bg-white/40 hover:bg-white/70"}`}
                    onClick={() => setSelectedImg(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={(v) => { if (!v) setShowDeleteDialog(false) }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <div className="size-12 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
              <IconAlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-center text-red-600 dark:text-red-400">Xác nhận xóa sản phẩm</DialogTitle>
            <DialogDescription className="pt-1 text-center">
              Bạn đang chuẩn bị xóa sản phẩm{" "}
              <strong className="text-foreground">&ldquo;{product?.name}&rdquo;</strong>.
              <br />
              Hành động này <strong className="text-red-500">không thể hoàn tác</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl gap-1.5"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <><div className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Đang xử lý...</>
              ) : (
                <><IconTrash className="size-3.5" /> Xóa vĩnh viễn</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Stat card sub-component ──
type StatCardProps = {
  label: string
  value: string
  subValue?: string
  color: "red" | "amber" | "green" | "blue" | "purple" | "default"
  icon: React.ReactNode
  small?: boolean
}

const colorMap = {
  red: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-600 dark:text-red-400", icon: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400", icon: "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400" },
  green: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400", icon: "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400" },
  blue: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-600 dark:text-blue-400", icon: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400" },
  purple: { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-600 dark:text-violet-400", icon: "bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400" },
  default: { bg: "bg-muted/30", text: "text-foreground", icon: "bg-muted text-muted-foreground" },
}

function StatCard({ label, value, subValue, color, icon, small }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={`rounded border p-3.5 flex items-center gap-3 ${c.bg}`}>
      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider leading-none mb-1">{label}</p>
        <p className={`font-bold tabular-nums truncate leading-tight ${small ? "text-sm" : "text-lg"} ${c.text}`}>
          {value}
        </p>
        {subValue && <p className="text-[10px] text-muted-foreground mt-0.5">{subValue}</p>}
      </div>
    </div>
  )
}
