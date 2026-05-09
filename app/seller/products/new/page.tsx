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
  IconSearch,
  IconAlignLeft,
} from "@tabler/icons-react"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
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
import { useSellerProducts } from "@/hooks/use-seller-products"
import { useSellerPlatformFee } from "@/hooks/use-seller-platform-fee"
import { SellerPlatformFeeHint } from "@/components/seller/seller-platform-fee-hint"
import {
  aiAnalyzeProduct,
  aiAnalyzeImage,
  aiCommitProductTagSession,
} from "@/services/ai-seller"
import { getCategoryTree, type StorefrontCategory } from "@/services/storefront-categories"
import { supabase } from "@/lib/supabase"
import { groupMaterialsForPicker, groupTagsForPicker } from "@/lib/seller-picker-groups"
import {
  fetchSellerMaterials,
  fetchSellerTags,
} from "@/services/seller-dashboard"
import type {
  AnalyzeImageResponse,
  CategorySuggestion,
  TagSuggestion,
  MaterialSuggestion,
} from "@/services/ai-seller"
import type { MaterialDto } from "@/services/admin-materials"
import type { Tag } from "@/types/tag"

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

/** Normalize tag id: API may return string or tag_id (snake_case). */
function parseTagIdFromSuggestion(tag: TagSuggestion & { tag_id?: unknown }): number | null {
  const raw: unknown = (tag as TagSuggestion & { tag_id?: unknown }).tagId ?? tag.tag_id
  if (typeof raw === "number" && Number.isFinite(raw)) return raw
  if (typeof raw === "string" && /^\d+$/.test(raw.trim())) return parseInt(raw.trim(), 10)
  return null
}

/** Độ tin cậy gửi lên API commit (0–1 hoặc 0–100 đều được). */
function tagConfidenceForCommit(s: TagSuggestion): number {
  const ext = s as TagSuggestion & { confidenceScore?: number }
  const raw = ext.confidenceScore ?? ext.confidence
  if (raw == null || !Number.isFinite(raw)) return 0
  return raw
}

