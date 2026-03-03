// ---------- Types ----------
export type Category = {
  id: number
  parentId: number | null
  parentName: string | null
  code: string
  name: string
  slug: string
  level: number
  levelName: string
  isActive: boolean
  productCount: number
  subcategoryCount: number
  createdAt: string
  updatedAt: string
  subcategories?: Category[]
}

export type CategoryListResponse = {
  success: boolean
  message?: string | null
  categories: Category[]
  totalCount: number
  page: number
  pageSize: number
}

export type CategoryResponse = {
  success: boolean
  message?: string | null
  category?: Category
}

export type CategoryTreeResponse = {
  success: boolean
  message?: string | null
  tree: Category[]
}

export type MigrateProductsResponse = {
  success: boolean
  message?: string | null
  migratedCount: number
}
