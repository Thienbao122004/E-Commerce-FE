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
  IconEdit,
  IconBulb,
  IconSend,
  IconPhoto,
  IconTag,
  IconCategory,
  IconBoxSeam,
  IconPalette,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useSellerProducts } from "@/hooks/use-seller-products"

type AiSuggestions = {
  categoryName: string | null
  categoryId: number | null
  subcategoryName: string | null
  tags: { name: string; type: "style" | "occasion" | "other"; score: number }[]
  materials: { name: string; score: number }[]
  insight: string | null
  loading: boolean
}

// Tag color by type
const tagColor: Record<string, string> = {
  style:
    "border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  occasion:
    "border-green-300 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  other:
    "border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
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


export default function CreateProductPage() {
  const router = useRouter()
  const { create, actionLoading } = useSellerProducts()

  const [name, setName] = React.useState("")
  const [price, setPrice] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [imageUrls, setImageUrls] = React.useState<string[]>([])
  const [imageInput, setImageInput] = React.useState("")
  const [isDragging, setIsDragging] = React.useState(false)
  const [aiFeedback, setAiFeedback] = React.useState("")

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [brokenUrls, setBrokenUrls] = React.useState<Set<string>>(new Set())

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return
    Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 6 - imageUrls.length)
      .forEach((f) => setImageUrls((p) => [...p, URL.createObjectURL(f)].slice(0, 6)))
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
    } catch {
    }

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
  const handleImgError = (url: string) =>
    setBrokenUrls((prev) => new Set(prev).add(url))

  // ── AI ──────────────────────────────────────────────────
  const [ai, setAi] = React.useState<AiSuggestions>({
    categoryName: null, categoryId: null, subcategoryName: null,
    tags: [], materials: [], insight: null, loading: false,
  })

  // Selected state
  const [selCategory, setSelCategory] = React.useState<{ id: number | null; name: string } | null>(null)
  const [selSubcat, setSelSubcat] = React.useState<string | null>(null)
  const [selTags, setSelTags] = React.useState<string[]>([])
  const [selMaterials, setSelMaterials] = React.useState<string[]>([])
  const [editCatMode, setEditCatMode] = React.useState(false)
  const [editCatVal, setEditCatVal] = React.useState("")
  const [editSubMode, setEditSubMode] = React.useState(false)
  const [editSubVal, setEditSubVal] = React.useState("")
  const [customTag, setCustomTag] = React.useState("")
  const [showCustomTag, setShowCustomTag] = React.useState(false)

  const hasInput = name.trim().length > 0 || description.trim().length > 0
  const aiRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Mock AI analysis – replace with real API call later
  const runAi = React.useCallback(() => {
    if (!name.trim() && !description.trim()) {
      setAi({ categoryName: null, categoryId: null, subcategoryName: null, tags: [], materials: [], insight: null, loading: false })
      return
    }
    setAi((p) => ({ ...p, loading: true }))
    clearTimeout(aiRef.current)
    aiRef.current = setTimeout(() => {
      const result: AiSuggestions = {
        categoryName: "Trang trí nhà cửa",
        categoryId: 1,
        subcategoryName: "Bình hoa & Lọ cắm",
        tags: [
          { name: "handmade", type: "style", score: 0.95 },
          { name: "vintage", type: "style", score: 0.88 },
          { name: "minimalist", type: "style", score: 0.82 },
          { name: "quà tặng", type: "occasion", score: 0.76 },
        ],
        materials: [
          { name: "Gốm Bát Tràng", score: 0.91 },
          { name: "Đất sét nung", score: 0.78 },
        ],
        insight: "Sản phẩm thủ công có nguồn gốc rõ ràng thường bán chạy hơn 25%.",
        loading: false,
      }
      setAi(result)
      if (!selCategory) {
        setSelCategory({ id: result.categoryId, name: result.categoryName! })
        setSelSubcat(result.subcategoryName)
      }
    }, 1400)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description])

  React.useEffect(() => {
    const t = setTimeout(runAi, 700)
    return () => clearTimeout(t)
  }, [name, description, runAi])

  const toggleTag = (t: string) =>
    setSelTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])
  const toggleMat = (m: string) =>
    setSelMaterials((p) => p.includes(m) ? p.filter((x) => x !== m) : [...p, m])

  const handleSubmit = async () => {
    if (!name.trim() || !price) return
    const ok = await create({
      name: name.trim(),
      basePrice: Number(price),
      description: description.trim() || undefined,
      currency: "VND",
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      categoryId: selCategory?.id ?? undefined,
    })
    if (ok) router.push("/seller/products")
  }

  const canSubmit = name.trim().length > 0 && Number(price) > 0

  // Main image slot
  const mainImage = imageUrls[0]
  // Extra thumbnail slots (always 4 visible below main)
  const extraSlots = Array.from({ length: 4 })

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

        {/* 3-col grid: 2 left + 1 right */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* ── LEFT: Form ────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Basic info */}
            <Card>
              <CardHeader className="py-3 px-4">
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
                    placeholder="Ví dụ: Bình gốm Bát Tràng thủ công – màu xanh cobalt"
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
                        placeholder="1,250,000"
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
                  <Label htmlFor="desc" className="text-xs">Mô tả sản phẩm</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả chi tiết về chất liệu, kích thước, câu chuyện sản phẩm..."
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
              <CardHeader className="py-3 px-4">
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

                {/* Main drop zone */}
                <div
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer select-none ${
                    imageUrls.length >= 6
                      ? "opacity-40 cursor-not-allowed p-6"
                      : isDragging
                        ? "border-primary bg-primary/5 p-6"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20 p-6"
                  }`}
                  style={{ minHeight: 140 }}
                  onClick={() => { if (imageUrls.length < 6) fileInputRef.current?.click() }}
                  onDragOver={(e) => { e.preventDefault(); if (imageUrls.length < 6) setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFilesSelected(e.dataTransfer.files) }}
                >
                  <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)} />

                  {mainImage && !brokenUrls.has(mainImage) ? (
                    <div className="relative">
                      <img
                        src={mainImage}
                        alt="Ảnh chính"
                        className="h-28 w-28 object-cover rounded-lg border"
                        onError={() => handleImgError(mainImage)}
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(0) }}
                        className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <IconX className="size-3" />
                      </button>
                    </div>
                  ) : mainImage && brokenUrls.has(mainImage) ? (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="flex items-center justify-center h-28 w-28 rounded-lg border bg-muted">
                        <IconPhoto className="size-8 text-muted-foreground/60" />
                      </div>
                      <p className="text-[11px] text-muted-foreground/70">
                        URL ảnh không tải được. Kiểm tra lại link hoặc thử URL khác.
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
                          {!isDragging && (
                            <span className="text-foreground font-normal"> hoặc kéo thả vào đây</span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          PNG, JPG, GIF tối đa 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Thumbnail strip (4 slots) */}
                <div className="grid grid-cols-4 gap-2">
                  {extraSlots.map((_, i) => {
                    const url = imageUrls[i + 1]
                    if (url && !brokenUrls.has(url)) {
                      return (
                        <div key={i} className="relative aspect-square rounded-lg border overflow-hidden group">
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={() => handleImgError(url)}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(i + 1)}
                            className="absolute top-0.5 right-0.5 flex items-center justify-center size-4 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <IconX className="size-2.5" />
                          </button>
                        </div>
                      )
                    }
                    if (url && brokenUrls.has(url)) {
                      return (
                        <div key={i} className="relative aspect-square rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/40">
                          <IconPhoto className="size-5 text-muted-foreground/60" />
                        </div>
                      )
                    }
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 flex flex-col items-center justify-center gap-1 text-muted-foreground/40 bg-muted/20 hover:bg-muted/40 transition-all"
                      >
                        <IconPhoto className="size-4" />
                      </button>
                    )
                  })}
                </div>

                {/* URL input */}
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

          {/* ── RIGHT: AI panel ─────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* AI Smart Panel */}
            <Card className="border-[1.5px] border-violet-200 dark:border-violet-800">
              <CardHeader className="py-3 px-4 pb-2">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center size-7 rounded-full bg-violet-100 dark:bg-violet-900/60 shrink-0 mt-0.5">
                    <IconSparkles className="size-4 text-violet-600 dark:text-violet-400" />
                  </span>
                  <div>
                    <CardTitle className="text-sm">Trợ lý thông minh</CardTitle>
                    {name.trim() ? (
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Dựa trên thông tin{" "}
                        <span className="font-semibold text-foreground">{name}</span>, hệ thống gợi ý các thông tin sau:
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Nhập tên sản phẩm để nhận gợi ý tự động
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-4 pb-4 grid gap-3.5">

                {/* DANH MỤC */}
                <div>
                  <SectionLabel
                    icon={IconCategory}
                    badge={
                      ai.categoryName && !ai.loading ? (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                          Độ chính xác: {Math.round(0.94 * 100)}%
                        </Badge>
                      ) : undefined
                    }
                  >
                    Danh mục
                  </SectionLabel>

                  {!hasInput ? (
                    <div className="rounded-lg border border-dashed border-muted-foreground/20 p-2.5 text-[11px] text-muted-foreground/50 italic text-center">
                      Chưa phân tích
                    </div>
                  ) : ai.loading ? (
                    <div className="rounded-lg border p-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <IconLoader2 className="size-3 animate-spin text-violet-400" />
                      Đang phân tích...
                    </div>
                  ) : selCategory && !editCatMode ? (
                    <div className="rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-card p-2.5 flex items-center justify-between gap-2 shadow-sm">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{selCategory.name}</p>
                        <p className="text-[10px] text-muted-foreground">Home Decor</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setEditCatVal(selCategory.name); setEditCatMode(true) }}
                        className="shrink-0 flex items-center justify-center size-6 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <IconEdit className="size-3.5" />
                      </button>
                    </div>
                  ) : editCatMode ? (
                    <div className="flex gap-1.5">
                      <Input autoFocus value={editCatVal} onChange={(e) => setEditCatVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { setSelCategory({ id: selCategory?.id ?? null, name: editCatVal.trim() || (selCategory?.name ?? "") }); setEditCatMode(false) }
                          if (e.key === "Escape") setEditCatMode(false)
                        }}
                        className="h-8 text-xs" placeholder="Tên danh mục..." />
                      <Button type="button" size="sm" className="h-8 px-2 text-xs"
                        onClick={() => { if (editCatVal.trim()) setSelCategory({ id: selCategory?.id ?? null, name: editCatVal.trim() }); setEditCatMode(false) }}>
                        OK
                      </Button>
                    </div>
                  ) : (
                    ai.categoryName ? (
                      <button type="button" onClick={() => setSelCategory({ id: ai.categoryId, name: ai.categoryName! })}
                        className="w-full text-left rounded-lg border p-2.5 hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-all flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{ai.categoryName}</p>
                        <span className="text-[10px] text-violet-600 shrink-0">Chọn</span>
                      </button>
                    ) : <div className="rounded-lg border border-dashed p-2.5 text-[11px] text-muted-foreground/50 text-center italic">Không có gợi ý</div>
                  )}
                </div>

                {/* LOẠI SẢN PHẨM */}
                <div>
                  <SectionLabel icon={IconTag}>Loại sản phẩm</SectionLabel>
                  {!hasInput ? (
                    <div className="rounded-lg border border-dashed border-muted-foreground/20 p-2.5 text-[11px] text-muted-foreground/50 italic text-center">
                      Chưa phân tích
                    </div>
                  ) : ai.loading ? (
                    <div className="rounded-lg border p-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <IconLoader2 className="size-3 animate-spin text-violet-400" />
                      Đang phân tích...
                    </div>
                  ) : selSubcat && !editSubMode ? (
                    <div className="rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-card p-2.5 flex items-center justify-between gap-2 shadow-sm">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{selSubcat}</p>
                        <p className="text-[10px] text-muted-foreground">Vases</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setEditSubVal(selSubcat); setEditSubMode(true) }}
                        className="shrink-0 flex items-center justify-center size-6 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <IconEdit className="size-3.5" />
                      </button>
                    </div>
                  ) : editSubMode ? (
                    <div className="flex gap-1.5">
                      <Input autoFocus value={editSubVal} onChange={(e) => setEditSubVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { setSelSubcat(editSubVal.trim() || selSubcat); setEditSubMode(false) }
                          if (e.key === "Escape") setEditSubMode(false)
                        }}
                        className="h-8 text-xs" placeholder="Loại sản phẩm..." />
                      <Button type="button" size="sm" className="h-8 px-2 text-xs"
                        onClick={() => { if (editSubVal.trim()) setSelSubcat(editSubVal.trim()); setEditSubMode(false) }}>
                        OK
                      </Button>
                    </div>
                  ) : (
                    ai.subcategoryName ? (
                      <button type="button" onClick={() => setSelSubcat(ai.subcategoryName!)}
                        className="w-full text-left rounded-lg border p-2.5 hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-all flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{ai.subcategoryName}</p>
                        <span className="text-[10px] text-violet-600 shrink-0">Chọn</span>
                      </button>
                    ) : <div className="rounded-lg border border-dashed p-2.5 text-[11px] text-muted-foreground/50 text-center italic">Không có gợi ý</div>
                  )}
                </div>

                {/* CHẤT LIỆU */}
                <div>
                  <SectionLabel icon={IconPalette}>Chất liệu phát hiện</SectionLabel>
                  {!hasInput ? (
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((i) => <div key={i} className="h-6 w-16 rounded-full bg-muted/50 opacity-40" />)}
                    </div>
                  ) : ai.loading ? (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <IconLoader2 className="size-3 animate-spin text-violet-400" /> Đang phân tích...
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selMaterials.map((m) => (
                        <button key={m} type="button" onClick={() => toggleMat(m)}
                          className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-0.5 text-xs font-medium hover:opacity-80 transition-opacity">
                          <IconCheck className="size-3" />
                          {m}
                        </button>
                      ))}
                      {ai.materials.filter((m) => !selMaterials.includes(m.name)).map((m) => (
                        <button key={m.name} type="button" onClick={() => toggleMat(m.name)}
                          className="inline-flex items-center gap-1 rounded-full border border-muted-foreground/20 bg-muted/50 text-muted-foreground px-2.5 py-0.5 text-xs font-medium hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition-all">
                          <IconPlus className="size-3" />
                          {m.name}
                        </button>
                      ))}
                      {ai.materials.length === 0 && selMaterials.length === 0 && (
                        <span className="text-[11px] text-muted-foreground/50 italic">Không có gợi ý</span>
                      )}
                    </div>
                  )}
                </div>

                {/* TAGS */}
                <div>
                  <SectionLabel icon={IconTag}>Thẻ gợi ý</SectionLabel>
                  {!hasInput ? (
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((i) => <div key={i} className="h-6 w-14 rounded-full bg-muted/50 opacity-40" />)}
                    </div>
                  ) : ai.loading ? (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <IconLoader2 className="size-3 animate-spin text-violet-400" /> Đang phân tích...
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {ai.tags.map((tag) => {
                        const active = selTags.includes(tag.name)
                        const color = active ? tagColor[tag.type] ?? tagColor.other : "border-muted-foreground/20 bg-muted/50 text-muted-foreground hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                        return (
                          <button key={tag.name} type="button" onClick={() => toggleTag(tag.name)}
                            className={`inline-flex items-center gap-0.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all ${color}`}>
                            #{tag.name}
                            {active && <IconX className="size-3 ml-0.5" />}
                          </button>
                        )
                      })}
                      {/* custom tags */}
                      {selTags.filter((t) => !ai.tags.find((at) => at.name === t)).map((t) => (
                        <button key={t} type="button" onClick={() => toggleTag(t)}
                          className="inline-flex items-center gap-0.5 rounded-full border border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 px-2.5 py-0.5 text-xs font-medium hover:opacity-80">
                          #{t}<IconX className="size-3 ml-0.5" />
                        </button>
                      ))}
                      {showCustomTag ? (
                        <div className="flex items-center gap-1">
                          <Input autoFocus value={customTag} onChange={(e) => setCustomTag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && customTag.trim()) { toggleTag(customTag.trim()); setCustomTag(""); setShowCustomTag(false) }
                              if (e.key === "Escape") setShowCustomTag(false)
                            }}
                            placeholder="tag..." className="h-6 text-[11px] w-20 px-2" />
                        </div>
                      ) : (
                        <button type="button" onClick={() => setShowCustomTag(true)}
                          className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-muted-foreground/30 px-2.5 py-0.5 text-[11px] text-muted-foreground hover:border-violet-400 hover:text-violet-600 transition-all">
                          <IconPlus className="size-3" /> Thêm
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* AI insight */}
                {ai.insight && !ai.loading && (
                  <div className="rounded-lg bg-muted/60 border border-muted p-2.5 flex gap-2">
                    <span className="text-green-500 text-[11px] shrink-0 mt-0.5">●</span>
                    <div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                        &ldquo;{ai.insight}&rdquo;
                      </p>
                      <button type="button" onClick={() => document.getElementById("description")?.focus()}
                        className="text-[10px] text-violet-600 hover:underline mt-1">
                        Thêm câu chuyện thương hiệu
                      </button>
                    </div>
                  </div>
                )}

                {!hasInput && (
                  <div className="rounded-lg border border-dashed border-muted-foreground/15 p-2.5 flex gap-2 items-start">
                    <IconBulb className="size-3.5 text-muted-foreground/30 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground/50 italic leading-relaxed">
                      Gợi ý AI sẽ xuất hiện ngay khi bạn nhập tên sản phẩm
                    </p>
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Góp ý AI */}
            <Card>
              <CardHeader className="py-3 px-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="flex items-center justify-center size-6 rounded-full bg-muted">
                    <IconSend className="size-3 text-muted-foreground" />
                  </span>
                  Góp ý AI cải thiện
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 grid gap-2">
                <Textarea
                  placeholder="Ý kiến của bạn về mức độ chính xác của AI ..."
                  rows={3}
                  className="text-xs resize-none"
                  value={aiFeedback}
                  onChange={(e) => setAiFeedback(e.target.value)}
                />
                <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs"
                  disabled={!aiFeedback.trim()}
                  onClick={() => setAiFeedback("")}>
                  <IconSend className="size-3 mr-1.5" /> Gửi góp ý
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <Button type="button" variant="ghost" size="sm"
            onClick={() => router.push("/seller/products")}>
            Hủy bỏ
          </Button>
          <Button type="button" onClick={handleSubmit}
            disabled={actionLoading || !canSubmit}
            className="min-w-[130px] h-9">
            {actionLoading ? (
              <><IconLoader2 className="mr-2 size-4 animate-spin" />Đang tạo...</>
            ) : (
              "Đăng bán →"
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}
