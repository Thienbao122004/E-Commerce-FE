/* eslint-disable prefer-const */
"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
  IconCalendar,
  IconEdit,
  IconRefresh,
  IconTrash,
  IconPhoto,
  IconClipboard,
  IconReceipt2,
  IconAlignLeft,
  IconPlus,
  IconPackage,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconPencil,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"

import {
  fetchMyProductById,
  updateMyProduct,
  deleteMyProduct,
  addMyProductVariant,
  updateMyInventory,
  updateMyVariant,
  fetchSellerMaterials,
  fetchSellerTags,
  fetchMyShop,
} from "@/services/seller-dashboard"
import { ProductStatus } from "@/types/seller-dashboard"
import type {
  SellerProductDetail,
  SellerProductVariant,
  SellerProductVariantPayload,
  SellerShopResponse,
  SellerShopInfo,
} from "@/types/seller-dashboard"
import { ShopPrimaryCategoryBanner } from "@/components/seller/shop-primary-category-banner"
import {
  getCategoryTree,
  type StorefrontCategory,
  type StorefrontCategoryTreeResponse,
} from "@/services/storefront-categories"
import type { MaterialDto } from "@/types/material"
import type { Tag } from "@/types/tag"
import { supabase } from "@/lib/supabase"
import { formatDateTimeVN as fmtDate, formatPriceVND as currency, formatNumberVN } from "@/lib/formatters"

function findCategorySubtree(
  tree: StorefrontCategory[],
  rootId: number,
): StorefrontCategory[] | null {
  for (const n of tree) {
    if (n.id === rootId) return [n]
    if (n.subcategories?.length) {
      const sub = findCategorySubtree(n.subcategories, rootId)
      if (sub) return sub
    }
  }
  return null
}

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
    <div className="grid gap-4 lg:grid-cols-[420px_1fr] xl:grid-cols-[460px_1fr] items-start">
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

function parseAttributesStr(attrStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  const leftoverSegments: string[] = [];
  
  if (attrStr.startsWith('{') || attrStr.startsWith('[')) {
     try {
       const parsed = JSON.parse(attrStr);
       return typeof parsed === 'object' && parsed !== null ? parsed : { "Thuộc tính": attrStr };
     } catch {
       return { "Thuộc tính": attrStr };
     }
  }

  const segments = attrStr.split(',');
  for (const seg of segments) {
     let text = seg.trim();
     if (!text) continue;
     
     const firstColon = text.indexOf(':');
     if (firstColon > 0) {
        let k = text.substring(0, firstColon).trim();
        let v = text.substring(firstColon + 1).trim();
        
        if (k.toLowerCase() === 'size') {
           k = 'Size';
           v = v.toUpperCase();
        } else if (k.toLowerCase() === 'màu' || k.toLowerCase() === 'màu sắc') {
           k = 'Màu';
           v = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
        } else {
           k = k.charAt(0).toUpperCase() + k.slice(1);
        }

        if (k) {
           if (result[k]) result[k] += `, ${v}`;
           else result[k] = v;
        } else {
           leftoverSegments.push(text);
        }
     } else {
        const lower = text.toLowerCase();
        if (lower.startsWith('size ') || lower.startsWith('size')) {
           const val = text.substring(4).trim();
           if (val) {
             const finalVal = val.toUpperCase();
             if (result['Size']) result['Size'] += `, ${finalVal}`;
             else result['Size'] = finalVal;
             continue;
           }
        } else if (lower.startsWith('màu ') || lower.startsWith('màu')) {
           const idx = lower.startsWith('màu sắc') ? 7 : 3;
           const val = text.substring(idx).trim();
           if (val) {
             const finalVal = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
             if (result['Màu']) result['Màu'] += `, ${finalVal}`;
             else result['Màu'] = finalVal;
             continue;
           }
        }
        
        const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1);
        leftoverSegments.push(capitalizedText);
     }
  }
  
  if (leftoverSegments.length > 0) {
     result["Thuộc tính"] = leftoverSegments.join(', ');
  }
  
  return result;
}

