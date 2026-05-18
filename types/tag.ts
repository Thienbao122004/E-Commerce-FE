// ---------- Types ----------
export type Tag = {
  id: number
  name: string
  slug: string
  isActive: boolean
  createdAt: string
  productCount: number
}

export type TagListResponse = {
  success: boolean
  message?: string | null
  tags: Tag[]
  totalCount: number
  page: number
  pageSize: number
}

export type TagResponse = {
  success: boolean
  message?: string | null
  tag?: Tag
}
