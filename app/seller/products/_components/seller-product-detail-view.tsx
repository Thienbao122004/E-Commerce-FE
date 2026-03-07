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
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
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

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v)

const fmtDate = (ts: string) =>
  new Date(ts).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const statusMap: Record<number, { label: string; cls: string }> = {
  [ProductStatus.Draft]: {
    label: "Nháp",
    cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  [ProductStatus.Active]: {
    label: "Đang bán",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  },
  [ProductStatus.Hidden]: {
    label: "Đã ẩn",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
  [ProductStatus.Deleted]: {
    label: "Đã xóa",
    cls: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
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
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-[380px] rounded-xl" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />
      </div>
    </div>
  )
}

export function SellerProductDetailView({ productId, onBack }: Props) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

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

  const handlePreview = async (url: string) => {
    setPreviewUrl(url)
    setPreviewOpen(true)
  }

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

  return (
    <>
        <div className="flex flex-1 flex-col gap-3 p-3 lg:gap-4 lg:p-4 pb-24 md:pb-4 relative">
          
          {/* ---------- Header ---------- */}
          <div className="flex items-center justify-between gap-3 bg-card p-2.5 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 hover:bg-muted"
                onClick={onBack}
              >
                <IconArrowLeft className="size-4" />
              </Button>
              <div className="min-w-0 flex items-center gap-2 mt-0.5">
                <h1 className="text-base sm:text-lg font-bold tracking-tight truncate leading-none">
                  {loading ? "Đang tải..." : product?.name ?? "Chi tiết sản phẩm"}
                </h1>
                {!loading && st && (
                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-4 border border-border/40 ${st.cls}`}>
                    {st.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* ---------- Body ---------- */}
          {loading ? (
            <DetailSkeleton />
          ) : product ? (
            <>
              <div className="grid gap-4 lg:grid-cols-2 items-start">
                
                {/* ====== COL LEFT (50%) - Images ====== */}
                <div className="flex flex-col gap-4">
                  <Card className="shadow-sm">
                    <CardHeader className="py-2.5 px-4 bg-muted/30 border-b flex flex-row items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <IconPhoto className="size-4 text-primary" />
                        Hình ảnh sản phẩm
                      </CardTitle>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] text-muted-foreground">{fileList.length} / 6 ảnh</span>
                         <Button 
                           size="sm" 
                           variant="secondary" 
                           onClick={() => fileInputRef.current?.click()}
                           className="h-6 text-[10px] px-2 gap-1 rounded-sm" 
                           disabled={fileList.length >= 6}
                         >
                           <IconPlus className="size-3" /> Thêm ảnh
                         </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                       {/* Preview area (Main Image) */}
                       <div className="relative aspect-[4/3] w-full bg-muted/10 rounded-lg overflow-hidden border mb-4">
                          {mainUrl ? (
                             <Image
                                src={mainUrl}
                                alt="Main Preview"
                                fill
                                className="object-contain"
                             />
                          ) : (
                             <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                               <IconPhoto className="size-10 opacity-20" />
                               <span className="text-xs">Chưa có hình ảnh nào</span>
                             </div>
                          )}
                          {mainUrl && (
                            <button 
                              className="absolute top-2 right-2 bg-background/80 hover:bg-background backdrop-blur-md size-7 rounded-sm border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => setPreviewOpen(true)}
                              title="Phóng to"
                            >
                               <IconPhoto className="size-3.5" />
                            </button>
                          )}
                       </div>

                       {/* Thumbnails Grid */}
                       {fileList.length > 0 && (
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                             {fileList.map((file, idx) => (
                                <div 
                                  key={file.id} 
                                  className={`group relative aspect-square rounded-md overflow-hidden border bg-muted/20 ${idx === selectedImg ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'} cursor-pointer transition-all ${file.uploading ? 'opacity-50' : ''}`}
                                  onClick={() => setSelectedImg(idx)}
                                >
                                   {(file.url && !file.error) ? (
                                      <Image
                                        src={file.url}
                                        alt="Thumbnail"
                                        fill
                                        className="object-cover"
                                      />
                                   ) : (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        {file.uploading ? (
                                          <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
                                        ) : file.error ? (
                                          <span className="text-[10px] text-red-500 font-bold">LỖI</span>
                                        ) : null}
                                      </div>
                                   )}
                                   
                                   {/* Hover actions */}
                                   <div className="absolute inset-x-0 bottom-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center py-1 gap-2 backdrop-blur-sm">
                                      <button 
                                        className="text-white hover:text-red-400 p-0.5 transition-colors"
                                        title="Xóa ảnh"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newFiles = [...fileList];
                                          newFiles.splice(idx, 1);
                                          setFileList(newFiles);
                                          mark();
                                          if (selectedImg >= newFiles.length) setSelectedImg(Math.max(0, newFiles.length - 1));
                                        }}
                                      >
                                        <IconTrash className="size-3" />
                                      </button>
                                   </div>
                                   
                                   {/* Main badge */}
                                   {idx === 0 && (
                                     <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[8px] px-1 rounded-sm font-bold uppercase shadow-sm">
                                        Main
                                     </div>
                                   )}
                                </div>
                             ))}
                             
                             {/* Add more button inline if < 6 */}
                             {fileList.length > 0 && fileList.length < 6 && (
                                <div 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="relative aspect-square rounded-md border border-dashed overflow-hidden hover:border-foreground/30 transition-all bg-muted/10 hover:bg-muted/50 group cursor-pointer"
                                >
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-foreground">
                                    <IconPlus className="size-4 mb-0.5" />
                                    <span className="text-[9px] font-medium">Thêm</span>
                                  </div>
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
                        )}
                    </CardContent>
                  </Card>
                </div>

                {/* ====== COL RIGHT (50%) - Info + Meta + Variants ====== */}
                <div className="flex flex-col gap-4">
                  {/* 1. Core Info */}
                  <Card className="shadow-sm">
                    <CardHeader className="py-2.5 px-4 bg-muted/30 border-b">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <IconEdit className="size-4 text-primary" />
                        Thông tin cơ bản
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="ed-name" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <IconBox className="size-3.5" /> Tên sản phẩm <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="ed-name"
                          value={editName}
                          onChange={(e) => {
                            setEditName(e.target.value)
                            mark()
                          }}
                          className="h-9 text-sm font-medium bg-muted/20 focus-visible:bg-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="ed-price" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                            <IconReceipt2 className="size-3.5" /> Giá bán (VND) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="ed-price"
                            type="number"
                            min={0}
                            value={editPrice}
                            onChange={(e) => {
                              setEditPrice(e.target.value)
                              mark()
                            }}
                            className="h-9 text-sm font-semibold text-primary bg-muted/20 focus-visible:bg-transparent tabular-nums"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="ed-status" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                            <IconStatusChange className="size-3.5" /> Trạng thái hiển thị
                          </Label>
                          <Select
                            value={editStatus}
                            onValueChange={(v) => {
                              setEditStatus(v)
                              mark()
                            }}
                          >
                            <SelectTrigger id="ed-status" className="h-9 text-sm bg-muted/20 focus-visible:bg-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={String(ProductStatus.Active)}>Đang bán</SelectItem>
                              <SelectItem value={String(ProductStatus.Draft)}>Lưu nháp</SelectItem>
                              <SelectItem value={String(ProductStatus.Hidden)}>Đã ẩn</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="ed-desc" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <IconAlignLeft className="size-3.5" /> Mô tả sản phẩm
                        </Label>
                        <Textarea
                          id="ed-desc"
                          rows={6}
                          value={editDesc}
                          onChange={(e) => {
                            setEditDesc(e.target.value)
                            mark()
                          }}
                          placeholder="Nhập mô tả chi tiết sản phẩm..."
                          className="text-sm resize-y min-h-[120px] bg-muted/20 focus-visible:bg-transparent"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* 2. Metadata & Stats (Dense) */}
                  <div className="grid grid-cols-2 gap-4">
                     {/* Stats Card */}
                     <Card className="shadow-sm">
                       <CardContent className="p-3 bg-gradient-to-br from-card to-muted/20 flex flex-col h-full justify-center text-center">
                           <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1 tracking-wider">Tồn kho</p>
                           <p className={`text-2xl font-black tabular-nums ${
                             (product.totalStock ?? 0) === 0 ? "text-red-500" : (product.totalStock ?? 0) <= 10 ? "text-amber-500" : "text-foreground"
                           }`}>
                             {product.totalStock ?? 0}
                           </p>
                       </CardContent>
                     </Card>
                     
                     {/* Meta Card */}
                     <Card className="shadow-sm">
                        <CardContent className="p-3 flex flex-col gap-2 justify-center h-full text-[10px] sm:text-[11px] text-muted-foreground">
                           {product.categoryName && (
                             <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                               <span className="p-1 rounded bg-primary/10 text-primary shrink-0"><IconTag className="size-3" /></span>
                               <span className="font-semibold text-foreground truncate" title={product.categoryName}>{product.categoryName}</span>
                             </div>
                           )}
                           <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                             <span className="p-1 rounded bg-muted text-foreground shrink-0"><IconCalendar className="size-3" /></span>
                             <span className="font-medium truncate" title={`Tạo: ${fmtDate(product.createdAt)}`}>{fmtDate(product.createdAt)}</span>
                           </div>
                        </CardContent>
                     </Card>
                  </div>

                  {/* 3. Variants table */}
                  {(product.variants?.length ?? 0) > 0 ? (
                    <Card className="shadow-sm flex-1">
                      <CardHeader className="py-2.5 px-3 bg-muted/30 border-b flex flex-row items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <IconClipboard className="size-4 text-primary" />
                          Phân loại
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] tabular-nums bg-background">
                          {product.variants!.length} loại
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto max-h-[300px]">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-muted/10 z-10 backdrop-blur-sm">
                              <tr className="text-muted-foreground text-[10px] uppercase tracking-wider">
                                <th className="text-left py-2 px-3 font-semibold">Tên loại</th>
                                <th className="text-right py-2 px-3 font-semibold">Giá</th>
                                <th className="text-right py-2 px-3 font-semibold">Tồn</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y relative z-0">
                              {product.variants!.map((v) => (
                                <tr
                                  key={v.id}
                                  className="hover:bg-muted/30 transition-colors"
                                >
                                  <td className="py-2.5 px-3 font-medium text-[11px] max-w-[120px]">
                                    <div className="truncate" title={v.variantName}>{v.variantName}</div>
                                    {v.sku && (
                                      <div className="text-[9px] text-muted-foreground font-mono truncate" title={v.sku}>
                                        SKU: {v.sku}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-semibold text-primary tabular-nums text-[11px]">
                                    {v.price != null ? currency(v.price) : "—"}
                                  </td>
                                  <td className="py-2.5 px-3 text-right tabular-nums text-[11px]">
                                    <span
                                      className={`font-semibold inline-flex items-center justify-center min-w-[20px] rounded px-1 py-0.5 ${
                                        (v.stock ?? 0) === 0
                                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                          : (v.stock ?? 0) <= 10
                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                            : "bg-muted text-foreground"
                                      }`}
                                    >
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
                    <Card className="shadow-sm flex-1 flex flex-col items-center justify-center p-6 text-muted-foreground border-dashed">
                        <IconClipboard className="size-8 mb-2 opacity-20" />
                        <p className="text-xs">Không có phân loại</p>
                    </Card>
                  )}
                </div>
              </div>

              {/* ACTION STICKY BOTTOM BAR */}
              <div className="fixed sm:sticky bottom-0 left-0 right-0 md:bottom-4 px-4 py-3 bg-background/95 backdrop-blur-md border-t sm:border sm:rounded-lg shadow-[0_-4px_10px_rgba(0,0,0,0.05)] sm:shadow-lg flex items-center justify-between z-40 w-full lg:col-span-2 group/actions">
                  <Button 
                    variant="ghost" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs sm:text-sm h-9 px-2 sm:px-4" 
                    onClick={() => setShowDeleteDialog(true)} 
                    disabled={deleting}
                  >
                    <IconTrash className="size-4 sm:mr-1.5" />
                    <span className="hidden sm:inline font-semibold">Xóa sản phẩm này</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-9">
                      <IconRefresh className="size-4 sm:mr-1.5" /> 
                      <span className="hidden sm:inline">Tải lại</span>
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={!dirty || saving} className="h-9 min-w-[120px] shadow-sm tracking-wide">
                      <IconEdit className="size-4 mr-1.5" /> 
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </div>
              </div>
            </>
          ) : null}
        </div>

      {/* Image preview overlay */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl || mainUrl}
              alt="preview"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
            />
            <button
              className="absolute top-2 right-2 md:top-8 md:right-8 size-10 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 rounded-full shadow-lg flex items-center justify-center text-xl font-bold transition-all"
              onClick={() => setPreviewOpen(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(v) => {
          if (!v) setShowDeleteDialog(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">Xác nhận xóa</DialogTitle>
            <DialogDescription className="pt-2">
              Bạn đang chuẩn bị xóa sản phẩm{" "}
              <strong className="text-foreground">&ldquo;{product?.name}&rdquo;</strong>.<br/>
              Hành động này <strong className="text-red-500">không thể hoàn tác</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-1.5"
            >
              <IconTrash className="size-4" />
              {deleting ? "Đang xử lý..." : "Xóa vĩnh viễn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
