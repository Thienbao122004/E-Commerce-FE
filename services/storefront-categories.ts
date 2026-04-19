const API_BASE = process.env.NEXT_PUBLIC_API_URL

import type {
  StorefrontCategoryListResponse,
  StorefrontCategoryTreeResponse,
  StorefrontCategoryDetailResponse,
} from "@/types/storefront-category"

export type {
  StorefrontCategory,
  StorefrontCategoryListResponse,
  StorefrontCategoryTreeResponse,
  StorefrontCategoryDetailResponse,
} from "@/types/storefront-category"

type CacheEntry<T> = {
  data: T
  expiresAt: number
}

const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000

const _listCache = new Map<string, CacheEntry<StorefrontCategoryListResponse>>()
const _detailCache = new Map<number, CacheEntry<StorefrontCategoryDetailResponse>>()
let _treeCache: CacheEntry<StorefrontCategoryTreeResponse> | null = null

const _pendingListRequests = new Map<string, Promise<StorefrontCategoryListResponse>>()
let _pendingTreeRequest: Promise<StorefrontCategoryTreeResponse> | null = null
const _pendingDetailRequests = new Map<number, Promise<StorefrontCategoryDetailResponse>>()

function getValidCachedData<T>(entry?: CacheEntry<T> | null): T | null {
  if (!entry) return null
  if (Date.now() > entry.expiresAt) return null
  return entry.data
}

function setCachedData<T>(value: T): CacheEntry<T> {
  return {
    data: value,
    expiresAt: Date.now() + CATEGORY_CACHE_TTL_MS,
  }
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function clearCategoryCache() {
  _listCache.clear()
  _detailCache.clear()
  _treeCache = null
  _pendingListRequests.clear()
  _pendingTreeRequest = null
  _pendingDetailRequests.clear()
}


export function getCategories(params: {
  page?: number
  pageSize?: number
  level?: number
} = {}): Promise<StorefrontCategoryListResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.pageSize) qs.set("pageSize", String(params.pageSize))
  if (params.level !== undefined) qs.set("level", String(params.level))
  const cacheKey = qs.toString()

  const cached = getValidCachedData(_listCache.get(cacheKey))
  if (cached) {
    return Promise.resolve(cached)
  }

  if (_pendingListRequests.has(cacheKey)) {
    return _pendingListRequests.get(cacheKey)!
  }

  const request = fetchJson<StorefrontCategoryListResponse>(
    `/api/categories${cacheKey ? `?${cacheKey}` : ""}`
  ).then((res) => {
    if (res.success) _listCache.set(cacheKey, setCachedData(res))
    return res
  }).finally(() => {
    _pendingListRequests.delete(cacheKey)
  })

  _pendingListRequests.set(cacheKey, request)
  return request
}

export function getCategoryTree(): Promise<StorefrontCategoryTreeResponse> {
  const cached = getValidCachedData(_treeCache)
  if (cached) return Promise.resolve(cached)

  if (_pendingTreeRequest) {
    return _pendingTreeRequest
  }

  _pendingTreeRequest = fetchJson<StorefrontCategoryTreeResponse>(`/api/categories/tree`).then((res) => {
    if (res.success) _treeCache = setCachedData(res)
    return res
  }).finally(() => {
    _pendingTreeRequest = null
  })

  return _pendingTreeRequest
}

export function getCategoryById(
  categoryId: number
): Promise<StorefrontCategoryDetailResponse> {
  const cached = getValidCachedData(_detailCache.get(categoryId))
  if (cached) {
    return Promise.resolve(cached)
  }

  if (_pendingDetailRequests.has(categoryId)) {
    return _pendingDetailRequests.get(categoryId)!
  }

  const request = fetchJson<StorefrontCategoryDetailResponse>(`/api/categories/${categoryId}`).then((res) => {
    if (res.success) _detailCache.set(categoryId, setCachedData(res))
    return res
  }).finally(() => {
    _pendingDetailRequests.delete(categoryId)
  })

  _pendingDetailRequests.set(categoryId, request)
  return request
}
