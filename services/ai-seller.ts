import { getAccessToken } from "@/lib/auth"

const AI_BASE_URL =
  process.env.NEXT_PUBLIC_AI_URL || "http://localhost:5001"

async function aiPost<T>(endpoint: string, body: unknown): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${AI_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? "AI request failed")
  }
  return res.json()
}

async function aiGet<T>(endpoint: string): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${AI_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? "AI request failed")
  }
  return res.json()
}


export type CategorySuggestion = {
  categoryId: number
  categoryName: string
  categoryPath: string
  confidenceScore: number
}

/** Format item trong suggested_tags JSONB: {"tag": "vải cotton", "confidence": 0.95} */
export type TagSuggestionItem = {
  tag: string
  confidence: number
}

export type MaterialSuggestion = {
  materialId: string
  materialName: string
  confidence?: number
}

export type SuggestCategoryResponse = {
  suggestions: CategorySuggestion[]
  logId: string | null
}

export type SuggestTagsResponse = {
  suggestions: TagSuggestionItem[]
  logId: string | null
}

export type SuggestMaterialsResponse = {
  suggestions: MaterialSuggestion[]
  logId: string | null
}

export type AnalyzeImageResponse = {
  quality: {
    score: number
    rating: string
    hasGoodLighting: boolean
    hasCleanBackground: boolean
    isProductCentered: boolean
    hasHighResolution: boolean
  }
  suggestedCategories: CategorySuggestion[]
  suggestedTags: TagSuggestionItem[]
  suggestedMaterials: MaterialSuggestion[]
  improvements: string[]
  summary: string
  success: boolean
  errorMessage?: string
}


/** Gợi ý danh mục từ tên + mô tả + ảnh */
export function aiSuggestCategory(params: {
  title: string
  description: string
  imageUrls?: string[]
}) {
  return aiPost<SuggestCategoryResponse>("/api/ai/seller/suggest-category", {
    title: params.title,
    description: params.description,
    imageUrls: params.imageUrls ?? [],
  })
}

/** Gợi ý tags từ tên + mô tả + categoryId */
export function aiSuggestTags(params: {
  title: string
  description: string
  categoryId: number
  productId?: string
}) {
  return aiPost<SuggestTagsResponse>("/api/ai/seller/suggest-tags", {
    title: params.title,
    description: params.description,
    categoryId: params.categoryId,
    productId: params.productId ?? null,
  })
}

/** Gợi ý chất liệu từ tên + mô tả + categoryId */
export function aiSuggestMaterials(params: {
  title: string
  description: string
  categoryId: number
  productId?: string
}) {
  return aiPost<SuggestMaterialsResponse>("/api/ai/seller/suggest-materials", {
    title: params.title,
    description: params.description,
    categoryId: params.categoryId,
    productId: params.productId ?? null,
  })
}

/** Gửi phản hồi về lựa chọn của người dùng cho AI */
export function aiSendFeedback(params: {
  logId: string
  chosenCategoryId?: number
  /** Tên các tag đã chọn (khớp format DB: ["vải cotton", "tối giản"]) */
  chosenTagNames?: string[]
  chosenMaterialIds?: string[]
  action: "accepted" | "rejected" | "modified" | "skipped"
}) {
  return aiPost<{ success: boolean }>("/api/ai/seller/tag-feedback", {
    logId: params.logId,
    chosenCategoryId: params.chosenCategoryId ?? null,
    chosenTagNames: params.chosenTagNames ?? [],
    chosenMaterialIds: params.chosenMaterialIds ?? [],
    action: params.action,
  })
}

// ── Tag Suggestion Log ─────────────────────────────────────────────

export type TagSuggestionLogItem = {
  id: string
  productId: string
  inputTitle: string | null
  suggestedCategoryId: number | null
  /** AI gợi ý: [{tag: "vải cotton", confidence: 0.95}] */
  suggestedTags: TagSuggestionItem[]
  /** Seller đã chọn: ["vải cotton", "tối giản"] */
  chosenTags: string[]
  action: "accepted" | "modified" | "rejected"
  createdAt: string
}

export type TagSuggestionLogResponse = {
  items: TagSuggestionLogItem[]
  total: number
  accepted: number
  modified: number
  rejected: number
}

/** Lấy lịch sử gợi ý tags của seller */
export function aiGetTagSuggestionLogs(page = 1, pageSize = 20) {
  return aiGet<TagSuggestionLogResponse>(
    `/api/ai/seller/tag-suggestions?page=${page}&pageSize=${pageSize}`
  )
}

/** Phan tich anh san pham bang AI vision */
export function aiAnalyzeImage(params: {
  imageUrls: string[]
  productTitle?: string
  productDescription?: string
}) {
  return aiPost<AnalyzeImageResponse>("/api/ai/seller/analyze-image", {
    imageUrls: params.imageUrls,
    productTitle: params.productTitle ?? null,
    productDescription: params.productDescription ?? null,
  })
}