export function SellerProductDetailView({ productId, onBack }: Props) {
  const { resolvedTheme } = useTheme()

  const [product, setProduct] = React.useState<SellerProductDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [descSheetOpen, setDescSheetOpen] = React.useState(false)
  const [addVariantOpen, setAddVariantOpen] = React.useState(false)
  const [addVariantLoading, setAddVariantLoading] = React.useState(false)
  const [vName, setVName] = React.useState("")
  const [vSku, setVSku] = React.useState("")
  const [vPrice, setVPrice] = React.useState("")
  const [vQty, setVQty] = React.useState("0")
  const [vAttrs, setVAttrs] = React.useState("")
  const [selectedImg, setSelectedImg] = React.useState(0)

  const [editName, setEditName] = React.useState("")
  const [editDesc, setEditDesc] = React.useState("")
  const [editPrice, setEditPrice] = React.useState("")
  const [editStatus, setEditStatus] = React.useState("")
  const [editCategoryId, setEditCategoryId] = React.useState<number | null>(null)
  const [editTagIds, setEditTagIds] = React.useState<number[]>([])
  const [editMaterialIds, setEditMaterialIds] = React.useState<string[]>([])
  const [dirty, setDirty] = React.useState(false)

  const [myShop, setMyShop] = React.useState<SellerShopInfo | null>(null)

  const [fileList, setFileList] = React.useState<NativeImageFile[]>([])
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState("")

  // ── Modals & Pickers ──────────────────────────────────────────────────────
  const [catDialogOpen, setCatDialogOpen] = React.useState(false)
  const [categoriesList, setCategoriesList] = React.useState<(StorefrontCategory & { level: number; pathLabel: string })[]>([])
  
  const [tagDialogOpen, setTagDialogOpen] = React.useState(false)
  const [platformTags, setPlatformTags] = React.useState<Tag[]>([])
  
  const [matDialogOpen, setMatDialogOpen] = React.useState(false)
  const [platformMaterials, setPlatformMaterials] = React.useState<MaterialDto[]>([])

  const [attrLoading, setAttrLoading] = React.useState(false)

  // ── Inline stock editing ──────────────────────────────────────────────────
  const [editingStockVarId, setEditingStockVarId] = React.useState<string | null>(null)
  const [editingStockVal, setEditingStockVal] = React.useState("")
  const [savingStockId, setSavingStockId] = React.useState<string | null>(null)
  // For products without variants:
  const [editingBaseStock, setEditingBaseStock] = React.useState(false)
  const [editingBaseStockVal, setEditingBaseStockVal] = React.useState("")
  const [savingBaseStock, setSavingBaseStock] = React.useState(false)

  // ── Edit variant dialog ───────────────────────────────────────────────────
  const [editVariant, setEditVariant] = React.useState<SellerProductVariant | null>(null)
  const [evName, setEvName] = React.useState("")
  const [evSku, setEvSku] = React.useState("")
  const [evPrice, setEvPrice] = React.useState("")
  const [evAttrs, setEvAttrs] = React.useState("")
  const [evActive, setEvActive] = React.useState(true)
  const [savingVariant, setSavingVariant] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [res, catTreeRes, shopRes, tagsRes, matsRes] = await Promise.all([
        fetchMyProductById(productId),
        getCategoryTree().catch(
          (): StorefrontCategoryTreeResponse => ({ success: false, tree: [] })
        ),
        fetchMyShop().catch((): SellerShopResponse => ({ success: false })),
        fetchSellerTags(1, 100).catch(()=>({ success: false, tags: [], totalCount: 0, page: 1, pageSize: 100 })),
        fetchSellerMaterials(1, 50).catch(()=>({ success: false, materials: [], totalCount: 0, page: 1, pageSize: 50 }))
      ])

      if (shopRes.success && shopRes.data) {
        setMyShop(shopRes.data)
      } else {
        setMyShop(null)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const flatten = (arr: any[], level = 1): (StorefrontCategory & { level: number; pathLabel: string })[] => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return arr.reduce((acc: any[], cat: any) => {
              const flatCat = { ...cat, level, pathLabel: "- ".repeat(level-1) + cat.name }
              const kids = cat.subcategories ?? cat.children ?? []
              return acc.concat(flatCat, flatten(kids, level + 1))
          }, [])
      }
      if (catTreeRes.success && catTreeRes.tree?.length) {
        const fullTree = catTreeRes.tree
        const rootId =
          shopRes.success && shopRes.data?.primaryCategoryId != null
            ? Number(shopRes.data.primaryCategoryId)
            : null
        if (rootId != null) {
          const sub = findCategorySubtree(fullTree, rootId)
          if (sub?.length) {
            setCategoriesList(flatten(sub))
          } else {
            setCategoriesList(flatten(fullTree))
            toast.error(
              "Không tìm thấy danh mục ngành hàng đã đăng ký. Vui lòng liên hệ quản trị viên.",
            )
          }
        } else {
          setCategoriesList(flatten(fullTree))
        }
      }
      if (tagsRes.success && tagsRes.tags) setPlatformTags(tagsRes.tags)
      if (matsRes.success && matsRes.materials) setPlatformMaterials(matsRes.materials)

      if (res.success && res.data) {
        const p = res.data
        setProduct(p)
        setEditName(p.name)
        setEditDesc(p.description ?? "")
        setEditPrice(String(p.basePrice))
        setEditStatus(String(p.status))
        setEditCategoryId(p.categoryId ?? null)
        setEditTagIds(p.tagIds ?? [])
        setEditMaterialIds(p.materialIds ?? [])
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
      setMyShop(null)
      toast.error(err instanceof Error ? err.message : "Lỗi tải sản phẩm")
      onBack()
    } finally {
      setLoading(false)
    }
  }, [productId, onBack])

  const openCategoryPicker = () => setCatDialogOpen(true)
  const openTagPicker = () => setTagDialogOpen(true)
  const openMatPicker = () => setMatDialogOpen(true)

  React.useEffect(() => {
    load()
  }, [load])

  React.useEffect(() => {
    if (!addVariantOpen) return
    setVName("")
    setVSku("")
    setVPrice("")
    setVQty("0")
    setVAttrs("")
  }, [addVariantOpen])

  const handleSaveVariantStock = async (variantId: string) => {
    const qty = parseInt(editingStockVal, 10)
    if (!Number.isFinite(qty) || qty < 0) { toast.error("Số lượng không hợp lệ"); return }
    setSavingStockId(variantId)
    try {
      const res = await updateMyInventory(productId, { variantId, quantity: qty })
      if (!res.success) throw new Error(res.message ?? "Lỗi cập nhật tồn kho")
      setProduct(prev => {
        if (!prev) return prev
        const newVariants = prev.variants?.map(v => v.id === variantId ? { ...v, stock: qty } : v) ?? null
        const newTotal = newVariants?.reduce((s, v) => s + (v.stock ?? 0), 0) ?? 0
        return { ...prev, variants: newVariants, totalStock: newTotal }
      })
      toast.success("Đã cập nhật tồn kho")
      setEditingStockVarId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi cập nhật tồn kho")
    } finally {
      setSavingStockId(null)
    }
  }

  const handleSaveBaseStock = async () => {
    const qty = parseInt(editingBaseStockVal, 10)
    if (!Number.isFinite(qty) || qty < 0) { toast.error("Số lượng không hợp lệ"); return }
    setSavingBaseStock(true)
    try {
      const res = await updateMyInventory(productId, { quantity: qty })
      if (!res.success) throw new Error(res.message ?? "Lỗi cập nhật tồn kho")
      setProduct(prev => prev ? { ...prev, totalStock: qty } : prev)
      toast.success("Đã cập nhật tồn kho")
      setEditingBaseStock(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi cập nhật tồn kho")
    } finally {
      setSavingBaseStock(false)
    }
  }

  const openEditVariant = (v: SellerProductVariant) => {
    setEditVariant(v)
    setEvName(v.variantName)
    setEvSku(v.sku ?? "")
    setEvPrice(v.price != null ? String(v.price) : "")
    setEvActive(v.isActive)
    
    if (v.attributes) {
      const parsed = parseAttributesStr(v.attributes)
      const formatted = Object.entries(parsed).map(([k, val]) => `${k}: ${val}`).join(", ")
      setEvAttrs(formatted)
    } else {
      setEvAttrs("")
    }
  }

  const handleUpdateVariant = async () => {
    if (!editVariant) return
    const name = evName.trim()
    if (!name) { toast.error("Tên biến thể không được trống"); return }
    setSavingVariant(true)
    try {
      const price = evPrice.trim() ? Number(evPrice) : null
      
      let finalAttrsRaw = evAttrs.trim() || undefined
      let finalAttrsStr: string | null = null
      const parsedUser = finalAttrsRaw ? parseAttributesStr(finalAttrsRaw) : parseAttributesStr(name)
      if (Object.keys(parsedUser).length > 0) finalAttrsStr = JSON.stringify(parsedUser)

      const res = await updateMyVariant(productId, editVariant.id, {
        variantName: name,
        sku: evSku.trim() || null,
        price,
        attributes: finalAttrsStr,
        isActive: evActive,
      })
      if (!res.success) throw new Error(res.message ?? "Lỗi cập nhật biến thể")
      setProduct(prev => {
        if (!prev) return prev
        return {
          ...prev,
          variants: prev.variants?.map(v =>
            v.id === editVariant.id
              ? { ...v, variantName: name, sku: evSku.trim() || null, price: price, attributes: finalAttrsStr, isActive: evActive }
              : v
          ) ?? null
        }
      })
      toast.success("Đã cập nhật biến thể")
      setEditVariant(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi cập nhật biến thể")
    } finally {
      setSavingVariant(false)
    }
  }

  const handleAddVariant = async () => {
    if (!product) return
    const name = vName.trim()
    if (!name) {
      toast.error("Nhập tên biến thể")
      return
    }
    const qty = Math.floor(Number(vQty))
    if (!Number.isFinite(qty) || qty < 0) {
      toast.error("Số lượng tồn không hợp lệ")
      return
    }
    const priceStr = vPrice.trim()
    let priceNum: number | undefined
    if (priceStr) {
      priceNum = Number(priceStr)
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        toast.error("Giá biến thể phải lớn hơn 0")
        return
      }
    }

    let finalAttrsRaw = vAttrs.trim() || undefined
    let finalAttrsStr: string | undefined = undefined
    const parsedUser = finalAttrsRaw ? parseAttributesStr(finalAttrsRaw) : parseAttributesStr(name)
    if (Object.keys(parsedUser).length > 0) finalAttrsStr = JSON.stringify(parsedUser)

    const payload: SellerProductVariantPayload = {
      variantName: name,
      quantity: qty,
      sku: vSku.trim() || undefined,
      attributes: finalAttrsStr,
    }
    if (priceNum !== undefined) payload.price = priceNum

    setAddVariantLoading(true)
    try {
      const res = await addMyProductVariant(product.id, payload)
      if (res.success) {
        toast.success(res.message ?? "Đã thêm biến thể")
        setAddVariantOpen(false)
        await load()
      } else {
        toast.error(res.message ?? "Không thêm được biến thể")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi thêm biến thể")
    } finally {
      setAddVariantLoading(false)
    }
  }

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
        categoryId: editCategoryId ?? undefined,
        tagIds: editTagIds,
        materialIds: editMaterialIds,
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

  const categoryChain = React.useMemo(() => {
    const id = editCategoryId ?? product?.categoryId ?? null
    if (id == null) {
      return { parentName: null as string | null, currentName: product?.categoryName ?? null }
    }
    const cat = categoriesList.find((c) => c.id === id)
    const currentName = cat?.name ?? product?.categoryName ?? null
    if (!cat?.parentId) return { parentName: null, currentName }
    const par = categoriesList.find((c) => c.id === cat.parentId)
    return { parentName: par?.name ?? null, currentName }
  }, [editCategoryId, product?.categoryId, product?.categoryName, categoriesList])

  return (
    <>
      <div className="flex flex-1 flex-col gap-5 p-4 lg:p-6 pb-28 md:pb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/seller/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/seller/products">Sản phẩm</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {loading
                  ? "Chi tiết sản phẩm"
                  : product?.productCode
                    ? `#${product.productCode}`
                    : "Chi tiết sản phẩm"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <ShopPrimaryCategoryBanner shop={myShop} loading={loading} />

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
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
                  {categoryChain.currentName && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="text-foreground/70">
                        {categoryChain.parentName ? (
                          <>
                            <span>{categoryChain.parentName}</span>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span>{categoryChain.currentName}</span>
                          </>
                        ) : (
                          categoryChain.currentName
                        )}
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Desktop quick actions */}
          {!loading && product && (
            <div className="hidden md:flex items-center gap-2 shrink-0">
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
          <div className="grid gap-4 lg:grid-cols-[420px_1fr] xl:grid-cols-[460px_1fr] items-start">
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
                {!(product.variants?.length) ? (
                  <StockEditCard
                    stockLevel={stockLevel}
                    editing={editingBaseStock}
                    editVal={editingBaseStockVal}
                    saving={savingBaseStock}
                    onStartEdit={() => { setEditingBaseStockVal(String(stockLevel)); setEditingBaseStock(true) }}
                    onChangeVal={setEditingBaseStockVal}
                    onSave={handleSaveBaseStock}
                    onCancel={() => setEditingBaseStock(false)}
                  />
                ) : (
                  <StatCard
                    label="Tồn kho"
                    value={String(stockLevel)}
                    color={stockLevel === 0 ? "red" : stockLevel <= 10 ? "amber" : "green"}
                    icon={<IconPackage className="size-4" />}
                  />
                )}
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
                {!(product.variants?.length) ? (
                  <StockEditCard
                    stockLevel={stockLevel}
                    editing={editingBaseStock}
                    editVal={editingBaseStockVal}
                    saving={savingBaseStock}
                    onStartEdit={() => { setEditingBaseStockVal(String(stockLevel)); setEditingBaseStock(true) }}
                    onChangeVal={setEditingBaseStockVal}
                    onSave={handleSaveBaseStock}
                    onCancel={() => setEditingBaseStock(false)}
                  />
                ) : (
                  <StatCard
                    label="Tồn kho"
                    value={String(stockLevel)}
                    color={stockLevel === 0 ? "red" : stockLevel <= 10 ? "amber" : "green"}
                    icon={<IconPackage className="size-4" />}
                  />
                )}
                <StatCard
                  label="Phân loại"
                  value={String(product.variants?.length ?? 0)}
                  color="blue"
                  icon={<IconClipboard className="size-4" />}
                />
                <StatCard
                  label="Ngày tạo"
                  value={fmtDate(product.createdAt).split(",")[0]}
                  color="default"
                  icon={<IconCalendar className="size-4" />}
                  small
                />
              </div>

              <Card className="rounded shadow-sm overflow-hidden">
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ed-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
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
                        Giá bán (VND) <span className="text-red-500 normal-case font-normal tracking-normal">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="ed-price"
                          inputMode="numeric"
                          value={editPrice === "" ? "" : formatNumberVN(Number(editPrice))}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "")
                            setEditPrice(digits)
                            mark()
                          }}
                          className="h-10 text-sm font-semibold text-primary rounded-xl bg-muted/20 border-muted focus-visible:bg-background tabular-nums pr-8"
                          placeholder="0"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">₫</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ed-status" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
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

                  {/* Categorization block
                  <div className="space-y-3 pt-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <IconBox className="size-3.5" /> Phân loại mở rộng
                    </Label>
                    
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div 
                        onClick={openCategoryPicker}
                        className="rounded-xl border hover:border-primary/50 transition-colors p-3 bg-muted/10 cursor-pointer flex flex-col gap-1.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground">Danh mục</p>
                          <IconEdit className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        {editCategoryId ? (() => {
                          const cat = categoriesList.find(c => c.id === editCategoryId)
                          return cat ? (
                             <p className="text-sm font-semibold truncate text-primary">{cat.pathLabel || cat.name}</p>
                          ) : (
                             <p className="text-sm italic text-muted-foreground">Đang tải...</p>
                          )
                        })() : (
                          <p className="text-sm italic text-muted-foreground">Chưa chọn</p>
                        )}
                      </div>

                      <div 
                        onClick={openTagPicker}
                        className="rounded-xl border hover:border-primary/50 transition-colors p-3 bg-muted/10 cursor-pointer flex flex-col gap-1.5 group sm:col-span-1"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground">Thẻ (Tags)</p>
                          <IconEdit className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {editTagIds.length === 0 ? (
                            <p className="text-sm italic text-muted-foreground">Chưa chọn</p>
                          ) : (
                            editTagIds.slice(0, 2).map((tid) => {
                              const tg = platformTags.find(t => t.id === tid)
                              return (
                                <span key={tid} className="inline-block px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-md font-medium truncate max-w-full">
                                  #{tg?.name || tid}
                                </span>
                              )
                            })
                          )}
                          {editTagIds.length > 2 && (
                            <span className="inline-block px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-md font-medium">+{editTagIds.length - 2}</span>
                          )}
                        </div>
                      </div>

                      <div 
                        onClick={openMatPicker}
                        className="rounded-xl border hover:border-primary/50 transition-colors p-3 bg-muted/10 cursor-pointer flex flex-col gap-1.5 group sm:col-span-1"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground">Chất liệu</p>
                          <IconEdit className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {editMaterialIds.length === 0 ? (
                            <p className="text-sm italic text-muted-foreground">Chưa chọn</p>
                          ) : (
                            editMaterialIds.slice(0, 2).map((mid) => {
                              const mat = platformMaterials.find(m => m.id === mid)
                              return (
                                <span key={mid} className="inline-block px-1.5 py-0.5 border border-muted-foreground/20 text-foreground text-[10px] rounded-md font-medium truncate max-w-full">
                                  {mat?.name || "Đang tải"}
                                </span>
                              )
                            })
                          )}
                          {editMaterialIds.length > 2 && (
                            <span className="inline-block px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-md font-medium">+{editMaterialIds.length - 2}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div> */}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <IconAlignLeft className="size-3.5" />
                      Mô tả sản phẩm
                    </Label>
                    <button
                      type="button"
                      onClick={() => setDescSheetOpen(true)}
                      className="w-full text-left rounded-xl border bg-muted/20 border-muted hover:border-primary/50 transition-colors px-3 py-2.5 min-h-[80px] group"
                    >
                      {editDesc ? (
                        <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">{editDesc}</p>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">Nhấn để nhập mô tả sản phẩm...</p>
                      )}
                      <span className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-primary transition-colors">
                        <IconEdit className="size-3" /> Nhấn để chỉnh sửa
                      </span>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {(product.variants?.length ?? 0) > 0 ? (
                <Card className="rounded shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/20 border-b flex flex-row items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-sm font-semibold flex items-center">
                      Phân loại sản phẩm
                    </CardTitle>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 rounded-lg text-xs"
                        onClick={() => setAddVariantOpen(true)}
                      >
                        <IconPlus className="size-3.5" />
                        Thêm biến thể
                      </Button>
                      <Badge variant="secondary" className="rounded-lg tabular-nums text-[11px] font-semibold">
                        {product.variants!.length} loại
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[320px]">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold border-b">
                            <th className="text-left py-2.5 px-5">Tên loại</th>
                            <th className="text-left py-2.5 px-5 hidden sm:table-cell">SKU</th>
                            <th className="text-left py-2.5 px-5 hidden md:table-cell">Thuộc tính</th>
                            <th className="text-right py-2.5 px-5">Giá</th>
                            <th className="text-right py-2.5 px-5">Tồn kho</th>
                            <th className="w-10" />
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {product.variants!.map((v) => {
                            const isEditing = editingStockVarId === v.id
                            const isSaving = savingStockId === v.id
                            return (
                              <tr key={v.id} className="hover:bg-muted/20 transition-colors group">
                                <td className="py-3 px-5 max-w-[160px] align-middle">
                                  <div className="font-semibold text-[12px] truncate" title={v.variantName}>
                                    {v.variantName}
                                  </div>
                                </td>
                                <td className="py-3 px-5 hidden sm:table-cell align-middle whitespace-nowrap">
                                  {v.sku ? (
                                    <span className="text-[11px] font-mono bg-muted/60 px-1.5 py-0.5 rounded text-muted-foreground">{v.sku}</span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground italic">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-5 hidden md:table-cell max-w-[140px] align-middle">
                                  {v.attributes ? (
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(parseAttributesStr(v.attributes)).map(([k, val]) => (
                                        <Badge key={k} variant="outline" className="text-[9px] px-1.5 py-0 shadow-none border-dashed bg-muted/40 uppercase font-semibold text-muted-foreground cursor-default transition-colors hover:text-primary hover:border-primary">
                                          {k}: {val}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground italic">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-5 text-right font-bold text-primary tabular-nums text-[12px] align-middle">
                                  {v.price != null ? (
                                    currency(v.price)
                                  ) : (
                                    <span className="text-muted-foreground font-medium" title="Sử dụng giá gốc">
                                      {currency(product.basePrice)}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {isEditing ? (
                                    <div className="flex items-center justify-end gap-1">
                                      <input
                                        type="number"
                                        min={0}
                                        value={editingStockVal}
                                        onChange={e => setEditingStockVal(e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === "Enter") handleSaveVariantStock(v.id)
                                          if (e.key === "Escape") setEditingStockVarId(null)
                                        }}
                                        autoFocus
                                        className="w-16 h-7 rounded-lg border bg-background text-right text-[12px] font-bold px-2 tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                                      />
                                      <button
                                        onClick={() => handleSaveVariantStock(v.id)}
                                        disabled={isSaving}
                                        className="size-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 disabled:opacity-60"
                                        title="Lưu"
                                      >
                                        {isSaving
                                          ? <div className="size-3 border border-white border-t-transparent rounded-full animate-spin" />
                                          : <IconCheck className="size-3.5" />}
                                      </button>
                                      <button
                                        onClick={() => setEditingStockVarId(null)}
                                        disabled={isSaving}
                                        className="size-7 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center shrink-0"
                                        title="Huỷ"
                                      >
                                        <IconX className="size-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span className={`inline-flex items-center justify-center min-w-[32px] h-6 rounded-lg px-2 text-[11px] font-bold tabular-nums ${
                                        (v.stock ?? 0) === 0
                                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                          : (v.stock ?? 0) <= 10
                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                      }`}>
                                        {v.stock ?? 0}
                                      </span>
                                      <button
                                        onClick={() => { setEditingStockVarId(v.id); setEditingStockVal(String(v.stock ?? 0)) }}
                                        className="size-6 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground flex items-center justify-center transition-opacity"
                                        title="Chỉnh tồn kho"
                                      >
                                        <IconPencil className="size-3" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                                {/* Edit variant button */}
                                <td className="py-2 pr-3 text-center">
                                  <button
                                    onClick={() => openEditVariant(v)}
                                    className="size-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-primary flex items-center justify-center transition-opacity mx-auto"
                                    title="Chỉnh sửa biến thể"
                                  >
                                    <IconEdit className="size-3.5" />
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-sm border-dashed rounded">
                  <CardContent className="py-10 flex flex-col items-center gap-4 text-muted-foreground">
                    <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <IconClipboard className="size-6 opacity-30" />
                    </div>
                    <p className="text-sm font-medium opacity-50 text-center px-4">
                      Sản phẩm không có phân loại
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1.5 rounded-xl"
                      onClick={() => setAddVariantOpen(true)}
                    >
                      <IconPlus className="size-4" />
                      Thêm biến thể
                    </Button>
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

      {/* ── Edit variant dialog ── */}
      <Dialog open={!!editVariant} onOpenChange={(open) => { if (!open) setEditVariant(null) }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa biến thể</DialogTitle>
            <DialogDescription>Cập nhật thông tin phân loại sản phẩm.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="ev-name" className="text-xs">Tên biến thể *</Label>
              <Input
                id="ev-name"
                value={evName}
                onChange={e => setEvName(e.target.value)}
                placeholder="Ví dụ: Đỏ — M"
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ev-sku" className="text-xs">SKU</Label>
                <Input
                  id="ev-sku"
                  value={evSku}
                  onChange={e => setEvSku(e.target.value)}
                  placeholder="Tùy chọn"
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ev-price" className="text-xs">Giá riêng (VND)</Label>
                <Input
                  id="ev-price"
                  type="number"
                  min={0}
                  value={evPrice}
                  onChange={e => setEvPrice(e.target.value)}
                  placeholder="Để trống = dùng giá gốc"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ev-attrs" className="text-xs">Thuộc tính (JSON hoặc text)</Label>
              <Input
                id="ev-attrs"
                value={evAttrs}
                onChange={e => setEvAttrs(e.target.value)}
                placeholder='Ví dụ: {"color":"red","size":"M"}'
                className="rounded-xl text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ev-active"
                checked={evActive}
                onChange={e => setEvActive(e.target.checked)}
                className="size-4 rounded"
              />
              <Label htmlFor="ev-active" className="text-sm font-normal cursor-pointer">
                Kích hoạt biến thể này
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditVariant(null)} disabled={savingVariant} className="rounded-xl">
              Huỷ
            </Button>
            <Button onClick={handleUpdateVariant} disabled={savingVariant} className="rounded-xl min-w-[100px]">
              {savingVariant
                ? <><div className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin mr-1.5" />Đang lưu...</>
                : <><IconCheck className="size-3.5 mr-1.5" />Lưu thay đổi</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addVariantOpen} onOpenChange={setAddVariantOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm biến thể</DialogTitle>
            <DialogDescription className="text-left space-y-2">
              <span>
                Nhập tên phân loại (ví dụ: Đỏ — M), SKU tùy chọn, giá riêng (để trống nếu dùng giá gốc), và số lượng tồn.
              </span>
              {!(product?.variants?.length) && (
                <span className="block text-amber-600 dark:text-amber-400 text-xs font-medium">
                  Lưu ý: khi thêm biến thể đầu tiên, tồn kho &quot;không phân loại&quot; trên hệ thống sẽ bị gỡ — hãy nhập đủ số lượng cho từng loại.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="add-v-name" className="text-xs">Tên biến thể *</Label>
              <Input
                id="add-v-name"
                value={vName}
                onChange={(e) => setVName(e.target.value)}
                placeholder="Ví dụ: Xanh — L"
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="add-v-sku" className="text-xs">SKU</Label>
                <Input
                  id="add-v-sku"
                  value={vSku}
                  onChange={(e) => setVSku(e.target.value)}
                  className="rounded-xl font-mono text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="add-v-price" className="text-xs">Giá (VND)</Label>
                <Input
                  id="add-v-price"
                  type="number"
                  min={0}
                  value={vPrice}
                  onChange={(e) => setVPrice(e.target.value)}
                  placeholder="Để trống"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="add-v-qty" className="text-xs">Tồn kho *</Label>
              <Input
                id="add-v-qty"
                type="number"
                min={0}
                value={vQty}
                onChange={(e) => setVQty(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="add-v-attrs" className="text-xs">Thuộc tính (tùy chọn)</Label>
              <Textarea
                id="add-v-attrs"
                value={vAttrs}
                onChange={(e) => setVAttrs(e.target.value)}
                placeholder="JSON hoặc mô tả ngắn…"
                rows={2}
                className="rounded-xl resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setAddVariantOpen(false)}
              disabled={addVariantLoading}
            >
              Hủy
            </Button>
            <Button type="button" className="rounded-xl gap-1.5" onClick={handleAddVariant} disabled={addVariantLoading}>
              {addVariantLoading ? (
                <>
                  <div className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Đang lưu…
                </>
              ) : (
                <>
                  <IconCheck className="size-3.5" />
                  Thêm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* === Category Picker Modal ===
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-5 pt-5 pb-2">
            <DialogTitle>Chọn danh mục</DialogTitle>
            <DialogDescription>
              Chọn một danh mục phù hợp nhất cho sản phẩm.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto px-5 pb-5">
            {attrLoading ? (
              <p className="text-sm text-muted-foreground p-4 text-center">Đang tải...</p>
            ) : (
              <div className="space-y-1">
                {categoriesList.map(c => {
                   const active = editCategoryId === c.id
                   return (
                     <button
                        key={c.id}
                        type="button"
                        onClick={() => { setEditCategoryId(c.id); mark(); setCatDialogOpen(false) }}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          active
                            ? "bg-primary/10 text-primary font-semibold"
                            : "hover:bg-muted font-medium text-foreground"
                        }`}
                      >
                        {c.pathLabel || c.name}
                      </button>
                   )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-5 pt-5 pb-2 border-b">
            <DialogTitle>Chọn thẻ (tags)</DialogTitle>
            <DialogDescription>
              Gắn nhãn để tăng độ hiển thị tìm kiếm.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto px-5 py-4 flex flex-wrap gap-2">
             {attrLoading ? (
                <p className="text-sm text-muted-foreground p-4 text-center">Đang tải...</p>
             ) : (
               platformTags.map(tag => {
                 const active = editTagIds.includes(tag.id)
                 return (
                   <button
                     key={tag.id}
                     onClick={() => {
                        setEditTagIds(prev => active ? prev.filter(x => x !== tag.id) : [...prev, tag.id])
                        mark()
                     }}
                     className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-all ${
                       active 
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "bg-white text-muted-foreground hover:bg-muted"
                     }`}
                   >
                     #{tag.name}
                     {active && <IconCheck className="size-3.5" />}
                   </button>
                 )
               })
             )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={matDialogOpen} onOpenChange={setMatDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-5 pt-5 pb-2 border-b">
            <DialogTitle>Chọn chất liệu</DialogTitle>
            <DialogDescription>
              Mô tả thành phần chất liệu cho sản phẩm.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto px-5 py-4 flex flex-wrap gap-2">
             {attrLoading ? (
                <p className="text-sm text-muted-foreground p-4 text-center">Đang tải...</p>
             ) : (
               platformMaterials.map(m => {
                 const active = editMaterialIds.includes(m.id)
                 return (
                   <button
                     key={m.id}
                     onClick={() => {
                        setEditMaterialIds(prev => active ? prev.filter(x => x !== m.id) : [...prev, m.id])
                        mark()
                     }}
                     className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-all ${
                       active 
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "bg-white text-muted-foreground hover:bg-muted"
                     }`}
                   >
                     {m.name}
                     {active && <IconCheck className="size-3.5" />}
                   </button>
                 )
               })
             )}
          </div>
        </DialogContent>
      </Dialog> */}

      {/* === Description Sheet === */}
      <Sheet open={descSheetOpen} onOpenChange={setDescSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-base">
              <IconAlignLeft className="size-4 text-muted-foreground" />
              Mô tả sản phẩm
            </SheetTitle>
            <SheetDescription className="text-xs">
              Nhập mô tả chi tiết — hỗ trợ xuống dòng, không giới hạn ký tự.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Textarea
              id="desc-sheet-textarea"
              value={editDesc}
              onChange={(e) => { setEditDesc(e.target.value); mark() }}
              placeholder="Nhập mô tả chi tiết sản phẩm: chất liệu, kích thước, hướng dẫn sử dụng..."
              className="text-sm resize-none h-full min-h-[400px] rounded-xl bg-muted/20 border-muted focus-visible:bg-background"
            />
          </div>

          <SheetFooter className="px-6 py-4 border-t flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDescSheetOpen(false)}
            >
              Đóng
            </Button>
            <Button
              className="flex-1 rounded-xl gap-1.5"
              onClick={() => setDescSheetOpen(false)}
            >
              <IconCheck className="size-3.5" />
              Xác nhận
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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

// ── Inline-editable stock card (no-variant products) ──
type StockEditCardProps = {
  stockLevel: number
  editing: boolean
  editVal: string
  saving: boolean
  onStartEdit: () => void
  onChangeVal: (v: string) => void
  onSave: () => void
  onCancel: () => void
}

function StockEditCard({ stockLevel, editing, editVal, saving, onStartEdit, onChangeVal, onSave, onCancel }: StockEditCardProps) {
  const color = stockLevel === 0 ? "red" : stockLevel <= 10 ? "amber" : "green"
  const c = colorMap[color]
  return (
    <div className={`rounded border p-3.5 flex items-center gap-3 ${c.bg}`}>
      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>
        <IconPackage className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider leading-none mb-1">Tồn kho</p>
        {editing ? (
          <div className="flex items-center gap-1 mt-1">
            <input
              type="number"
              min={0}
              value={editVal}
              onChange={e => onChangeVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel() }}
              autoFocus
              className="w-16 h-6 rounded-md border bg-background text-right text-sm font-bold px-1.5 tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={onSave}
              disabled={saving}
              className="size-6 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center disabled:opacity-60"
              title="Lưu"
            >
              {saving
                ? <div className="size-3 border border-white border-t-transparent rounded-full animate-spin" />
                : <IconCheck className="size-3" />}
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="size-6 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center"
              title="Huỷ"
            >
              <IconX className="size-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 group/stock">
            <p className={`font-bold tabular-nums text-lg leading-tight ${c.text}`}>{stockLevel}</p>
            <button
              onClick={onStartEdit}
              className="size-5 rounded opacity-0 group-hover/stock:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground flex items-center justify-center transition-opacity"
              title="Chỉnh tồn kho"
            >
              <IconPencil className="size-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
