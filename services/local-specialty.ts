const API_BASE = process.env.NEXT_PUBLIC_API_URL

export interface LocalSpecialtyProfile {
  id: number
  categoryCode: string
  provinceName: string
  archetypeName: string
  displayNote: string | null
  expectedTraits: string[]
  keywords: string[]
}

export interface LocalSpecialtyProfilesResponse {
  success: boolean
  data: LocalSpecialtyProfile[]
}

let _cache: LocalSpecialtyProfile[] | null = null
let _cacheExpiry = 0
const CACHE_TTL_MS = 10 * 60 * 1000

export async function getLocalSpecialtyProfiles(
  categoryCode?: string
): Promise<LocalSpecialtyProfile[]> {
  const now = Date.now()
  if (!categoryCode && _cache && now < _cacheExpiry) return _cache

  const url = categoryCode
    ? `${API_BASE}/api/local-specialty-profiles?categoryCode=${encodeURIComponent(categoryCode)}`
    : `${API_BASE}/api/local-specialty-profiles`

  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return []
  const json: LocalSpecialtyProfilesResponse = await res.json()
  const data = json.data ?? []

  if (!categoryCode) {
    _cache = data
    _cacheExpiry = now + CACHE_TTL_MS
  }
  return data
}

export async function getLocalSpecialtyProfileById(
  id: number
): Promise<LocalSpecialtyProfile | null> {
  const res = await fetch(`${API_BASE}/api/local-specialty-profiles/${id}`, {
    cache: "no-store",
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.data ?? null
}

/** Nhóm profiles theo tỉnh để render dropdown. */
export function groupProfilesByProvince(
  profiles: LocalSpecialtyProfile[]
): Record<string, LocalSpecialtyProfile[]> {
  return profiles.reduce<Record<string, LocalSpecialtyProfile[]>>((acc, p) => {
    if (!acc[p.provinceName]) acc[p.provinceName] = []
    acc[p.provinceName].push(p)
    return acc
  }, {})
}
