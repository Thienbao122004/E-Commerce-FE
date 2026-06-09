"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSellerProducts } from "@/hooks/use-seller-products"
import { useSellerPlatformFee } from "@/hooks/use-seller-platform-fee"
import { aiAnalyzeProduct, aiAnalyzeImage, aiCommitProductTagSession, aiValidateLocalBrand } from "@/services/ai-seller"
import { getCategoryTree, type StorefrontCategory } from "@/services/storefront-categories"
import { getLocalSpecialtyProfiles, type LocalSpecialtyProfile } from "@/services/local-specialty"
import { supabase } from "@/lib/supabase"
import { groupMaterialsForPicker, groupTagsForPicker } from "@/lib/seller-picker-groups"
import { fetchSellerMaterials, fetchSellerTags } from "@/services/seller-dashboard"
import type { AnalyzeImageResponse, CategorySuggestion, TagSuggestion, MaterialSuggestion } from "@/services/ai-seller"
import type { MaterialDto } from "@/services/admin-materials"
import type { Tag } from "@/types/tag"
import { newVariantDraftRow, type VariantDraftRow, parseAttributesStr } from "./product-variants"
import { formatNumberVN } from "@/lib/formatters"
import {
  parseTagIdFromSuggestion, tagConfidenceForCommit, isPersistableMaterialId,
  buildSuggestedMaterialsForCommit, materialSelectionKey,
} from "./product-form-utils"

type ManualCategoryRow = { id: number; name: string; pathLabel: string; level: number }

function flattenCategoryTree(nodes: StorefrontCategory[], prefix = ""): ManualCategoryRow[] {
  const out: ManualCategoryRow[] = []
  for (const n of nodes) {
    const pathLabel = prefix ? `${prefix} › ${n.name}` : n.name
    out.push({ id: n.id, name: n.name, pathLabel, level: n.level })
    if (n.subcategories?.length) out.push(...flattenCategoryTree(n.subcategories, pathLabel))
  }
  return out
}

