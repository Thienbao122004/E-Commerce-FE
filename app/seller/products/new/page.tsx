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
  IconBoxSeam,
  IconPalette,
  IconAlertCircle,
  IconPencil,
  IconInfoCircle,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useSellerProducts } from "@/hooks/use-seller-products"
import {
  aiSuggestCategory,
  aiSuggestTags,
  aiSuggestMaterials,
  aiSendFeedback,
} from "@/services/ai-seller"
import type {
  CategorySuggestion,
  TagSuggestion,
  MaterialSuggestion,
} from "@/services/ai-seller"

// ── Helpers ─────────────────────────────────────────────
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

function ConfidenceDot({ score }: { score: number }) {
  const pct = Math.round(score * 100)
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

// ── Main ────────────────────────────────────────────────
export default function CreateProductPage() {
  const router = useRouter()
  const { create, actionLoading } = useSellerProducts()

  // Form state
  const [name, setName] = React.useState("")
  const [price, setPrice] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [imageUrls, setImageUrls] = React.useState<string[]>([])
  const [imageInput, setImageInput] = React.useState("")
  const [isDragging, setIsDragging] = React.useState(false)
  const [brokenUrls, setBrokenUrls] = React.useState<Set<string>>(new Set())
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // AI state
  const [catLoading, setCatLoading] = React.useState(false)
  const [tagLoading, setTagLoading] = React.useState(false)
  const [catError, setCatError] = React.useState(false)

  const [catSuggestions, setCatSuggestions] = React.useState<CategorySuggestion[]>([])
  const [tagSuggestions, setTagSuggestions] = React.useState<TagSuggestion[]>([])
  const [matSuggestions, setMatSuggestions] = React.useState<MaterialSuggestion[]>([])

  const [catLogId, setCatLogId] = React.useState<string | null>(null)
  const [tagLogId, setTagLogId] = React.useState<string | null>(null)

  // Selections
  const [selCategory, setSelCategory] = React.useState<CategorySuggestion | null>(null)
  const [selTagIds, setSelTagIds] = React.useState<number[]>([])
  const [selMatIds, setSelMatIds] = React.useState<string[]>([])
  const [customTags, setCustomTags] = React.useState<string[]>([])
  const [customTagInput, setCustomTagInput] = React.useState("")
  const [showCustomTag, setShowCustomTag] = React.useState(false)

  const hasInput = name.trim().length > 0 || description.trim().length > 0

  // ── 1. suggest-category (debounced on name/description change) ──
  const aiCatTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  React.useEffect(() => {
    if (!name.trim() && !description.trim()) {
      setCatSuggestions([])
      setCatLogId(null)
      setCatError(false)
      return
    }
    clearTimeout(aiCatTimer.current)
    aiCatTimer.current = setTimeout(async () => {
      setCatLoading(true)
      setCatError(false)
      try {
        const res = await aiSuggestCategory({
          title: name.trim(),
          description: description.trim(),
          imageUrls: imageUrls.filter((u) => u.startsWith("http")),
        })
        setCatSuggestions(res.suggestions ?? [])
        setCatLogId(res.logId ?? null)
        // Auto-select top suggestion if nothing chosen yet
        if (!selCategory && res.suggestions.length > 0) {
          setSelCategory(res.suggestions[0])
          fetchTagsAndMaterials(res.suggestions[0].categoryId)
        }
      } catch {
        setCatError(true)
      } finally {
        setCatLoading(false)
      }
    }, 900)

    return () => clearTimeout(aiCatTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description])

  // ── 2. suggest-tags + suggest-materials when category changes ──
  const fetchTagsAndMaterials = React.useCallback(
    async (categoryId: number) => {
      if (!name.trim() && !description.trim()) return
      setTagLoading(true)
      try {
        const [tagsRes, matsRes] = await Promise.all([
          aiSuggestTags({ title: name.trim(), description: description.trim(), categoryId }),
          aiSuggestMaterials({ title: name.trim(), description: description.trim(), categoryId }),
        ])
        setTagSuggestions(tagsRes.suggestions ?? [])
        setMatSuggestions(matsRes.suggestions ?? [])
        if (tagsRes.logId) setTagLogId(tagsRes.logId)
      } catch {
        // silent fail for tags/materials
      } finally {
        setTagLoading(false)
      }
    },
    [name, description]
  )

  const handleSelectCategory = (cat: CategorySuggestion) => {
    setSelCategory(cat)
    setSelTagIds([])
    setSelMatIds([])
    fetchTagsAndMaterials(cat.categoryId)
  }

  // ── 3. tag-feedback on submit ────────────────────────
  const sendFeedback = async () => {
    const logId = catLogId ?? tagLogId
    if (!logId) return
    try {
      await aiSendFeedback({
        logId,
        chosenCategoryId: selCategory?.categoryId,
        chosenTagIds: selTagIds,
        chosenMaterialIds: selMatIds,
        action: selCategory ? "accepted" : "skipped",
      })
    } catch {
      // feedback is best-effort
    }
  }

  // ── Submit ───────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim() || !price) return
    await sendFeedback()
    const ok = await create({
      name: name.trim(),
      basePrice: Number(price),
      description: description.trim() || undefined,
      currency: "VND",
      imageUrls: imageUrls.filter((u) => u.startsWith("http")).length > 0
        ? imageUrls.filter((u) => u.startsWith("http"))
        : undefined,
      categoryId: selCategory?.categoryId ?? undefined,
    })
    if (ok) {
      toast.success("Tạo sản phẩm thành công!")
      router.push("/seller/products")
    }
  }

  // ── Image helpers ────────────────────────────────────
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
  const canSubmit = name.trim().length > 0 && Number(price) > 0
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

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/seller/products" className="hover:text-foreground transition-colors">
            Sản phẩm
          </Link>
          <IconChevronRight className="size-3" />
          <span className="text-foreground font-medium">Thêm mới</span>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:items-stretch">

          {/* ── LEFT: Form ──────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4 lg:h-full">

            {/* Basic info */}
            <Card>
              <CardHeader className="py-1 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="flex items-center justify-center size-6 rounded-md bg-primary/10">
                    <IconBoxSeam className="size-3.5 text-primary" />
                  </span>
                  Thông tin cơ bản
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 grid gap-3">
                <div className="grid gap-1">
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="price" className="text-xs">
                      Giá bán (VND) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">₫</span>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        placeholder="299,000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="h-9 pl-7 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="sku" className="text-xs">Mã SKU</Label>
                    <Input
                      id="sku"
                      placeholder="Tự động tạo nếu để trống"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-1">
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

            {/* Images */}
            <Card>
              <CardHeader className="py-1 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="flex items-center justify-center size-6 rounded-md bg-primary/10">
                      <IconPhoto className="size-3.5 text-primary" />
                    </span>
                    Hình ảnh sản phẩm
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] tabular-nums">{imageUrls.length}/6</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 grid gap-3">
                <div
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer select-none ${
                    imageUrls.length >= 6
                      ? "cursor-not-allowed border-muted-foreground/25"
                      : isDragging
                        ? "border-primary"
                        : "border-muted-foreground/25 hover:border-primary/50"
                  } ${hasMainPreview ? "overflow-hidden p-0" : "p-6"}`}
                  style={{ minHeight: 180 }}
                  onClick={() => { if (imageUrls.length < 6) fileInputRef.current?.click() }}
                  onDragOver={(e) => { e.preventDefault(); if (imageUrls.length < 6) setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFilesSelected(e.dataTransfer.files) }}
                >
                  <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)} />
                  {hasMainPreview ? (
                    <div className="relative h-[180px] w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mainImage} alt="Ảnh chính" className="absolute inset-0 h-full w-full object-cover"
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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
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

          {/* ── RIGHT: AI Panel ─────────────────────── */}
          <div className="flex flex-col gap-4 lg:h-full">
            <Card className="border border-[#d7dfcf] shadow-sm">
              <CardHeader className="py-1 px-4">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <IconSparkles className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm flex items-center gap-2 text-foreground">Trợ lý thông minh</CardTitle>
                    <p className="mt-1 text-xs leading-relaxed text-[#607157]">
                      {name.trim()
                        ? <>Dựa trên hình ảnh <span className="font-semibold text-[#2f3f27]">{name}</span> bạn vừa tải lên, hệ thống gợi ý các thông tin sau:</>
                        : "Nhập tên hoặc mô tả để AI phân tích và gợi ý tự động"}
                    </p>
                  </div>
                  {(catLoading || tagLoading) && (
                    <IconLoader2 className="mt-1 size-3.5 shrink-0 animate-spin text-[#738f5b]" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="px-4 pb-4 grid gap-4">
                {/* ── DANH MỤC ── */}
                <div>
                  <SectionLabel
                    icon={IconCategory}
                    badge={
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-[#60794b]">
                        Độ chính xác: {confidenceText(confidenceBadge)}
                      </span>
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
                      {catSuggestions.map((cat) => {
                        const active = selCategory?.categoryId === cat.categoryId
                        return (
                          <button
                            key={cat.categoryId}
                            type="button"
                            onClick={() => handleSelectCategory(cat)}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                              active
                                ? "border-[#9db183] bg-white"
                                : "border-[#d7dfcf] bg-white hover:border-[#a9bc95]"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[25px] font-semibold text-[#2d3a25]">{cat.categoryName}</p>
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
                    </div>
                  )}
                </div>

                {/* ── CHẤT LIỆU ── */}
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
                      {matSuggestions.map((m) => {
                        const active = selMatIds.includes(m.materialId)
                        return (
                          <button
                            key={m.materialId}
                            type="button"
                            onClick={() => toggleMat(m.materialId)}
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

                {/* ── TAGS ── */}
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
                      {tagSuggestions.map((tag) => {
                        const active = selTagIds.includes(tag.tagId)
                        return (
                          <button
                            key={tag.tagId}
                            type="button"
                            onClick={() => toggleTag(tag.tagId)}
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

            <Card className="border border-[#d7dfcf] shadow-sm">
              <CardHeader className="py-1 px-4">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <span className="flex size-6 items-center justify-center rounded-md bg-primary/10">
                    <IconPencil className="size-3.5 text-primary" />
                  </span>
                  Góp ý AI cải thiện
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
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
                disabled={actionLoading || !canSubmit}
                className="h-10"
              >
                {actionLoading ? (
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