function resolveChosenTagNames(
  selTagIds: number[],
  tagSuggestions: TagSuggestion[],
  platformTags: Tag[],
): string[] {
  const byId = new Map<number, string>()
  for (const t of platformTags) byId.set(t.id, t.name)
  for (const sug of tagSuggestions) {
    const id = parseTagIdFromSuggestion(sug as TagSuggestion & { tag_id?: unknown })
    if (id != null && sug.tagName?.trim()) byId.set(id, sug.tagName.trim())
  }
  const names: string[] = []
  for (const id of selTagIds) {
    const n = byId.get(id)
    if (n) names.push(n)
  }
  return names
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isPersistableMaterialId(id: string): boolean {
  return UUID_RE.test(id)
}

function materialConfidenceForCommit(m: MaterialSuggestion): number {
  const ext = m as MaterialSuggestion & { confidenceScore?: number }
  const raw = ext.confidenceScore ?? ext.confidence
  if (raw == null || !Number.isFinite(raw)) return 0
  return raw
}

function buildSuggestedMaterialsForCommit(matSuggestions: MaterialSuggestion[]) {
  return matSuggestions
    .filter((m) => isPersistableMaterialId(m.materialId) || (m.materialName?.trim()?.length ?? 0) > 0)
    .map((m) => ({
      materialId: isPersistableMaterialId(m.materialId) ? m.materialId : null,
      materialName: (m.materialName ?? "").trim() || "—",
      confidenceScore: materialConfidenceForCommit(m),
    }))
}

/** Chọn được cả khi AI chỉ trả tên, không trả UUID */
function materialSelectionKey(m: MaterialSuggestion, idx: number): string {
  const id = m.materialId
  if (typeof id === "string" && id.trim().length > 0) return id.trim()
  const n = m.materialName?.trim()
  if (n) return `__name__:${n.toLowerCase()}`
  return `__idx__:${idx}`
}

/** Đồng bộ chip AI (__name__ / UUID) với dòng trong dialog chọn chất liệu nền tảng */
function isPlatformMatSelected(
  mat: MaterialDto,
  selMatIds: string[],
  matSuggestions: MaterialSuggestion[],
): boolean {
  if (selMatIds.includes(mat.id)) return true
  const nameLower = mat.name.trim().toLowerCase()
  if (nameLower && selMatIds.includes(`__name__:${nameLower}`)) return true
  for (let idx = 0; idx < matSuggestions.length; idx++) {
    const m = matSuggestions[idx]
    if (!selMatIds.includes(materialSelectionKey(m, idx))) continue
    const mid = m.materialId?.trim()
    if (mid && mid === mat.id) return true
    if (nameLower && (m.materialName?.trim().toLowerCase() ?? "") === nameLower) return true
  }
  return false
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
     // eslint-disable-next-line prefer-const
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
      if (Object.keys(result).length === 0) {
         result["Phân loại"] = leftoverSegments.join(", ");
      } else {
         result["Khác"] = leftoverSegments.join(", ");
      }
  }
  
  return result;
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
  const { commissionPercent, loading: platformFeeLoading } = useSellerPlatformFee()

  const [name, setName] = React.useState("")
  const [price, setPrice] = React.useState("")
  const [priceRaw, setPriceRaw] = React.useState(0)
  const [sku, setSku] = React.useState("")
  const [baseStock, setBaseStock] = React.useState("0")
  const [useVariants, setUseVariants] = React.useState(false)
  const [variantRows, setVariantRows] = React.useState<VariantDraftRow[]>(() => [newVariantDraftRow()])
  const [description, setDescription] = React.useState("")
  const [descSheetOpen, setDescSheetOpen] = React.useState(false)
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

  // materials & tags: tải 1 lần toàn bộ khi dialog mở, filter client-side
  const [allPlatformMaterials, setAllPlatformMaterials] = React.useState<MaterialDto[]>([])
  const [platformMaterials, setPlatformMaterials] = React.useState<MaterialDto[]>([])
  const [allPlatformTags, setAllPlatformTags] = React.useState<Tag[]>([])
  const [platformTags, setPlatformTags] = React.useState<Tag[]>([])
  const [platformMatQuery, setPlatformMatQuery] = React.useState("")
  const [platformTagQuery, setPlatformTagQuery] = React.useState("")
  const [platformMatLoading, setPlatformMatLoading] = React.useState(false)
  const [platformTagLoading, setPlatformTagLoading] = React.useState(false)
  const [matDialogOpen, setMatDialogOpen] = React.useState(false)
  const [tagDialogOpen, setTagDialogOpen] = React.useState(false)

  const matLoadingRef = React.useRef(false)
  const tagLoadingRef = React.useRef(false)

  const [selCategory, setSelCategory] = React.useState<CategorySuggestion | null>(null)
  const [selTagIds, setSelTagIds] = React.useState<number[]>([])
  const [selMatIds, setSelMatIds] = React.useState<string[]>([])
  const [nameTouched, setNameTouched] = React.useState(false)
  const [priceTouched, setPriceTouched] = React.useState(false)

  const hasInput = name.trim().length > 0 || description.trim().length > 0
  const analysisReqRef = React.useRef(0)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedManualCatQuery(manualCatQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [manualCatQuery])

  // Material: filter client-side (không phụ thuộc server search — tránh case-sensitive)
  React.useEffect(() => {
    const removeDiacritics = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "")
    const q = removeDiacritics(platformMatQuery.trim().toLowerCase().normalize("NFC"))
    if (!q) { setPlatformMaterials(allPlatformMaterials); return }
    setPlatformMaterials(
      allPlatformMaterials.filter((m) =>
        removeDiacritics(m.name.toLowerCase().normalize("NFC")).includes(q)
      )
    )
  }, [platformMatQuery, allPlatformMaterials])

  // Tag: filter client-side (bỏ dấu)
  React.useEffect(() => {
    const removeDiacritics = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "")
    const q = removeDiacritics(platformTagQuery.trim().toLowerCase().normalize("NFC"))
    if (!q) { setPlatformTags(allPlatformTags); return }
    setPlatformTags(
      allPlatformTags.filter((t) =>
        removeDiacritics(t.name.toLowerCase().normalize("NFC")).includes(q)
      )
    )
  }, [platformTagQuery, allPlatformTags])

  const manualCategoryOptions = React.useMemo(() => {
    // Chỉ cho seller chọn category cấp 2 — đồng nhất rule với BE.
    const tier2 = manualCategoryRows.filter((c) => c.level === 2)
    const q = debouncedManualCatQuery.trim().toLowerCase()
    if (!q) return tier2.slice(0, 12)
    return tier2
      .filter(
        (c) =>
          c.pathLabel.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      )
      .slice(0, 24)
  }, [manualCategoryRows, debouncedManualCatQuery])

  const groupedPlatformMaterials = React.useMemo(() => {
    if (platformMatQuery.trim()) {
      return platformMaterials.length > 0
        ? [{ label: "Kết quả tìm kiếm", items: platformMaterials }]
        : []
    }
    return groupMaterialsForPicker(platformMaterials)
  }, [platformMaterials, platformMatQuery])

  const groupedPlatformTags = React.useMemo(() => {
    if (platformTagQuery.trim()) {
      return platformTags.length > 0
        ? [{ label: "Kết quả tìm kiếm", items: platformTags }]
        : []
    }
    return groupTagsForPicker(platformTags)
  }, [platformTags, platformTagQuery])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const treeRes = await getCategoryTree()
        if (!mounted) return
        if (!treeRes.success) {
          return
        }
        const fullTree = treeRes.tree ?? []
        setManualCategoryRows(flattenCategoryTree(fullTree))
      } catch { /* ignore */ }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Tải toàn bộ materials 1 lần (không search server) → filter client-side
  const loadPlatformMaterials = React.useCallback(async () => {
    if (matLoadingRef.current || allPlatformMaterials.length > 0) return
    matLoadingRef.current = true
    setPlatformMatLoading(true)
    try {
      const res = await fetchSellerMaterials(1, 500)
      if (res.success) {
        const items = res.materials ?? []
        setAllPlatformMaterials(items)
        setPlatformMaterials(items)
      }
    } catch (err) {
      toast.error(`Không tải được chất liệu: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      matLoadingRef.current = false
      setPlatformMatLoading(false)
    }
  }, [allPlatformMaterials.length])

  // Tải toàn bộ tags 1 lần → filter client-side (giống material)
  const loadPlatformTags = React.useCallback(async () => {
    if (tagLoadingRef.current || allPlatformTags.length > 0) return
    tagLoadingRef.current = true
    setPlatformTagLoading(true)
    try {
      const res = await fetchSellerTags(1, 600)
      if (res.success) {
        const items = res.tags ?? []
        setAllPlatformTags(items)
        setPlatformTags(items)
      }
    } catch (err) {
      toast.error(`Không tải được thẻ: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      tagLoadingRef.current = false
      setPlatformTagLoading(false)
    }
  }, [allPlatformTags.length])

  // Material: tải 1 lần khi dialog mở lần đầu
  React.useEffect(() => {
    if (matDialogOpen) {
      loadPlatformMaterials()
    }
  }, [matDialogOpen, loadPlatformMaterials])

  // Tag: tải 1 lần khi dialog mở lần đầu
  React.useEffect(() => {
    if (tagDialogOpen) {
      loadPlatformTags()
    }
  }, [tagDialogOpen, loadPlatformTags])


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
    const batch = imageUrls.slice(0, 3).map(async (u) => {
      if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:image/")) {
        return u
      }
      if (u.startsWith("blob:")) {
        try {
          const dataUrl = await blobUrlToDataUrl(u)
          return dataUrl.startsWith("data:image/") ? dataUrl : null
        } catch {
          return null
        }
      }
      return null
    })
    return (await Promise.all(batch)).filter((u): u is string => u != null && u.length > 0)
  }, [imageUrls, blobUrlToDataUrl])

  /** Áp dụng gợi ý từ AI; seller chốt danh mục / tag / chất liệu. Sản phẩm vẫn cần admin duyệt. */
  const applyAnalysisResult = React.useCallback((
    categories: CategorySuggestion[],
    tags: TagSuggestion[],
    materials: MaterialSuggestion[],
  ) => {
    setCatSuggestions(categories ?? [])
    setSelCategory((prev) => {
      const list = categories ?? []
      if (prev && list.some((c) => c.categoryId === prev.categoryId)) return prev
      return list[0] ?? null
    })
    setTagSuggestions(tags ?? [])
    setSelTagIds(
      (tags ?? []).map((t) => parseTagIdFromSuggestion(t as TagSuggestion & { tag_id?: unknown }))
        .filter((id): id is number => id != null)
    )
    setMatSuggestions(materials ?? [])
    setSelMatIds(
      Array.from(
        new Set((materials ?? []).map((m, idx) => materialSelectionKey(m, idx))),
      ),
    )
  }, [])

  const runAiAnalysis = React.useCallback(async () => {
    const hasImages = imageUrls.length > 0
    if (!hasInput && !hasImages) {
      toast.info("Nhập thông tin hoặc thêm ảnh trước khi phân tích")
      return
    }

    const reqId = ++analysisReqRef.current
    setCatLoading(true)
    setTagLoading(true)
    setImageAnalyzeLoading(true)
    setCatError(false)
    setCatSuggestions([])
    setTagSuggestions([])
    setMatSuggestions([])
    setSelCategory(null)
    setSelTagIds([])
    setSelMatIds([])

    try {
      const aiImageUrls = hasImages ? await normalizeAiImageUrls() : []
      if (reqId !== analysisReqRef.current) return
      const hasUsableImages = aiImageUrls.length > 0
      if (hasUsableImages) {
        // Đã có ảnh: Dùng API AnalyzeImage (AI tự kết hợp Multimodal: xem ảnh + đọc title/description)
        const imageRes = await aiAnalyzeImage({
          imageUrls: aiImageUrls,
          productTitle: name.trim() || undefined,
          productDescription: description.trim() || undefined,
        })
        if (reqId !== analysisReqRef.current) return
        
        if (imageRes.success) {
          setImageAnalyzeResult(imageRes)
          applyAnalysisResult(imageRes.suggestedCategories, imageRes.suggestedTags, imageRes.suggestedMaterials)
        } else {
          setImageAnalyzeResult(null)
          setCatError(true)
        }
      } else {
        // Không có ảnh: Dùng API AnalyzeProduct (text-only)
        setImageAnalyzeResult(null)
        if (!hasInput) return
        
        const res = await aiAnalyzeProduct({
          title: name.trim(),
          description: description.trim() || undefined,
        })
        if (reqId !== analysisReqRef.current) return
        
        if (res.success) {
          applyAnalysisResult(res.categories, res.tags, res.materials)
        } else {
          setCatError(true)
        }
      }
    } catch {
      if (reqId !== analysisReqRef.current) return
      setCatError(true)
      toast.error("Không thể phân tích AI. Vui lòng thử lại")
    } finally {
      if (reqId !== analysisReqRef.current) return
      setCatLoading(false)
      setTagLoading(false)
      setImageAnalyzeLoading(false)
    }
  }, [hasInput, imageUrls, name, description, normalizeAiImageUrls, applyAnalysisResult])

  const handleSelectCategory = (cat: CategorySuggestion) => {
    // Cross-check level từ manualCategoryRows (BE trả về). Nếu AI suggestion là
    // tier 1 (root), reject để buộc seller chọn category cụ thể hơn.
    const meta = manualCategoryRows.find((r) => r.id === cat.categoryId)
    if (meta && meta.level !== 2) {
      toast.error(
        meta.level === 1
          ? `"${cat.categoryName}" là danh mục cấp 1 (quá rộng). Hãy chọn 1 danh mục cấp 2 cụ thể hơn.`
          : `"${cat.categoryName}" không phải danh mục cấp 2. Vui lòng chọn lại.`
      )
      return
    }
    setSelCategory((prev) => {
      if (prev?.categoryId !== cat.categoryId) {
        setSelTagIds([])
        setSelMatIds([])
      }
      return cat
    })
  }

  const handleSubmit = async () => {
    if (!name.trim() || !price) return
    if (!selCategory?.categoryId) {
      toast.error("Vui lòng chọn danh mục sản phẩm (thủ công hoặc qua gợi ý AI).")
      return
    }

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
      materialIds: (() => {
        const ids = selMatIds.filter(isPersistableMaterialId)
        return ids.length > 0 ? ids : undefined
      })(),
    }

    const createResult = useVariants
      ? await create({
          ...basePayload,
          variants: variantRows
            .filter((r) => r.variantName.trim().length > 0)
            .map((r) => {
              const priceStr = r.price.replace(/[^0-9]/g, "")
              const rowPrice = priceStr ? Number(priceStr) : undefined

              let finalAttributes: string | undefined = undefined;
              const attrStr = r.attributes.trim();
              if (attrStr) {
                finalAttributes = JSON.stringify(parseAttributesStr(attrStr));
              }

              return {
                variantName: r.variantName.trim(),
                sku: r.sku.trim() || undefined,
                price: rowPrice !== undefined && Number.isFinite(rowPrice) && rowPrice > 0 ? rowPrice : undefined,
                quantity: Math.max(0, Math.floor(Number(r.quantity) || 0)),
                attributes: finalAttributes,
              }
            }),
        })
      : await create({
          ...basePayload,
          quantity: Math.max(0, Math.floor(Number(baseStock) || 0)),
        })

    if (createResult.success && createResult.productId) {
      const chosenTagNames = resolveChosenTagNames(selTagIds, tagSuggestions, platformTags)
      const suggestedTags = tagSuggestions
        .filter((s) => s.tagName?.trim())
        .map((s) => ({
          tagName: s.tagName.trim(),
          confidenceScore: tagConfidenceForCommit(s),
        }))
      const suggestedMaterials = buildSuggestedMaterialsForCommit(matSuggestions)
      const chosenMaterialIds = selMatIds.filter(isPersistableMaterialId)
      if (
        suggestedTags.length > 0 ||
        chosenTagNames.length > 0 ||
        suggestedMaterials.length > 0 ||
        chosenMaterialIds.length > 0
      ) {
        try {
          await aiCommitProductTagSession({
            productId: createResult.productId,
            title: name.trim(),
            description: description.trim() || undefined,
            categoryId: selCategory?.categoryId,
            suggestedTags,
            chosenTagNames,
            suggestedMaterials,
            chosenMaterialIds,
          })
        } catch {
          toast.warning("Đã tạo sản phẩm nhưng chưa lưu được lịch sử gợi ý AI (tag/chất liệu).")
        }
      }
    }

    if (createResult.success) {
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
    name.trim().length > 0 &&
    priceRaw > 0 &&
    Boolean(selCategory?.categoryId) &&
    variantRowsValid &&
    !uploadingImages
  const confidenceBadge = selCategory?.confidenceScore ?? catSuggestions[0]?.confidenceScore

  // ── Tag & material toggles ───────────────────────────
  const toggleTag = (id: number) =>
    setSelTagIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  const toggleMat = (id: string) =>
    setSelMatIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])

  const togglePlatformMat = (mat: MaterialDto) => {
    const key = mat.id
    const nameKey = `__name__:${mat.name.trim().toLowerCase()}`
    setSelMatIds((p) =>
      p.includes(key)
        ? p.filter((x) => x !== key)
        : [...p.filter((x) => x !== nameKey), key],
    )
  }

  const togglePlatformTag = (tag: Tag) => {
    setSelTagIds((p) => p.includes(tag.id) ? p.filter((x) => x !== tag.id) : [...p, tag.id])
  }

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

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-10 lg:items-stretch">

          <div className="lg:col-span-6 flex flex-col gap-4 lg:h-full">
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
                    onBlur={() => setNameTouched(true)}
                    className={`h-9 text-sm ${nameTouched && !name.trim() ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                  />
                  {nameTouched && !name.trim() && (
                    <p className="text-[11px] text-red-500">Tên sản phẩm là bắt buộc</p>
                  )}
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
                        const digits = e.target.value.replace(/[^0-9]/g, "")
                        const num = digits === "" ? 0 : Number(digits)
                        setPriceRaw(num)
                        setPrice(digits === "" ? "" : num.toLocaleString("vi-VN"))
                      }}
                      onBlur={() => setPriceTouched(true)}
                      className={`h-9 pl-7 text-sm ${priceTouched && priceRaw <= 0 ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    />
                  </div>
                  {priceTouched && priceRaw <= 0 && (
                    <p className="text-[11px] text-red-500">Giá bán phải lớn hơn 0</p>
                  )}
                  <SellerPlatformFeeHint
                    commissionPercent={commissionPercent}
                    loading={platformFeeLoading}
                    grossVnd={!useVariants && priceRaw > 0 ? priceRaw : undefined}
                    isMultiPrice={useVariants}
                    className="mt-1"
                  />
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
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-semibold">₫</span>
                              <Input
                                inputMode="numeric"
                                value={row.price}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/[^0-9]/g, "")
                                  const formatted = digits === "" ? "" : Number(digits).toLocaleString("vi-VN")
                                  setVariantRows((p) =>
                                    p.map((r) => (r.id === row.id ? { ...r, price: formatted } : r))
                                  )
                                }}
                                placeholder="Trống = giá gốc"
                                className="h-8 pl-5 text-xs"
                              />
                            </div>
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
                          <div className="sm:col-span-12 grid gap-1 mt-1">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                              Thuộc tính <span className="text-muted-foreground/60 normal-case tracking-normal">(Tùy chọn)</span>
                            </span>
                            <Input
                              value={row.attributes}
                              onChange={(e) =>
                                setVariantRows((p) =>
                                  p.map((r) => (r.id === row.id ? { ...r, attributes: e.target.value } : r))
                                )
                              }
                              placeholder="VD: Màu: Đỏ, Size: L"
                              className="h-8 text-xs"
                            />
                            <p className="text-[10px] text-muted-foreground mt-0.5 mb-1.5">
                              Hệ thống tự nhận diện các thuộc tính theo định dạng <strong className="font-semibold text-foreground/80">Khóa: Giá trị</strong>, phân tách bằng dấu phẩy.
                            </p>
                            {row.attributes.trim() && (
                              <div className="rounded bg-emerald-50 text-emerald-700 px-2.5 py-1.5 text-[10px] mt-1 border border-emerald-100/50">
                                <span className="font-semibold opacity-75 mr-1">Đã nhận diện:</span>
                                {Object.entries(parseAttributesStr(row.attributes)).map(([k, v]) => (
                                  <span key={k} className="inline-flex items-center gap-1 mr-2 px-1 rounded bg-white shadow-sm border border-emerald-100">
                                    <span className="font-semibold opacity-80">{k}:</span>
                                    <span>{v}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label className="text-xs">Mô tả sản phẩm</Label>
                  <button
                    type="button"
                    onClick={() => setDescSheetOpen(true)}
                    className="w-full text-left rounded-xl border bg-muted/20 border-muted hover:border-primary/50 transition-colors px-3 py-2.5 min-h-[72px] group"
                  >
                    {description ? (
                      <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">{description}</p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">Nhấn để nhập mô tả sản phẩm...</p>
                    )}
                    <span className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-primary transition-colors">
                      <IconAlignLeft className="size-3" /> Nhấn để chỉnh sửa
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="!rounded">
              <CardContent className="grid gap-3">
                <div className="relative w-full">
                <div
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer select-none w-full ${
                    imageUrls.length >= 6
                      ? "cursor-not-allowed border-muted-foreground/25"
                      : isDragging
                        ? "border-primary"
                        : "border-muted-foreground/25 hover:border-primary/50"
                  } ${hasMainPreview ? "aspect-[3/2] sm:aspect-[4/3] overflow-hidden p-0" : "min-h-[160px] p-5 sm:min-h-[180px] sm:p-6"}`}
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
                </div>

                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
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

                <div className="flex w-full min-w-0 gap-2">
                  <Input
                    placeholder="Hoặc dán URL ảnh vào đây..."
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl() } }}
                    className="h-8 min-w-0 flex-1 text-xs"
                    disabled={imageUrls.length >= 6}
                  />
                  <Button type="button" variant="outline" size="sm" className="h-8 px-2"
                    onClick={addImageUrl} disabled={!imageInput.trim() || imageUrls.length >= 6}>
                    <IconPlus className="size-3.5" />
                  </Button>
                </div>
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

          <div className="lg:col-span-4 flex flex-col gap-4 lg:h-full min-w-0">
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

                  {catLoading ? (
                    <div className="flex items-center gap-2 rounded-xl border border-[#cfd8c7] bg-white p-3 text-[11px] text-[#6d7f62]">
                      <IconLoader2 className="size-3 animate-spin text-[#70885a]" />
                      Đang phân tích danh mục...
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {catError && (
                        <div className="flex items-center gap-2 rounded-xl border border-dashed border-red-200 bg-red-50 p-3 text-[11px] text-red-500">
                          <IconAlertCircle className="size-3.5 shrink-0" />
                          <span>
                            Không thể kết nối AI. Bạn vẫn có thể chọn danh mục thủ công bên dưới.
                          </span>
                        </div>
                      )}

                      {!catError && catSuggestions.length > 0 && (
                        <>
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
                        </>
                      )}

                      {!catError && catSuggestions.length === 0 && (
                        <div className="rounded-xl border border-dashed border-[#c6d1bc] bg-white p-3 text-center text-[11px] text-[#7c8f72]">
                          Chưa phân tích AI — bấm &quot;Bắt đầu phân tích&quot; hoặc chọn danh mục thủ công bên dưới.
                        </div>
                      )}

                      <div className="rounded-xl border border-dashed border-[#c9d3bf] bg-[#fafcf8] p-2.5">
                        <p className="mb-2 text-[11px] text-[#6d7f62]">
                          {catSuggestions.length > 0
                            ? "Không đúng gợi ý? Chọn danh mục thủ công:"
                            : "Chọn danh mục thủ công:"}
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
                                <span className="block line-clamp-2 break-words">{c.pathLabel}</span>
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
                    <div className="rounded-xl border border-dashed border-[#c6d1bc] bg-[#fafcf8] p-3 text-[11px] text-[#7c8f72]">
                      Chọn danh mục ở trên để thêm chất liệu (gợi ý AI hoặc nút + chọn từ nền tảng).
                    </div>
                  ) : tagLoading ? (
                    <div className="flex items-center gap-2 text-[11px] text-[#728568]">
                      <IconLoader2 className="size-3 animate-spin text-[#6f8659]" /> Đang tải...
                    </div>
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

                      {platformMaterials
                        .filter(
                          (mat) =>
                            isPlatformMatSelected(mat, selMatIds, matSuggestions) &&
                            !matSuggestions.some(
                              (m) =>
                                (m.materialId && m.materialId === mat.id) ||
                                (m.materialName?.trim().toLowerCase() === mat.name.trim().toLowerCase()),
                            )
                        )
                        .map((mat) => (
                          <button
                            key={`platform-mat-${mat.id}`}
                            type="button"
                            onClick={() => togglePlatformMat(mat)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#8ea27a] bg-white px-3 py-1 text-xs font-medium text-[#415337] transition-all hover:border-red-300 hover:text-red-500"
                          >
                            {mat.name}
                            <IconCheck className="size-3.5" />
                          </button>
                        ))}

                      {matSuggestions.length === 0 &&
                        platformMaterials.filter(
                          (mat) =>
                            isPlatformMatSelected(mat, selMatIds, matSuggestions) &&
                            !matSuggestions.some(
                              (m) =>
                                (m.materialId && m.materialId === mat.id) ||
                                (m.materialName?.trim().toLowerCase() === mat.name.trim().toLowerCase()),
                            )
                        ).length === 0 && (
                        <span className="text-[11px] italic text-[#8a9a80]">
                          Không có gợi ý từ AI
                        </span>
                      )}

                      <>
                          <button
                            type="button"
                            onClick={() => setMatDialogOpen(true)}
                            className="inline-flex items-center justify-center size-7 rounded-full border-2 border-dashed border-[#9db183] bg-white text-[#6b7f5e] hover:border-[#5a7248] hover:bg-[#f2f7ee] transition-all"
                            title="Chọn chất liệu từ nền tảng"
                          >
                            <IconPlus className="size-3.5" />
                          </button>

                          <Dialog open={matDialogOpen} onOpenChange={setMatDialogOpen}>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle className="text-sm font-semibold text-[#44553a]">Chọn chất liệu</DialogTitle>
                                <p className="text-[11px] font-normal text-muted-foreground pt-0.5">
                                  Đã gom nhóm theo loại (ước lượng từ tên). Dùng ô tìm kiếm để thu hẹp nhanh.
                                </p>
                              </DialogHeader>
                              <div className="relative">
                                <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                <Input
                                  value={platformMatQuery}
                                  onChange={(e) => setPlatformMatQuery(e.target.value)}
                                  placeholder="Tìm chất liệu..."
                                  className="h-9 pl-8 text-sm"
                                  autoFocus
                                />
                              </div>
                              {platformMatLoading ? (
                                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                                  <IconLoader2 className="size-4 animate-spin" /> Đang tải...
                                </div>
                              ) : (
                                <div className="max-h-72 overflow-y-auto py-1 pr-1 space-y-2">
                                  {groupedPlatformMaterials.map(({ label: matGroupLabel, items: matGroupItems }) => {
                                    if (matGroupItems.length === 0) return null
                                    const hasSel = matGroupItems.some((mat) =>
                                      isPlatformMatSelected(mat, selMatIds, matSuggestions),
                                    )
                                    const isSearchResult = matGroupLabel === "Kết quả tìm kiếm"
                                    return (
                                      <details
                                        key={matGroupLabel}
                                        className="rounded-lg border border-[#e3eadb] bg-[#fafcf8] px-2 py-1"
                                        open
                                      >
                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1.5 text-[11px] font-semibold text-[#44553a] [&::-webkit-details-marker]:hidden">
                                          <span>{matGroupLabel}</span>
                                          <span className="font-normal text-muted-foreground">{matGroupItems.length}</span>
                                        </summary>
                                        <div className="flex flex-wrap gap-2 pb-2 pt-0.5">
                                          {matGroupItems.map((mat) => {
                                            const active = isPlatformMatSelected(mat, selMatIds, matSuggestions)
                                            return (
                                              <button
                                                key={mat.id}
                                                type="button"
                                                onClick={() => togglePlatformMat(mat)}
                                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                                                  active
                                                    ? "border-[#8ea27a] bg-[#e9f0e2] text-[#415337]"
                                                    : "border-[#cfd8c6] bg-white text-[#718267] hover:border-[#8ea27a] hover:bg-[#f2f6ee]"
                                                }`}
                                              >
                                                {mat.name}
                                                {active && <IconCheck className="size-3.5" />}
                                              </button>
                                            )
                                          })}
                                        </div>
                                      </details>
                                    )
                                  })}
                                  {platformMaterials.length === 0 && (
                                    <p className="w-full text-center text-sm italic text-muted-foreground py-4">Không tìm thấy chất liệu</p>
                                  )}
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Đã chọn: <span className="font-semibold text-foreground">{selMatIds.length}</span> chất liệu
                              </p>
                            </DialogContent>
                          </Dialog>
                      </>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#dce3d5] pt-3">
                  <SectionLabel icon={IconTag}>Thẻ gợi ý</SectionLabel>
                  {!selCategory ? (
                    <div className="rounded-xl border border-dashed border-[#c6d1bc] bg-[#fffdfb] p-3 text-[11px] text-[#7c8f72]">
                      Chọn danh mục ở trên để thêm thẻ (gợi ý AI hoặc nút + chọn từ nền tảng).
                    </div>
                  ) : tagLoading ? (
                    <div className="flex items-center gap-2 text-[11px] text-[#728568]">
                      <IconLoader2 className="size-3 animate-spin text-[#6f8659]" /> Đang tải...
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tagSuggestions.map((tag, idx) => {
                        const tagId = parseTagIdFromSuggestion(tag as TagSuggestion & { tag_id?: unknown })
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
                            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
                              active
                                ? "border-[#e8b37f] bg-white text-[#b06017]"
                                : "border-[#efd4b7] bg-white text-[#c06f2a] hover:border-[#e8b37f]"
                            }`}
                          >
                            #{tag.tagName}
                            {active && <IconCheck className="size-3" />}
                          </button>
                        )
                      })}

                      {/* Chip cho tag được chọn từ platform (không có trong AI suggestions) */}
                      {platformTags
                        .filter(
                          (t) =>
                            selTagIds.includes(t.id) &&
                            !tagSuggestions.some(
                              (s) => parseTagIdFromSuggestion(s as TagSuggestion & { tag_id?: unknown }) === t.id
                            )
                        )
                        .map((t) => (
                          <button
                            key={`platform-tag-${t.id}`}
                            type="button"
                            onClick={() => togglePlatformTag(t)}
                            className="inline-flex items-center gap-1 rounded-md border border-[#e8b37f] bg-white px-2.5 py-1 text-xs font-medium text-[#b06017] transition-all hover:border-red-300 hover:text-red-500"
                          >
                            #{t.name}
                            <IconCheck className="size-3" />
                          </button>
                        ))}

                      {tagSuggestions.length === 0 &&
                        platformTags.filter(
                          (t) =>
                            selTagIds.includes(t.id) &&
                            !tagSuggestions.some(
                              (s) => parseTagIdFromSuggestion(s as TagSuggestion & { tag_id?: unknown }) === t.id
                            )
                        ).length === 0 &&
                        selCategory && !tagLoading && (
                        <span className="text-[11px] italic text-[#8a9a80]">Không có gợi ý tag từ AI</span>
                      )}

                      {/* „+" badge mở Popover chọn từ nền tảng */}
                      <>
                          <button
                            type="button"
                            onClick={() => setTagDialogOpen(true)}
                            className="inline-flex items-center justify-center size-7 rounded-md border-2 border-dashed border-[#e8b37f] bg-white text-[#c06f2a] hover:border-[#d49640] hover:bg-[#fdf5eb] transition-all"
                            title="Chọn thẻ từ nền tảng"
                          >
                            <IconPlus className="size-3.5" />
                          </button>

                          <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle className="text-sm font-semibold text-[#8a3d05]">Chọn thẻ</DialogTitle>
                                <p className="text-[11px] font-normal text-muted-foreground pt-0.5">
                                  Đã nhóm theo loại (màu sắc, kiểu dáng, tính năng…). Dùng ô tìm để thu hẹp.
                                </p>
                              </DialogHeader>
                              <div className="relative">
                                <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                <Input
                                  value={platformTagQuery}
                                  onChange={(e) => setPlatformTagQuery(e.target.value)}
                                  placeholder="Tìm thẻ..."
                                  className="h-9 pl-8 text-sm"
                                  autoFocus
                                />
                              </div>
                              {platformTagLoading ? (
                                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                                  <IconLoader2 className="size-4 animate-spin" /> Đang tải...
                                </div>
                              ) : (
                                <div className="max-h-[420px] overflow-y-auto py-1 pr-1 space-y-2">
                                  {groupedPlatformTags.map(({ label: tagGroupLabel, items: tagGroupItems }) => {
                                    if (tagGroupItems.length === 0) return null
                                    return (
                                      <details
                                        key={tagGroupLabel}
                                        className="rounded-lg border border-[#f0e0d0] bg-[#fffdfb] px-2 py-1"
                                        open
                                      >
                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1.5 text-[11px] font-semibold text-[#8a3d05] [&::-webkit-details-marker]:hidden">
                                          <span>{tagGroupLabel}</span>
                                          <span className="font-normal text-muted-foreground">{tagGroupItems.length}</span>
                                        </summary>
                                        <div className="flex flex-wrap gap-2 pb-2 pt-0.5">
                                          {tagGroupItems.map((tag) => {
                                            const active = selTagIds.includes(tag.id)
                                            return (
                                              <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => togglePlatformTag(tag)}
                                                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                                                  active
                                                    ? "border-[#e8b37f] bg-[#fdf0e2] text-[#b06017]"
                                                    : "border-[#efd4b7] bg-white text-[#c06f2a] hover:border-[#e8b37f] hover:bg-[#fdf5eb]"
                                                }`}
                                              >
                                                #{tag.name}
                                                {active && <IconCheck className="size-3.5" />}
                                              </button>
                                            )
                                          })}
                                        </div>
                                      </details>
                                    )
                                  })}
                                  {platformTags.length === 0 && (
                                    <p className="w-full text-center text-sm italic text-muted-foreground py-4">Không tìm thấy thẻ</p>
                                  )}
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Đã chọn: <span className="font-semibold text-foreground">{selTagIds.length}</span> thẻ
                              </p>
                            </DialogContent>
                          </Dialog>
                      </>
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

                {!hasInput && catSuggestions.length === 0 && !catLoading && (
                  <div className="rounded-xl border border-dashed border-[#c7d2bd] bg-white p-3 text-center text-[11px] italic leading-relaxed text-[#7b8d71]">
                    Nhập tên hoặc mô tả sản phẩm để AI gợi ý danh mục
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

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
              id="desc-sheet-new-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả chi tiết sản phẩm: chất liệu, kích thước, hướng dẫn sử dụng..."
              className="text-sm resize-none h-full min-h-[400px] rounded-xl"
            />
          </div>

          <SheetFooter className="px-6 py-4 border-t flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDescSheetOpen(false)}
            >
              Đóng
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-xl gap-1.5"
              onClick={() => setDescSheetOpen(false)}
            >
              <IconCheck className="size-3.5" />
              Xác nhận
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
