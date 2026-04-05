"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  IconSparkles,
  IconUpload,
  IconX,
  IconCheck,
  IconPlus,
  IconLoader2,
  IconChevronRight,
  IconPhoto,
  IconTag,
  IconCategory,
  IconPalette,
  IconAlertCircle,
  IconPencil,
} from "@tabler/icons-react"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useSellerProducts } from "@/hooks/use-seller-products"
import {
  aiSuggestCategory,
  aiSuggestTags,
  aiSuggestMaterials,
  aiAnalyzeImage,
  aiSendFeedback,
} from "@/services/ai-seller"
import { getCategoryTree, type StorefrontCategory } from "@/services/storefront-categories"
import { supabase } from "@/lib/supabase"
import type {
  AnalyzeImageResponse,
  CategorySuggestion,
  TagSuggestion,
  MaterialSuggestion,
} from "@/services/ai-seller"

/** Danh mục làm phẳng từ cây — hiển thị đường dẫn cha › con (cấp 2, 3…). */
type ManualCategoryRow = {
  id: number
  name: string
  pathLabel: string
  level: number
}

function flattenCategoryTree(nodes: StorefrontCategory[], prefix = ""): ManualCategoryRow[] {
  const out: ManualCategoryRow[] = []
  for (const n of nodes) {
    const pathLabel = prefix ? `${prefix} › ${n.name}` : n.name
    out.push({ id: n.id, name: n.name, pathLabel, level: n.level })
    if (n.subcategories?.length) {
      out.push(...flattenCategoryTree(n.subcategories, pathLabel))
    }
  }
  return out
}

function SectionLabel({
  icon: Icon,
  children,
  badge,
}: {
  icon?: React.ElementType
  children: React.ReactNode
  badge?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3 text-muted-foreground" />}
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {children}
        </span>
      </div>
      {badge}
    </div>
  )
}

/** Model có thể trả 0–1 hoặc 0–100 */
function confidenceToPercent(score: number | undefined | null): number {
  if (score == null || !Number.isFinite(score)) return 0
  if (score > 1) return Math.min(100, Math.round(score))
  return Math.round(score * 100)
}

function ConfidenceDot({ score }: { score: number }) {
  const pct = confidenceToPercent(score)
  const color =
    pct >= 70
      ? "bg-emerald-500"
      : pct >= 40
        ? "bg-amber-400"
        : "bg-muted-foreground/40"
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block size-1.5 rounded-full ${color}`} />
      <span className="text-[10px] tabular-nums text-muted-foreground">
        {pct}%
      </span>
    </span>
  )
}

function confidenceText(score?: number) {
  if (score == null) return "--"
  return `${Math.round(score * 100)}%`
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isPersistableMaterialId(id: string): boolean {
  return UUID_RE.test(id)
}

/** Chọn được cả khi AI chỉ trả tên, không trả UUID */
function materialSelectionKey(m: MaterialSuggestion, idx: number): string {
  const id = m.materialId
  if (typeof id === "string" && id.trim().length > 0) return id.trim()
  const n = m.materialName?.trim()
  if (n) return `__name__:${n.toLowerCase()}`
  return `__idx__:${idx}`
}

type VariantDraftRow = {
  id: string
  variantName: string
  sku: string
  price: string
  quantity: string
  attributes: string
}

function newVariantDraftRow(): VariantDraftRow {
  return {
    id: Math.random().toString(36).slice(2),
    variantName: "",
    sku: "",
    price: "",
    quantity: "0",
    attributes: "",
  }
}

/** Ảnh dán URL https — giữ nguyên; ảnh chọn từ máy (blob:) — upload lên bucket product-images. */
async function resolveImageUrlForProduct(u: string): Promise<string> {
  const trimmed = u.trim()
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) return trimmed
  if (!trimmed.startsWith("blob:")) {
    throw new Error(`Không hỗ trợ định dạng ảnh: ${trimmed.slice(0, 24)}…`)
  }
  const res = await fetch(trimmed)
  const blob = await res.blob()
  if (!blob.type.startsWith("image/")) {
    throw new Error("File đã chọn không phải ảnh hợp lệ")
  }
  const sub = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg"
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${sub}`
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(path, blob, { cacheControl: "3600", upsert: false })
  if (error) throw error
  const { data: pub } = supabase.storage.from("product-images").getPublicUrl(data.path)
  return pub.publicUrl
}

