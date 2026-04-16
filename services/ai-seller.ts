import { getAccessToken } from "@/lib/auth"

const AI_BASE_URL =
  process.env.NEXT_PUBLIC_AI_URL || "http://localhost:5001"

import type {
  SuggestCategoryResponse,
  SuggestTagsResponse,
  SuggestMaterialsResponse,
  AnalyzeImageResponse,
  AnalyzeProductResponse,
  TagSuggestionLogResponse,
} from "@/types/ai-seller"

export type {
  CategorySuggestion,
  TagSuggestion,
  MaterialSuggestion,
  SuggestCategoryResponse,
  SuggestTagsResponse,
  SuggestMaterialsResponse,
  AnalyzeImageResponse,
  AnalyzeProductResponse,
  TagSuggestionItem,
  TagSuggestionLogItem,
  TagSuggestionLogResponse,
} from "@/types/ai-seller"

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
  chosenTagIds?: number[]
  chosenMaterialIds?: string[]
  action: "accepted" | "rejected" | "modified" | "skipped"
}) {
  return aiPost<{ success: boolean }>("/api/ai/seller/tag-feedback", {
    logId: params.logId,
    chosenCategoryId: params.chosenCategoryId ?? null,
    chosenTagIds: params.chosenTagIds ?? [],
    chosenMaterialIds: params.chosenMaterialIds ?? [],
    action: params.action,
  })
}

/**
 * Phân tích sản phẩm (text-only) — 1 Gemini call thay cho suggest-category + suggest-tags + suggest-materials.
 * Kết quả đã được post-validate: chỉ trả về IDs thực sự tồn tại trong DB.
 */
export function aiAnalyzeProduct(params: {
  title: string
  description?: string
  categoryId?: number | null
}) {
  return aiPost<AnalyzeProductResponse>("/api/ai/seller/analyze-product", {
    title: params.title,
    description: params.description ?? null,
    categoryId: params.categoryId ?? null,
  })
}

/** Phân tích ảnh sản phẩm bằng AI vision */
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

/** Lấy lịch sử gợi ý tags của seller */
export function aiGetTagSuggestionLogs(page = 1, pageSize = 20) {
  return aiGet<TagSuggestionLogResponse>(
    `/api/ai/seller/tag-suggestions?page=${page}&pageSize=${pageSize}`
  )
}
