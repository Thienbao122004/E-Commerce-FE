export interface MaterialDto {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  createdAt: string
  productCount: number
}

export interface MaterialListResponse {
  success: boolean
  materials: MaterialDto[]
  totalCount: number
  page: number
  pageSize: number
}

export interface MaterialResponse {
  success: boolean
  message?: string
  material?: MaterialDto
}