export default function CreateProductPage() {
  const router = useRouter()
  const { create, actionLoading } = useSellerProducts()

  const [name, setName] = React.useState("")
  // price: hiển thị có dấu phẩy nghìn, priceRaw: số thực để submit
  const [price, setPrice] = React.useState("")
  const [priceRaw, setPriceRaw] = React.useState(0)
  const [sku, setSku] = React.useState("")
  const [baseStock, setBaseStock] = React.useState("0")
  const [useVariants, setUseVariants] = React.useState(false)
  const [variantRows, setVariantRows] = React.useState<VariantDraftRow[]>(() => [newVariantDraftRow()])
  const [description, setDescription] = React.useState("")
  const [imageUrls, setImageUrls] = React.useState<string[]>([])
  const [imageInput, setImageInput] = React.useState("")
  const [isDragging, setIsDragging] = React.useState(false)
  const [brokenUrls, setBrokenUrls] = React.useState<Set<string>>(new Set())
  const [uploadingImages, setUploadingImages] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [catLoading, setCatLoading] = React.useState(false)
  const [tagLoading, setTagLoading] = React.useState(false)
  const [imageAnalyzeLoading, setImageAnalyzeLoading] = React.useState(false)
  const [catError, setCatError] = React.useState(false)
  const [imageAnalyzeResult, setImageAnalyzeResult] = React.useState<AnalyzeImageResponse | null>(null)

  const [catSuggestions, setCatSuggestions] = React.useState<CategorySuggestion[]>([])
  const [tagSuggestions, setTagSuggestions] = React.useState<TagSuggestion[]>([])
  const [matSuggestions, setMatSuggestions] = React.useState<MaterialSuggestion[]>([])
  const [manualCategoryRows, setManualCategoryRows] = React.useState<ManualCategoryRow[]>([])
  const [manualCatQuery, setManualCatQuery] = React.useState("")
  const [debouncedManualCatQuery, setDebouncedManualCatQuery] = React.useState("")

  const [catLogId, setCatLogId] = React.useState<string | null>(null)
  const [tagLogId, setTagLogId] = React.useState<string | null>(null)

  const [selCategory, setSelCategory] = React.useState<CategorySuggestion | null>(null)
  const [selTagIds, setSelTagIds] = React.useState<number[]>([])
  const [selMatIds, setSelMatIds] = React.useState<string[]>([])
  const [customTags, setCustomTags] = React.useState<string[]>([])
  const [customTagInput, setCustomTagInput] = React.useState("")
  const [showCustomTag, setShowCustomTag] = React.useState(false)

  const hasInput = name.trim().length > 0 || description.trim().length > 0
  const categoryReqRef = React.useRef(0)
  const tagMatReqRef = React.useRef(0)
  const imageAnalyzeReqRef = React.useRef(0)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedManualCatQuery(manualCatQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [manualCatQuery])

  const manualCategoryOptions = React.useMemo(() => {
    const q = debouncedManualCatQuery.trim().toLowerCase()
    if (!q) return manualCategoryRows.slice(0, 12)
    return manualCategoryRows
      .filter(
        (c) =>
          c.pathLabel.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      )
      .slice(0, 24)
  }, [manualCategoryRows, debouncedManualCatQuery])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await getCategoryTree()
        if (!mounted || !res.success) return
        setManualCategoryRows(flattenCategoryTree(res.tree ?? []))
      } catch {
        
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const fetchTagsAndMaterials = React.useCallback(
    async (categoryId: number) => {
      if (!name.trim() && !description.trim()) return
      const reqId = ++tagMatReqRef.current
      setTagLoading(true)
      try {
        const [tagsRes, matsRes] = await Promise.all([
          aiSuggestTags({ title: name.trim(), description: description.trim(), categoryId }),
          aiSuggestMaterials({ title: name.trim(), description: description.trim(), categoryId }),
        ])
        if (reqId !== tagMatReqRef.current) return
        setTagSuggestions(tagsRes.suggestions ?? [])
        setMatSuggestions(matsRes.suggestions ?? [])
        if (tagsRes.logId) setTagLogId(tagsRes.logId)
      } catch {
      } finally {
        if (reqId !== tagMatReqRef.current) return
        setTagLoading(false)
      }
    },
    [name, description]
  )

  const blobUrlToDataUrl = React.useCallback(async (blobUrl: string) => {
    const res = await fetch(blobUrl)
    const blob = await res.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result ?? ""))
      reader.onerror = () => reject(new Error("Không thể đọc ảnh local"))
      reader.readAsDataURL(blob)
    })
    return dataUrl
  }, [])

  const normalizeAiImageUrls = React.useCallback(async () => {
    const normalized: string[] = []
    for (const u of imageUrls.slice(0, 3)) {
      if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:image/")) {
        normalized.push(u)
        continue
      }
      if (u.startsWith("blob:")) {
        try {
          const dataUrl = await blobUrlToDataUrl(u)
          if (dataUrl.startsWith("data:image/")) normalized.push(dataUrl)
        } catch {
        }
      }
    }
    return normalized
  }, [imageUrls, blobUrlToDataUrl])

  const runAiAnalysis = React.useCallback(async () => {
    if (!hasInput && imageUrls.length === 0) {
      toast.info("Nhập thông tin hoặc thêm ảnh trước khi phân tích AI")
      return
    }

    const catReqId = ++categoryReqRef.current
    const tagReqId = ++tagMatReqRef.current
    const imgReqId = ++imageAnalyzeReqRef.current

    setCatLoading(true)
    setTagLoading(true)
    setImageAnalyzeLoading(true)
    setCatError(false)

    try {
      const categoryResPromise = hasInput
        ? aiSuggestCategory({
            title: name.trim(),
            description: description.trim(),
            imageUrls: imageUrls.filter((u) => u.startsWith("http")),
          })
        : Promise.resolve(null)

      const [categoryRes, aiImageUrls] = await Promise.all([
        categoryResPromise,
        normalizeAiImageUrls(),
      ])

      if (
        catReqId !== categoryReqRef.current ||
        tagReqId !== tagMatReqRef.current ||
        imgReqId !== imageAnalyzeReqRef.current
      ) {
        return
      }

      let nextCategories = categoryRes?.suggestions ?? []
      if (categoryRes?.logId) setCatLogId(categoryRes.logId)

      if (aiImageUrls.length > 0) {
        const imageRes = await aiAnalyzeImage({
          imageUrls: aiImageUrls,
          productTitle: name.trim() || undefined,
          productDescription: description.trim() || undefined,
        })

        if (
          catReqId !== categoryReqRef.current ||
          tagReqId !== tagMatReqRef.current ||
          imgReqId !== imageAnalyzeReqRef.current
        ) {
          return
        }

        if (imageRes.success) {
          setImageAnalyzeResult(imageRes)

          if (imageRes.suggestedCategories?.length) {
            nextCategories = imageRes.suggestedCategories
          }

          if (imageRes.suggestedTags?.length) {
            setTagSuggestions(imageRes.suggestedTags)
            const ids = imageRes.suggestedTags
              .map((t) => t.tagId)
              .filter((id): id is number => typeof id === "number")
            setSelTagIds(ids)
          }

          if (imageRes.suggestedMaterials?.length) {
            setMatSuggestions(imageRes.suggestedMaterials)
            const ids = imageRes.suggestedMaterials
              .map((m) => m.materialId)
              .filter((id): id is string => typeof id === "string" && id.length > 0)
            setSelMatIds(ids)
          }
        } else {
          setImageAnalyzeResult(null)
        }
      } else {
        setImageAnalyzeResult(null)
      }

      setCatSuggestions(nextCategories)

      let nextSelected = selCategory
      if (
        !nextSelected ||
        !nextCategories.some((c) => c.categoryId === nextSelected?.categoryId)
      ) {
        nextSelected = nextCategories[0] ?? null
        setSelCategory(nextSelected)
      }

      if (nextSelected) {
        const [tagsRes, matsRes] = await Promise.all([
          aiSuggestTags({ title: name.trim(), description: description.trim(), categoryId: nextSelected.categoryId }),
          aiSuggestMaterials({ title: name.trim(), description: description.trim(), categoryId: nextSelected.categoryId }),
        ])

        if (
          catReqId !== categoryReqRef.current ||
          tagReqId !== tagMatReqRef.current ||
          imgReqId !== imageAnalyzeReqRef.current
        ) {
          return
        }

        setTagSuggestions(tagsRes.suggestions ?? [])
        setMatSuggestions(matsRes.suggestions ?? [])
        if (tagsRes.logId) setTagLogId(tagsRes.logId)
      }
    } catch {
      if (
        catReqId !== categoryReqRef.current ||
        tagReqId !== tagMatReqRef.current ||
        imgReqId !== imageAnalyzeReqRef.current
      ) {
        return
      }
      setCatError(true)
      toast.error("Không thể phân tích AI. Vui lòng thử lại")
    } finally {
      if (
        catReqId !== categoryReqRef.current ||
        tagReqId !== tagMatReqRef.current ||
        imgReqId !== imageAnalyzeReqRef.current
      ) {
        return
      }
      setCatLoading(false)
      setTagLoading(false)
      setImageAnalyzeLoading(false)
    }
  }, [hasInput, imageUrls, name, description, normalizeAiImageUrls, selCategory])

  const handleSelectCategory = (cat: CategorySuggestion) => {
    setSelCategory(cat)
    setSelTagIds([])
    setSelMatIds([])
    fetchTagsAndMaterials(cat.categoryId)
  }

  const sendFeedback = async () => {
    const logId = catLogId ?? tagLogId
    if (!logId) return
    try {
      await aiSendFeedback({
        logId,
        chosenCategoryId: selCategory?.categoryId,
        chosenTagIds: selTagIds,
        chosenMaterialIds: selMatIds.filter(isPersistableMaterialId),
        action: selCategory ? "accepted" : "skipped",
      })
    } catch {
      
    }
  }

  const handleSubmit = async () => {
    if (!name.trim() || !price) return
    await sendFeedback()

    setUploadingImages(true)
    let persistedImageUrls: string[] | undefined
    try {
      if (imageUrls.length > 0) {
        persistedImageUrls = []
        for (const u of imageUrls) {
          const pub = await resolveImageUrlForProduct(u)
          persistedImageUrls.push(pub)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không tải được ảnh lên storage")
      return
    } finally {
      setUploadingImages(false)
    }

    const basePayload = {
      name: name.trim(),
      basePrice: priceRaw,
      description: description.trim() || undefined,
      currency: "VND",
      imageUrls: persistedImageUrls && persistedImageUrls.length > 0 ? persistedImageUrls : undefined,
      categoryId: selCategory?.categoryId ?? undefined,
      tagIds: selTagIds.length > 0 ? selTagIds : undefined,
    }

    const ok = useVariants
      ? await create({
          ...basePayload,
          variants: variantRows
            .filter((r) => r.variantName.trim().length > 0)
            .map((r) => {
              const priceStr = r.price.trim()
              const rowPrice = priceStr ? Number(priceStr) : undefined
              return {
                variantName: r.variantName.trim(),
                sku: r.sku.trim() || undefined,
                price: rowPrice !== undefined && Number.isFinite(rowPrice) && rowPrice > 0 ? rowPrice : undefined,
                quantity: Math.max(0, Math.floor(Number(r.quantity) || 0)),
                attributes: r.attributes.trim() || undefined,
              }
            }),
        })
      : await create({
          ...basePayload,
          quantity: Math.max(0, Math.floor(Number(baseStock) || 0)),
        })

    if (ok) {
      router.push("/seller/products")
    }
  }

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return
    Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 6 - imageUrls.length)
      .forEach((f) =>
        setImageUrls((p) => [...p, URL.createObjectURL(f)].slice(0, 6))
      )
  }
  const addImageUrl = () => {
    let v = imageInput.trim()
    if (!v) return
    try {
      if (v.includes("google.com/imgres")) {
        const u = new URL(v)
        const raw = u.searchParams.get("imgurl")
        if (raw) v = decodeURIComponent(raw)
      }
    } catch { /* ignore */ }
    if (!v.startsWith("http://") && !v.startsWith("https://")) {
      setImageInput("")
      return
    }
    if (imageUrls.length < 6) {
      setImageUrls((p) => [...p, v])
      setBrokenUrls((prev) => { const s = new Set(prev); s.delete(v); return s })
      setImageInput("")
    }
  }
  const removeImage = (i: number) => {
    const url = imageUrls[i]
    setImageUrls((p) => p.filter((_, j) => j !== i))
    setBrokenUrls((prev) => { const s = new Set(prev); s.delete(url); return s })
  }

  const mainImage = imageUrls[0]
  const hasMainPreview = Boolean(mainImage && !brokenUrls.has(mainImage))
  const extraSlots = Array.from({ length: 5 })
  const variantRowsValid = React.useMemo(() => {
    if (!useVariants) return true
    const filled = variantRows.filter((r) => r.variantName.trim().length > 0)
    if (filled.length === 0) return false
    return filled.every((r) => {
      const q = Math.floor(Number(r.quantity))
      return Number.isFinite(q) && q >= 0
    })
  }, [useVariants, variantRows])

  const canSubmit =
    name.trim().length > 0 && priceRaw > 0 && variantRowsValid && !uploadingImages
  const confidenceBadge = selCategory?.confidenceScore ?? catSuggestions[0]?.confidenceScore

  // ── Tag & material toggles ───────────────────────────
  const toggleTag = (id: number) =>
    setSelTagIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  const toggleMat = (id: string) =>
    setSelMatIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  const addCustomTag = () => {
    const t = customTagInput.trim()
    if (t && !customTags.includes(t)) {
      setCustomTags((p) => [...p, t])
    }
    setCustomTagInput("")
    setShowCustomTag(false)
  }
  const removeCustomTag = (t: string) => setCustomTags((p) => p.filter((x) => x !== t))

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 p-3 lg:gap-4 lg:p-5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/seller/products" className="hover:text-foreground transition-colors">
            Sản phẩm
          </Link>
          <IconChevronRight className="size-3" />
          <span className="text-foreground font-medium">Thêm mới</span>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:items-stretch">

          <div className="lg:col-span-2 flex flex-col gap-4 lg:h-full">
            <Card className="!rounded">
              <CardContent className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-xs">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ví dụ: Áo sơ mi nam vải kate cao cấp – màu trắng"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price" className="text-xs">
                    Giá bán (VND) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">₫</span>
                    <Input
                      id="price"
                      inputMode="numeric"
                      placeholder="299,000"
                      value={price}
                      onChange={(e) => {
                        // Xoá ký tự không phải số
                        const digits = e.target.value.replace(/[^0-9]/g, "")
                        const num = digits === "" ? 0 : Number(digits)
                        setPriceRaw(num)
                        // Hiển thị có dấu phẩy nghìn
                        setPrice(digits === "" ? "" : num.toLocaleString("vi-VN"))
                      }}
                      className="h-9 pl-7 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-muted-foreground/15 bg-muted/20 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Nhiều phân loại (màu, size…)</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Bật để tạo nhiều SKU cùng lúc; tắt để một mặt hàng với tồn kho chung.
                    </p>
                  </div>
                  <Switch
                    checked={useVariants}
                    onCheckedChange={(checked) => {
                      setUseVariants(checked)
                      if (checked && variantRows.length === 0) {
                        setVariantRows([newVariantDraftRow()])
                      }
                    }}
                    className="shrink-0"
                  />
                </div>

                {!useVariants ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="sku" className="text-xs">Mã SKU</Label>
                      <Input
                        id="sku"
                        placeholder="Tùy chọn"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="baseStock" className="text-xs">Tồn kho</Label>
                      <Input
                        id="baseStock"
                        type="number"
                        min="0"
                        value={baseStock}
                        onChange={(e) => setBaseStock(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2 rounded-xl border border-muted-foreground/15 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs font-semibold">Danh sách biến thể</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => setVariantRows((p) => [...p, newVariantDraftRow()])}
                      >
                        <IconPlus className="size-3.5" />
                        Thêm dòng
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {variantRows.map((row, idx) => (
                        <div
                          key={row.id}
                          className="grid gap-2 rounded-lg border bg-background/80 p-2.5 sm:grid-cols-12 sm:items-end"
                        >
                          <div className="sm:col-span-4 grid gap-1">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Tên *</span>
                            <Input
                              value={row.variantName}
                              onChange={(e) =>
                                setVariantRows((p) =>
                                  p.map((r) => (r.id === row.id ? { ...r, variantName: e.target.value } : r))
                                )
                              }
                              placeholder={`Loại ${idx + 1}`}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2 grid gap-1">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">SKU</span>
                            <Input
                              value={row.sku}
                              onChange={(e) =>
                                setVariantRows((p) =>
                                  p.map((r) => (r.id === row.id ? { ...r, sku: e.target.value } : r))
                                )
                              }
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                          <div className="sm:col-span-2 grid gap-1">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Giá</span>
                            <Input
                              type="number"
                              min="0"
                              value={row.price}
                              onChange={(e) =>
                                setVariantRows((p) =>
                                  p.map((r) => (r.id === row.id ? { ...r, price: e.target.value } : r))
                                )
                              }
                              placeholder="Trống = giá gốc"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2 grid gap-1">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Tồn *</span>
                            <Input
                              type="number"
                              min="0"
                              value={row.quantity}
                              onChange={(e) =>
                                setVariantRows((p) =>
                                  p.map((r) => (r.id === row.id ? { ...r, quantity: e.target.value } : r))
                                )
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2 flex justify-end pb-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-muted-foreground"
                              disabled={variantRows.length <= 1}
                              onClick={() => setVariantRows((p) => p.filter((r) => r.id !== row.id))}
                            >
                              Xóa
                            </Button>
                          </div>
                          <div className="sm:col-span-12 grid gap-1">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Thuộc tính</span>
                            <Input
                              value={row.attributes}
                              onChange={(e) =>
                                setVariantRows((p) =>
                                  p.map((r) => (r.id === row.id ? { ...r, attributes: e.target.value } : r))
                                )
                              }
                              placeholder="Tùy chọn"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-xs">Mô tả sản phẩm</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả chi tiết về chất liệu, kích thước, màu sắc..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-sm resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="!rounded">
              <CardContent className="grid gap-3">
                <div
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer select-none ${
                    imageUrls.length >= 6
                      ? "cursor-not-allowed border-muted-foreground/25"
                      : isDragging
                        ? "border-primary"
                        : "border-muted-foreground/25 hover:border-primary/50"
                  } ${hasMainPreview ? "aspect-[4/3] overflow-hidden p-0" : "min-h-[180px] p-6"}`}
                  onClick={() => { if (imageUrls.length < 6) fileInputRef.current?.click() }}
                  onDragOver={(e) => { e.preventDefault(); if (imageUrls.length < 6) setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFilesSelected(e.dataTransfer.files) }}
                >
                  <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)} />
                  {hasMainPreview ? (
                    <div className="relative h-full w-full bg-muted/30">
                      <img src={mainImage} alt="Ảnh chính" className="absolute inset-0 h-full w-full object-contain"
                        onError={() => setBrokenUrls((p) => new Set(p).add(mainImage))} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                      <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Ảnh chính
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(0) }}
                        className="absolute right-3 top-3 flex items-center justify-center size-6 rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition-colors">
                        <IconX className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                        className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-black/65"
                      >
                        <IconUpload className="size-3.5" />
                        Thêm ảnh
                      </button>
                      <p className="absolute bottom-3 left-3 text-[11px] font-medium text-white/95">
                        Ảnh phụ thêm ở các ô bên dưới
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="flex items-center justify-center size-10 rounded-full bg-muted">
                        <IconUpload className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-primary">
                          {isDragging ? "Thả ảnh vào đây" : "Tải ảnh lên"}
                          {!isDragging && <span className="text-foreground font-normal"> hoặc kéo thả</span>}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, GIF tối đa 10MB</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {extraSlots.map((_, i) => {
                    const url = imageUrls[i + 1]
                    if (url && !brokenUrls.has(url)) {
                      return (
                        <div key={i} className="relative aspect-square rounded-lg border overflow-hidden group">
                          <img src={url} alt="" className="w-full h-full object-cover"
                            onError={() => setBrokenUrls((p) => new Set(p).add(url))} />
                          <button type="button" onClick={() => removeImage(i + 1)}
                            className="absolute top-0.5 right-0.5 flex items-center justify-center size-4 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconX className="size-2.5" />
                          </button>
                        </div>
                      )
                    }
                    return (
                      <button key={i} type="button" onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 flex flex-col items-center justify-center gap-1 text-muted-foreground/40 bg-muted/20 hover:bg-muted/40 transition-all">
                        <IconPhoto className="size-4" />
                      </button>
                    )
                  })}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Hoặc dán URL ảnh vào đây..."
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl() } }}
                    className="h-8 text-xs"
                    disabled={imageUrls.length >= 6}
                  />
                  <Button type="button" variant="outline" size="sm" className="h-8 px-2"
                    onClick={addImageUrl} disabled={!imageInput.trim() || imageUrls.length >= 6}>
                    <IconPlus className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4 lg:h-full">
            <Card className="!rounded">
              <CardHeader>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <IconSparkles className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm flex items-center gap-2 text-foreground">Trợ lý thông minh</CardTitle>
                  </div>
                  {(catLoading || tagLoading || imageAnalyzeLoading) && (
                    <IconLoader2 className="mt-1 size-3.5 shrink-0 animate-spin text-[#738f5b]" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="grid gap-4">
                <div className="rounded-xl border border-[#d4deca] bg-[#f8fbf5] p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-[#617457]">Hoàn tất thông tin rồi bấm để AI phân tích một lần.</p>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 shrink-0 px-3 text-[11px]"
                      onClick={runAiAnalysis}
                      disabled={catLoading || tagLoading || imageAnalyzeLoading}
                    >
                      {catLoading || tagLoading || imageAnalyzeLoading ? (
                        <>
                          <IconLoader2 className="mr-1 size-3 animate-spin" />
                          Đang phân tích...
                        </>
                      ) : (
                        <>
                          <IconSparkles className="mr-1 size-3" />
                          Bắt đầu phân tích
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {!imageAnalyzeLoading && imageAnalyzeResult?.summary && (
                  <div className="rounded-xl border border-[#d4deca] bg-white p-2.5 text-[11px] leading-relaxed text-[#647759]">
                    <span className="font-semibold text-[#44553a]">Phân tích ảnh:</span> {imageAnalyzeResult.summary}
                  </div>
                )}
                <div>
                  <SectionLabel
                    icon={IconCategory}
                    badge={
                      (catLoading || typeof confidenceBadge !== 'number') ? null : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-[#60794b]">
                          Độ chính xác: {confidenceText(confidenceBadge)}
                        </span>
                      )
                    }
                  >
                    Danh mục
                  </SectionLabel>

                  {!hasInput ? (
                    <div className="rounded-xl border border-dashed border-[#c6d1bc] bg-white p-3 text-center text-[11px] italic text-[#7c8f72]">
                      Chưa phân tích
                    </div>
                  ) : catLoading ? (
                    <div className="flex items-center gap-2 rounded-xl border border-[#cfd8c7] bg-white p-3 text-[11px] text-[#6d7f62]">
                      <IconLoader2 className="size-3 animate-spin text-[#70885a]" />
                      Đang phân tích danh mục...
                    </div>
                  ) : catError ? (
                    <div className="flex items-center gap-2 rounded-xl border border-dashed border-red-200 bg-red-50 p-3 text-[11px] text-red-500">
                      <IconAlertCircle className="size-3.5 shrink-0" />
                      Không thể kết nối AI. Kiểm tra microservice.
                    </div>
                  ) : catSuggestions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#c6d1bc] bg-white p-3 text-center text-[11px] italic text-[#7c8f72]">
                      Không có gợi ý
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {catSuggestions.map((cat, idx) => {
                        const active = selCategory?.categoryId === cat.categoryId
                        return (
                          <button
                            key={`${cat.categoryId}-${cat.categoryName}-${idx}`}
                            type="button"
                            onClick={() => handleSelectCategory(cat)}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                              active
                                ? "border-[#9db183] bg-white"
                                : "border-[#d7dfcf] bg-white hover:border-[#a9bc95]"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#2d3a25]">{cat.categoryName}</p>
                              <p className="truncate text-xs text-[#7f8f74]">{cat.categoryPath}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <ConfidenceDot score={cat.confidenceScore} />
                              <IconPencil className={`size-3.5 ${active ? "text-[#607b4a]" : "text-[#8f9f82]"}`} />
                              {active && <IconCheck className="size-3.5 text-[#5f7a49]" />}
                            </div>
                          </button>
                        )
                      })}

                      {Array.from({ length: Math.max(0, 3 - catSuggestions.length) }).map((_, idx) => (
                        <div
                          key={`empty-cat-${idx}`}
                          className="flex w-full items-center justify-center rounded-xl border border-dashed border-[#d7dfcf] bg-[#fafcf8] px-3 py-3 text-left opacity-60"
                        >
                          <span className="text-xs italic text-[#8a9a80]">--- AI không có thêm gợi ý ---</span>
                        </div>
                      ))}

                      <div className="rounded-xl border border-dashed border-[#c9d3bf] bg-[#fafcf8] p-2.5">
                        <p className="mb-2 text-[11px] text-[#6d7f62]">
                          Không đúng gợi ý? Chọn danh mục thủ công:
                        </p>
                        <div className="relative">
                          <Input
                            value={manualCatQuery}
                            onChange={(e) => setManualCatQuery(e.target.value)}
                            placeholder="Tìm danh mục..."
                            className="h-8 text-xs bg-white pr-7"
                          />
                          {manualCatQuery !== debouncedManualCatQuery && (
                            <IconLoader2 className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-[#8a9a80]" />
                          )}
                        </div>
                        <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                          {manualCategoryOptions.map((c, idx) => {
                            const active = selCategory?.categoryId === c.id
                            return (
                              <button
                                key={`cat-manual-${idx}-${String(c.id)}-${c.name ?? ""}`}
                                type="button"
                                onClick={() =>
                                  handleSelectCategory({
                                    categoryId: c.id,
                                    categoryName: c.name,
                                    categoryPath: c.pathLabel,
                                    confidenceScore: 1,
                                  })
                                }
                                className={`w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                                  active
                                    ? "bg-[#e9f0e2] text-[#2f3f27] font-medium"
                                    : "hover:bg-[#f2f6ee] text-[#5f7253]"
                                }`}
                              >
                                <span className="block truncate">{c.pathLabel}</span>
                                {c.level > 1 && (
                                  <span className="mt-0.5 block text-[10px] font-normal text-[#8a9a80]">
                                    Cấp {c.level}
                                  </span>
                                )}
                              </button>
                            )
                          })}
                          {manualCategoryOptions.length === 0 && (
                            <p className="px-2 py-1 text-[11px] italic text-[#8a9a80]">
                              Không tìm thấy danh mục phù hợp
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <SectionLabel icon={IconPalette}>Chất liệu phát hiện</SectionLabel>
                  {!selCategory ? (
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-7 w-16 rounded-full bg-[#dfe8d6] opacity-60" />
                      ))}
                    </div>
                  ) : tagLoading ? (
                    <div className="flex items-center gap-2 text-[11px] text-[#728568]">
                      <IconLoader2 className="size-3 animate-spin text-[#6f8659]" /> Đang tải...
                    </div>
                  ) : matSuggestions.length === 0 ? (
                    <p className="text-[11px] italic text-[#8a9a80]">Không có gợi ý</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {matSuggestions.map((m, idx) => {
                        const selectKey = materialSelectionKey(m, idx)
                        const active = selMatIds.includes(selectKey)
                        return (
                          <button
                            key={`${selectKey}-${idx}`}
                            type="button"
                            onClick={() => toggleMat(selectKey)}
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                              active
                                ? "border-[#8ea27a] bg-white text-[#415337]"
                                : "border-[#cfd8c6] bg-white text-[#718267] hover:border-[#8ea27a]"
                            }`}
                          >
                            {m.materialName}
                            {active && <IconCheck className="size-3.5" />}
                          </button>
                        )
                      })}
                      <button
                        type="button"
                        className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-[#bcc9af] bg-white px-3 py-1 text-xs text-[#6f8161] hover:border-[#96aa84]"
                      >
                        <IconPlus className="size-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#dce3d5] pt-3">
                  <SectionLabel icon={IconTag}>Thẻ gợi ý</SectionLabel>
                  {!selCategory ? (
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-7 w-14 rounded-full bg-[#dfe8d6] opacity-60" />
                      ))}
                    </div>
                  ) : tagLoading ? (
                    <div className="flex items-center gap-2 text-[11px] text-[#728568]">
                      <IconLoader2 className="size-3 animate-spin text-[#6f8659]" /> Đang tải...
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tagSuggestions.map((tag, idx) => {
                        const tagId = typeof tag.tagId === "number" ? tag.tagId : null
                        const active = tagId !== null ? selTagIds.includes(tagId) : false
                        return (
                          <button
                            key={`${tagId ?? "unknown"}-${tag.tagName}-${idx}`}
                            type="button"
                            onClick={() => {
                              if (tagId === null) return
                              toggleTag(tagId)
                            }}
                            disabled={tagId === null}
                            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
                              active
                                ? "border-[#e8b37f] bg-white text-[#b06017]"
                                : "border-[#efd4b7] bg-white text-[#c06f2a] hover:border-[#e8b37f]"
                            }`}
                          >
                            #{tag.tagName}
                          </button>
                        )
                      })}

                      {customTags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => removeCustomTag(t)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#e8b37f] bg-white px-2.5 py-1 text-xs font-medium text-[#b06017] hover:opacity-80"
                        >
                          #{t}
                          <IconX className="size-3" />
                        </button>
                      ))}

                      {showCustomTag ? (
                        <div className="flex items-center gap-1">
                          <Input
                            autoFocus
                            value={customTagInput}
                            onChange={(e) => setCustomTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && customTagInput.trim()) addCustomTag()
                              if (e.key === "Escape") setShowCustomTag(false)
                            }}
                            placeholder="tag..."
                            className="h-7 w-24 border-[#c8d4bd] bg-white px-2 text-[11px]"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowCustomTag(true)}
                          className="rounded-md border border-dashed border-[#bcc9af] bg-white px-2.5 py-1 text-[11px] text-[#6f8161] hover:border-[#96aa84]"
                        >
                          + Thêm
                        </button>
                      )}

                      {tagSuggestions.length === 0 && customTags.length === 0 && !showCustomTag && selCategory && !tagLoading && (
                        <span className="text-[11px] italic text-[#8a9a80]">Không có gợi ý - bạn có thể tự thêm</span>
                      )}
                    </div>
                  )}
                </div>

                {selCategory && (
                  <div className="rounded-xl border border-[#d4deca] bg-white p-3 text-[11px] text-[#627458]">
                    Đã chọn: <span className="font-semibold text-[#46573b]">{selCategory.categoryName}</span>
                    {selTagIds.length > 0 && ` · ${selTagIds.length} tag`}
                    {selMatIds.length > 0 && ` · ${selMatIds.length} chất liệu`}
                  </div>
                )}

                {!hasInput && (
                  <div className="rounded-xl border border-dashed border-[#c7d2bd] bg-white p-3 text-center text-[11px] italic leading-relaxed text-[#7b8d71]">
                    Nhập tên hoặc mô tả sản phẩm để AI gợi ý danh mục
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="!rounded">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <span className="flex size-6 items-center justify-center rounded-md bg-primary/10">
                    <IconPencil className="size-3.5 text-primary" />
                  </span>
                  Góp ý AI cải thiện
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-xs text-muted-foreground">
                  Chia sẻ góp ý để hệ thống gợi ý danh mục, tag và chất liệu chính xác hơn cho lần đăng tiếp theo.
                </p>
                <Textarea
                  rows={3}
                  placeholder="Ý kiến của bạn về mức độ chính xác của AI ..."
                  className="h-24 resize-none border-[#d3dbcb] bg-white text-sm"
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 bg-white"
                onClick={() => router.push("/seller/products")}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={actionLoading || uploadingImages || !canSubmit}
                className="h-10"
              >
                {uploadingImages ? (
                  <><IconLoader2 className="mr-2 size-4 animate-spin" />Đang tải ảnh...</>
                ) : actionLoading ? (
                  <><IconLoader2 className="mr-2 size-4 animate-spin" />Đang tạo...</>
                ) : (
                  "Đăng bán →"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