async function resolveImageUrlForProduct(u: string): Promise<string> {
  const trimmed = u.trim()
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) return trimmed
  if (!trimmed.startsWith("blob:")) throw new Error(`Không hỗ trợ định dạng ảnh: ${trimmed.slice(0, 24)}…`)
  const res = await fetch(trimmed)
  const blob = await res.blob()
  if (!blob.type.startsWith("image/")) throw new Error("File đã chọn không phải ảnh hợp lệ")
  const sub = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg"
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${sub}`
  const { data, error } = await supabase.storage.from("product-images").upload(path, blob, { cacheControl: "3600", upsert: false })
  if (error) throw error
  const { data: pub } = supabase.storage.from("product-images").getPublicUrl(data.path)
  return pub.publicUrl
}

function findBestLocalProfile(
  name: string,
  description: string,
  profiles: LocalSpecialtyProfile[]
): number | null {
  const titleLower = name.toLowerCase()
  const descLower = description.toLowerCase()

  let bestProfileId: number | null = null
  let maxScore = 0
  let isTie = false

  for (const profile of profiles) {
    let score = 0

    // 1. Kiểm tra tên archetype trùng khớp trực tiếp trong tên sản phẩm (trọng số cao)
    if (profile.archetypeName && titleLower.includes(profile.archetypeName.toLowerCase())) {
      score += 100
    }

    // 2. Kiểm tra tên tỉnh trùng khớp trực tiếp trong tên sản phẩm (trọng số vừa)
    if (profile.provinceName && titleLower.includes(profile.provinceName.toLowerCase())) {
      score += 50
    }

    // 3. Khớp các từ khóa phụ
    if (profile.keywords && profile.keywords.length > 0) {
      for (const kw of profile.keywords) {
        const kwLower = kw.toLowerCase().trim()
        if (!kwLower) continue

        if (titleLower.includes(kwLower)) {
          // Điểm cao hơn cho từ khóa dài hơn/cụ thể hơn
          score += kwLower.length * 2
        }

        if (descLower.includes(kwLower)) {
          score += kwLower.length * 0.5
        }
      }
    }

    if (score > maxScore) {
      maxScore = score
      bestProfileId = profile.id
      isTie = false
    } else if (score === maxScore && score > 0) {
      isTie = true
    }
  }

  // Chỉ tự động chọn nếu có một cấu hình duy nhất vượt trội và vượt qua ngưỡng tối thiểu
  return !isTie && maxScore >= 10 ? bestProfileId : null
}

const MIN_TRAITS = 3

export function useCreateProductForm() {
  const router = useRouter()
  const { create, actionLoading } = useSellerProducts()
  const { commissionPercent, loading: platformFeeLoading } = useSellerPlatformFee()

  // Basic
  const [name, setName] = React.useState("")
  const [price, setPrice] = React.useState("")
  const [priceRaw, setPriceRaw] = React.useState(0)
  const [sku, setSku] = React.useState("")
  const [baseStock, setBaseStock] = React.useState("0")
  const [description, setDescription] = React.useState("")
  const [descSheetOpen, setDescSheetOpen] = React.useState(false)
  const [nameTouched, setNameTouched] = React.useState(false)
  const [priceTouched, setPriceTouched] = React.useState(false)

  // Variants
  const [useVariants, setUseVariants] = React.useState(false)
  const [variantRows, setVariantRows] = React.useState<VariantDraftRow[]>(() => [newVariantDraftRow()])

  // Images
  const [imageUrls, setImageUrls] = React.useState<string[]>([])
  const [imageInput, setImageInput] = React.useState("")
  const [isDragging, setIsDragging] = React.useState(false)
  const [brokenUrls, setBrokenUrls] = React.useState<Set<string>>(new Set())
  const [uploadingImages, setUploadingImages] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // AI
  const [catLoading, setCatLoading] = React.useState(false)
  const [tagLoading, setTagLoading] = React.useState(false)
  const [imageAnalyzeLoading, setImageAnalyzeLoading] = React.useState(false)
  const [catError, setCatError] = React.useState(false)
  const [imageAnalyzeResult, setImageAnalyzeResult] = React.useState<AnalyzeImageResponse | null>(null)
  const [catSuggestions, setCatSuggestions] = React.useState<CategorySuggestion[]>([])
  const [tagSuggestions, setTagSuggestions] = React.useState<TagSuggestion[]>([])
  const [matSuggestions, setMatSuggestions] = React.useState<MaterialSuggestion[]>([])
  const analysisReqRef = React.useRef(0)

  // Category
  const [manualCategoryRows, setManualCategoryRows] = React.useState<ManualCategoryRow[]>([])
  const [manualCatQuery, setManualCatQuery] = React.useState("")
  const [debouncedManualCatQuery, setDebouncedManualCatQuery] = React.useState("")
  const [selCategory, setSelCategory] = React.useState<CategorySuggestion | null>(null)

  // Tags & Materials
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
  const [selTagIds, setSelTagIds] = React.useState<number[]>([])
  const [selMatIds, setSelMatIds] = React.useState<string[]>([])
  const matLoadingRef = React.useRef(false)
  const tagLoadingRef = React.useRef(false)

  // Local Specialty
  const [localProfiles, setLocalProfiles] = React.useState<LocalSpecialtyProfile[]>([])
  const [selLocalProfileId, setSelLocalProfileId] = React.useState<number | null>(null)
  const [selLocalTraits, setSelLocalTraits] = React.useState<string[]>([])
  const lastMatchedIdRef = React.useRef<number | null>(null)
  const lastDetectedTraitsRef = React.useRef<string[]>([])
  const selLocalProfile = localProfiles.find((p) => p.id === selLocalProfileId) ?? null

  // AI Local Brand validation
  const [aiValidationLoading, setAiValidationLoading] = React.useState(false)
  const [aiValidationResult, setAiValidationResult] = React.useState<{
    isValid: boolean
    confidence: number
    reason: string
  } | null>(null)

  // ── Effects ──────────────────────────────────────────────────────────────

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedManualCatQuery(manualCatQuery), 300)
    return () => clearTimeout(t)
  }, [manualCatQuery])

  React.useEffect(() => {
    const rd = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "")
    const q = rd(platformMatQuery.trim().toLowerCase().normalize("NFC"))
    if (!q) { setPlatformMaterials(allPlatformMaterials); return }
    setPlatformMaterials(allPlatformMaterials.filter((m) => rd(m.name.toLowerCase().normalize("NFC")).includes(q)))
  }, [platformMatQuery, allPlatformMaterials])

  React.useEffect(() => {
    const rd = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "")
    const q = rd(platformTagQuery.trim().toLowerCase().normalize("NFC"))
    if (!q) { setPlatformTags(allPlatformTags); return }
    setPlatformTags(allPlatformTags.filter((t) => rd(t.name.toLowerCase().normalize("NFC")).includes(q)))
  }, [platformTagQuery, allPlatformTags])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const treeRes = await getCategoryTree()
        if (!mounted || !treeRes.success) return
        setManualCategoryRows(flattenCategoryTree(treeRes.tree ?? []))
      } catch { /* ignore */ }
    })()
    return () => { mounted = false }
  }, [])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const profiles = await getLocalSpecialtyProfiles("ca_phe")
        if (mounted) setLocalProfiles(profiles)
      } catch { /* ignore */ }
    })()
    return () => { mounted = false }
  }, [])

  // Tự động chọn hồ sơ đặc sản địa phương dựa trên tên/mô tả sản phẩm
  React.useEffect(() => {
    if (localProfiles.length === 0) return

    const matchedId = findBestLocalProfile(name, description, localProfiles)

    if (matchedId !== lastMatchedIdRef.current) {
      lastMatchedIdRef.current = matchedId
      if (matchedId !== null) {
        setSelLocalProfileId(matchedId)
        setSelLocalTraits([])
      } else if (selLocalProfileId === lastMatchedIdRef.current) {
        setSelLocalProfileId(null)
        setSelLocalTraits([])
      }
    }
  }, [name, description, localProfiles])

  // Tự động quét và check các đặc tính nổi bật từ mô tả sản phẩm
  React.useEffect(() => {
    if (!selLocalProfile) {
      lastDetectedTraitsRef.current = []
      return
    }

    const descLower = description.toLowerCase()
    const currentMatches = selLocalProfile.expectedTraits.filter((trait) =>
      descLower.includes(trait.toLowerCase())
    )

    const hasChanged =
      currentMatches.length !== lastDetectedTraitsRef.current.length ||
      currentMatches.some((t) => !lastDetectedTraitsRef.current.includes(t))

    if (hasChanged) {
      const newlyAdded = currentMatches.filter(
        (t) => !lastDetectedTraitsRef.current.includes(t)
      )
      const removed = lastDetectedTraitsRef.current.filter(
        (t) => !currentMatches.includes(t)
      )

      lastDetectedTraitsRef.current = currentMatches

      setSelLocalTraits((prev) => {
        const updated = prev.filter((t) => !removed.includes(t))
        let changed = false

        for (const t of newlyAdded) {
          if (!updated.includes(t)) {
            updated.push(t)
            changed = true
          }
        }

        if (prev.length !== updated.length) changed = true
        return changed ? updated : prev
      })
    }
  }, [description, selLocalProfileId, selLocalProfile])

  React.useEffect(() => {
    if (!selLocalProfile || !name.trim()) {
      setAiValidationResult(null)
      setAiValidationLoading(false)
      return
    }

    setAiValidationLoading(true)
    const activeProvince = selLocalProfile.provinceName
    const activeArchetype = selLocalProfile.archetypeName

    const timer = setTimeout(async () => {
      try {
        const response = await aiValidateLocalBrand({
          title: name.trim(),
          description: description.trim(),
          provinceName: activeProvince,
          archetypeName: activeArchetype,
        })
        if (response.success) {
          setAiValidationResult({
            isValid: response.isValid,
            confidence: response.confidence,
            reason: response.reason,
          })
        } else {
          setAiValidationResult({
            isValid: false,
            confidence: 0,
            reason: response.errorMessage || "Không thể xác thực thông tin.",
          })
        }
      } catch (err) {
        setAiValidationResult({
          isValid: false,
          confidence: 0,
          reason: err instanceof Error ? err.message : "Lỗi kết nối dịch vụ xác thực.",
        })
      } finally {
        setAiValidationLoading(false)
      }
    }, 1500)

    return () => {
      clearTimeout(timer)
    }
  }, [name, description, selLocalProfileId])

  const loadPlatformMaterials = React.useCallback(async () => {
    if (matLoadingRef.current || allPlatformMaterials.length > 0) return
    matLoadingRef.current = true; setPlatformMatLoading(true)
    try {
      const res = await fetchSellerMaterials(1, 500)
      if (res.success) { setAllPlatformMaterials(res.materials ?? []); setPlatformMaterials(res.materials ?? []) }
    } catch (err) { toast.error(`Không tải được chất liệu: ${err instanceof Error ? err.message : String(err)}`) }
    finally { matLoadingRef.current = false; setPlatformMatLoading(false) }
  }, [allPlatformMaterials.length])

  const loadPlatformTags = React.useCallback(async () => {
    if (tagLoadingRef.current || allPlatformTags.length > 0) return
    tagLoadingRef.current = true; setPlatformTagLoading(true)
    try {
      const res = await fetchSellerTags(1, 600)
      if (res.success) { setAllPlatformTags(res.tags ?? []); setPlatformTags(res.tags ?? []) }
    } catch (err) { toast.error(`Không tải được thẻ: ${err instanceof Error ? err.message : String(err)}`) }
    finally { tagLoadingRef.current = false; setPlatformTagLoading(false) }
  }, [allPlatformTags.length])

  React.useEffect(() => { if (matDialogOpen) loadPlatformMaterials() }, [matDialogOpen, loadPlatformMaterials])
  React.useEffect(() => { if (tagDialogOpen) loadPlatformTags() }, [tagDialogOpen, loadPlatformTags])

  // ── Memos ─────────────────────────────────────────────────────────────────

  const manualCategoryOptions = React.useMemo(() => {
    const tier2 = manualCategoryRows.filter((c) => c.level === 2)
    const q = debouncedManualCatQuery.trim().toLowerCase()
    if (!q) return tier2.slice(0, 12)
    return tier2.filter((c) => c.pathLabel.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)).slice(0, 24)
  }, [manualCategoryRows, debouncedManualCatQuery])

  const groupedPlatformMaterials = React.useMemo(() => {
    if (platformMatQuery.trim()) return platformMaterials.length > 0 ? [{ label: "Kết quả tìm kiếm", items: platformMaterials }] : []
    return groupMaterialsForPicker(platformMaterials)
  }, [platformMaterials, platformMatQuery])

  const groupedPlatformTags = React.useMemo(() => {
    if (platformTagQuery.trim()) return platformTags.length > 0 ? [{ label: "Kết quả tìm kiếm", items: platformTags }] : []
    return groupTagsForPicker(platformTags)
  }, [platformTags, platformTagQuery])

  const localMismatch = React.useMemo(() => {
    if (!selLocalProfile) return null
    if (aiValidationResult && !aiValidationResult.isValid) {
      return aiValidationResult.reason || "Thông tin sản phẩm chưa phù hợp với chỉ dẫn địa lý đã chọn."
    }
    return null
  }, [selLocalProfile, aiValidationResult])

  const isMeaningfulDescription = React.useMemo(() => {
    return !!(aiValidationResult && aiValidationResult.isValid)
  }, [aiValidationResult])

  const verificationScore = React.useMemo(() => {
    if (!selLocalProfile) return 0
    // Nếu kết quả AI trả về là KHÔNG hợp lệ (isValid = false) -> Điểm giảm ngay về 0
    if (aiValidationResult && !aiValidationResult.isValid) return 0

    let score = 50
    if (aiValidationResult?.isValid) {
      score += 25
    }
    if (selLocalTraits.length >= MIN_TRAITS) {
      score += 25
    }
    return score
  }, [selLocalProfile, aiValidationResult, selLocalTraits])

  const localValidationError = localMismatch

  const scoreColor = localValidationError
    ? "#c0392b"
    : verificationScore >= 75 ? "#3a6b30" : verificationScore >= 50 ? "#b06017" : "#c0392b"

  const scoreLabel = React.useMemo(() => {
    if (localValidationError) return "Không đạt chuẩn"
    if (aiValidationLoading) return "Đang phân tích AI..."
    if (verificationScore >= 100) return "Verified Local Brand"
    if (verificationScore >= 75) return "Gần đạt chuẩn"
    if (verificationScore >= 50) return "Đang xác thực"
    return "Chưa đủ điều kiện"
  }, [localValidationError, aiValidationLoading, verificationScore])


  const variantRowsValid = React.useMemo(() => {
    if (!useVariants) return true
    const filled = variantRows.filter((r) => r.variantName.trim().length > 0)
    if (filled.length === 0) return false
    return filled.every((r) => { const q = Math.floor(Number(r.quantity)); return Number.isFinite(q) && q >= 0 })
  }, [useVariants, variantRows])

  const variantPriceValues = React.useMemo(() => {
    if (!useVariants) return []
    return variantRows
      .map((r) => Number(r.price.replace(/[^0-9]/g, "")))
      .filter((v) => Number.isFinite(v) && v > 0)
  }, [useVariants, variantRows])

  const variantPriceStats = React.useMemo(() => {
    if (variantPriceValues.length === 0) return null
    const min = Math.min(...variantPriceValues)
    const max = Math.max(...variantPriceValues)
    return { min, max }
  }, [variantPriceValues])

  const variantPriceDisplayValue = React.useMemo(() => {
    if (!variantPriceStats) return ""
    return formatNumberVN(variantPriceStats.min)
  }, [variantPriceStats])

  const variantPriceHint = React.useMemo(() => {
    if (!variantPriceStats) return null
    return `${formatNumberVN(variantPriceStats.min)}đ`
  }, [variantPriceStats])

  const isPriceLockedByVariants = useVariants && variantPriceValues.length > 0
  const effectiveBasePriceRaw = isPriceLockedByVariants && variantPriceStats
    ? variantPriceStats.min
    : priceRaw

  const hasInput = name.trim().length > 0 || description.trim().length > 0
  const hasImages = imageUrls.length > 0
  const canSubmit = name.trim().length > 0 && effectiveBasePriceRaw > 0 && Boolean(selCategory?.categoryId) && variantRowsValid && hasImages && !uploadingImages

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const blobUrlToDataUrl = React.useCallback(async (blobUrl: string) => {
    const res = await fetch(blobUrl)
    const blob = await res.blob()
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result ?? ""))
      reader.onerror = () => reject(new Error("Không thể đọc ảnh local"))
      reader.readAsDataURL(blob)
    })
  }, [])

  const normalizeAiImageUrls = React.useCallback(async () => {
    const batch = imageUrls.slice(0, 3).map(async (u) => {
      if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:image/")) return u
      if (u.startsWith("blob:")) {
        try { const d = await blobUrlToDataUrl(u); return d.startsWith("data:image/") ? d : null } catch { return null }
      }
      return null
    })
    return (await Promise.all(batch)).filter((u): u is string => u != null && u.length > 0)
  }, [imageUrls, blobUrlToDataUrl])

  const applyAnalysisResult = React.useCallback((categories: CategorySuggestion[], tags: TagSuggestion[], materials: MaterialSuggestion[]) => {
    setCatSuggestions(categories ?? [])
    setSelCategory((prev) => { const list = categories ?? []; if (prev && list.some((c) => c.categoryId === prev.categoryId)) return prev; return list[0] ?? null })
    setTagSuggestions(tags ?? [])
    setSelTagIds((tags ?? []).map((t) => parseTagIdFromSuggestion(t as TagSuggestion & { tag_id?: unknown })).filter((id): id is number => id != null))
    setMatSuggestions(materials ?? [])
    setSelMatIds(Array.from(new Set((materials ?? []).map((m, idx) => materialSelectionKey(m, idx)))))
  }, [])

  const runAiAnalysis = React.useCallback(async () => {
    const hasImages = imageUrls.length > 0
    if (!hasInput && !hasImages) { toast.info("Nhập thông tin hoặc thêm ảnh trước khi phân tích"); return }
    const reqId = ++analysisReqRef.current
    setCatLoading(true); setTagLoading(true); setImageAnalyzeLoading(true); setCatError(false)
    setCatSuggestions([]); setTagSuggestions([]); setMatSuggestions([]); setSelCategory(null); setSelTagIds([]); setSelMatIds([])
    try {
      const aiImageUrls = hasImages ? await normalizeAiImageUrls() : []
      if (reqId !== analysisReqRef.current) return
      if (aiImageUrls.length > 0) {
        const r = await aiAnalyzeImage({ imageUrls: aiImageUrls, productTitle: name.trim() || undefined, productDescription: description.trim() || undefined })
        if (reqId !== analysisReqRef.current) return
        if (r.success) { setImageAnalyzeResult(r); applyAnalysisResult(r.suggestedCategories, r.suggestedTags, r.suggestedMaterials) }
        else { setImageAnalyzeResult(null); setCatError(true) }
      } else {
        setImageAnalyzeResult(null)
        if (!hasInput) return
        const r = await aiAnalyzeProduct({ title: name.trim(), description: description.trim() || undefined })
        if (reqId !== analysisReqRef.current) return
        if (r.success) applyAnalysisResult(r.categories, r.tags, r.materials)
        else setCatError(true)
      }
    } catch { if (reqId !== analysisReqRef.current) return; setCatError(true); toast.error("Không thể phân tích AI. Vui lòng thử lại") }
    finally { if (reqId !== analysisReqRef.current) return; setCatLoading(false); setTagLoading(false); setImageAnalyzeLoading(false) }
  }, [hasInput, imageUrls, name, description, normalizeAiImageUrls, applyAnalysisResult])

  const handleSelectCategory = (cat: CategorySuggestion) => {
    const meta = manualCategoryRows.find((r) => r.id === cat.categoryId)
    if (meta && meta.level !== 2) {
      toast.error(meta.level === 1 ? `"${cat.categoryName}" là danh mục cấp 1 (quá rộng). Hãy chọn 1 danh mục cấp 2 cụ thể hơn.` : `"${cat.categoryName}" không phải danh mục cấp 2. Vui lòng chọn lại.`)
      return
    }
    setSelCategory((prev) => { if (prev?.categoryId !== cat.categoryId) { setSelTagIds([]); setSelMatIds([]) }; return cat })
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm.")
      return
    }
    if (!useVariants && (!price || priceRaw <= 0)) {
      toast.error("Vui lòng nhập giá bán cơ bản hợp lệ (lớn hơn 0).")
      return
    }
    if (!selCategory?.categoryId) {
      toast.error("Vui lòng chọn danh mục sản phẩm.")
      return
    }
    if (imageUrls.length === 0) {
      toast.error("Vui lòng tải lên ít nhất 1 hình ảnh sản phẩm.")
      return
    }
    if (useVariants) {
      const filled = variantRows.filter((r) => r.variantName.trim().length > 0)
      if (filled.length === 0) {
        toast.error("Vui lòng nhập thông tin cho ít nhất một biến thể.")
        return
      }
      const allPricesValid = filled.every((r) => {
        const pStr = r.price.replace(/[^0-9]/g, "")
        const p = pStr ? Number(pStr) : 0
        return Number.isFinite(p) && p > 0
      })
      if (!allPricesValid) {
        toast.error("Vui lòng nhập giá bán hợp lệ cho tất cả biến thể (lớn hơn 0).")
        return
      }
      const allQuantitiesValid = filled.every((r) => {
        const q = Math.floor(Number(r.quantity))
        return Number.isFinite(q) && q >= 0
      })
      if (!allQuantitiesValid) {
        toast.error("Số lượng tồn kho của biến thể phải là số nguyên không âm.")
        return
      }
    }

    if (localProfiles.length > 0) {
      if (!selLocalProfileId) {
        toast.error("Vui lòng chọn loại cà phê đặc sản để xác thực Local Brand.")
        return
      }
      if (selLocalTraits.length < MIN_TRAITS) {
        toast.error(`Vui lòng chọn tối thiểu ${MIN_TRAITS} đặc điểm nổi bật để xác thực Local Brand.`)
        return
      }
      if (aiValidationLoading) {
        toast.error("Hệ thống đang chạy xác thực AI cho Local Brand, vui lòng đợi giây lát.")
        return
      }
      if (!aiValidationResult || !aiValidationResult.isValid) {
        toast.error(aiValidationResult?.reason || "Thông tin sản phẩm chưa hợp lệ để xác thực Local Brand.")
        return
      }
    }

    setUploadingImages(true)
    let persistedImageUrls: string[] | undefined
    try {
      if (imageUrls.length > 0) {
        persistedImageUrls = []
        for (const u of imageUrls) persistedImageUrls.push(await resolveImageUrlForProduct(u))
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Không tải được ảnh lên storage"); return }
    finally { setUploadingImages(false) }

    const basePayload = {
      name: name.trim(), basePrice: effectiveBasePriceRaw, description: description.trim() || undefined,
      currency: "VND",
      imageUrls: persistedImageUrls && persistedImageUrls.length > 0 ? persistedImageUrls : undefined,
      categoryId: selCategory?.categoryId ?? undefined,
      tagIds: selTagIds.length > 0 ? selTagIds : undefined,
      materialIds: (() => { const ids = selMatIds.filter(isPersistableMaterialId); return ids.length > 0 ? ids : undefined })(),
      localSpecialtyProfileId: selLocalProfileId ?? undefined,
      selectedTraits: selLocalTraits.length > 0 ? selLocalTraits : undefined,
    }
    const createResult = useVariants
      ? await create({ ...basePayload, variants: variantRows.filter((r) => r.variantName.trim().length > 0).map((r) => { const priceStr = r.price.replace(/[^0-9]/g, ""); const rowPrice = priceStr ? Number(priceStr) : undefined; let finalAttributes: string | undefined; const attrStr = r.attributes.trim(); if (attrStr) finalAttributes = JSON.stringify(parseAttributesStr(attrStr)); return { variantName: r.variantName.trim(), sku: r.sku.trim() || undefined, price: rowPrice !== undefined && Number.isFinite(rowPrice) && rowPrice > 0 ? rowPrice : undefined, quantity: Math.max(0, Math.floor(Number(r.quantity) || 0)), attributes: finalAttributes } }) })
      : await create({ ...basePayload, quantity: Math.max(0, Math.floor(Number(baseStock) || 0)) })

    if (createResult.success && createResult.productId) {
      const chosenTagNames: string[] = []
      const byId = new Map<number, string>()
      for (const t of platformTags) byId.set(t.id, t.name)
      for (const s of tagSuggestions) { const id = parseTagIdFromSuggestion(s as TagSuggestion & { tag_id?: unknown }); if (id != null && s.tagName?.trim()) byId.set(id, s.tagName.trim()) }
      for (const id of selTagIds) { const n = byId.get(id); if (n) chosenTagNames.push(n) }
      const suggestedTags = tagSuggestions.filter((s) => s.tagName?.trim()).map((s) => ({ tagName: s.tagName.trim(), confidenceScore: tagConfidenceForCommit(s) }))
      const suggestedMaterials = buildSuggestedMaterialsForCommit(matSuggestions)
      const chosenMaterialIds = selMatIds.filter(isPersistableMaterialId)
      if (suggestedTags.length > 0 || chosenTagNames.length > 0 || suggestedMaterials.length > 0 || chosenMaterialIds.length > 0) {
        try { await aiCommitProductTagSession({ productId: createResult.productId, title: name.trim(), description: description.trim() || undefined, categoryId: selCategory?.categoryId, suggestedTags, chosenTagNames, suggestedMaterials, chosenMaterialIds }) }
        catch { toast.warning("Đã tạo sản phẩm nhưng chưa lưu được lịch sử gợi ý AI.") }
      }
    }
    if (createResult.success) router.push("/seller/products")
  }

  const toggleTag = (id: number) => setSelTagIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  const toggleMat = (key: string) => setSelMatIds((p) => p.includes(key) ? p.filter((x) => x !== key) : [...p, key])
  const togglePlatformMat = (mat: MaterialDto) => {
    const key = mat.id; const nameKey = `__name__:${mat.name.trim().toLowerCase()}`
    setSelMatIds((p) => p.includes(key) ? p.filter((x) => x !== key) : [...p.filter((x) => x !== nameKey), key])
  }
  const togglePlatformTag = (tag: Tag) => setSelTagIds((p) => p.includes(tag.id) ? p.filter((x) => x !== tag.id) : [...p, tag.id])
  const toggleLocalTrait = (trait: string) => setSelLocalTraits((prev) => prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait])

  return {
    // Form state
    name, setName, price, setPrice, priceRaw, setPriceRaw, sku, setSku, baseStock, setBaseStock,
    description, setDescription, descSheetOpen, setDescSheetOpen,
    nameTouched, setNameTouched, priceTouched, setPriceTouched,
    // Variants
    useVariants, setUseVariants, variantRows, setVariantRows,
    // Images
    imageUrls, setImageUrls, imageInput, setImageInput, isDragging, setIsDragging,
    brokenUrls, setBrokenUrls, uploadingImages, fileInputRef,
    // AI
    catLoading, tagLoading, imageAnalyzeLoading, catError, imageAnalyzeResult,
    catSuggestions, tagSuggestions, matSuggestions,
    // Category
    selCategory, manualCategoryOptions, manualCatQuery, setManualCatQuery, debouncedManualCatQuery,
    // Tags
    selTagIds, platformTags, tagDialogOpen, setTagDialogOpen,
    platformTagLoading, platformTagQuery, setPlatformTagQuery, groupedPlatformTags,
    // Materials
    selMatIds, platformMaterials, matDialogOpen, setMatDialogOpen,
    platformMatLoading, platformMatQuery, setPlatformMatQuery, groupedPlatformMaterials,
    // Local brand
    localProfiles, selLocalProfileId, setSelLocalProfileId, selLocalTraits, setSelLocalTraits,
    selLocalProfile, isMeaningfulDescription, verificationScore, scoreColor, scoreLabel, localMismatch,
    aiValidationLoading, aiValidationResult,
    // Computed
    hasInput, canSubmit, actionLoading, commissionPercent, platformFeeLoading,
    effectiveBasePriceRaw, isPriceLockedByVariants, variantPriceDisplayValue, variantPriceHint,
    // Handlers
    runAiAnalysis, handleSelectCategory, handleSubmit,
    toggleTag, toggleMat, togglePlatformMat, togglePlatformTag, toggleLocalTrait,
  }
}
