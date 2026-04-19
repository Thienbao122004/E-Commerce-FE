export type CategorySuggestion = {
  categoryId: number
  categoryName: string
  categoryPath: string
  confidenceScore: number
}

export type TagSuggestion = {
  tagId: number
  tagName: string
  confidence?: number
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
  suggestions: TagSuggestion[]
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
  suggestedTags: TagSuggestion[]
  suggestedMaterials: MaterialSuggestion[]
  improvements: string[]
  summary: string
  success: boolean
  errorMessage?: string
}

export type AnalyzeProductResponse = {
  categories: CategorySuggestion[]
  tags: TagSuggestion[]
  materials: MaterialSuggestion[]
  success: boolean
  errorMessage?: string
}

export type TagSuggestionItem = {
  tag: string
  confidence: number
}

export type TagSuggestionLogItem = {
  id: string
  productId: string
  inputTitle: string | null
  suggestedCategoryId: number | null
  suggestedTags: TagSuggestionItem[]
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

export type MaterialLogSuggested = {
  materialId: string | null
  materialName: string
  confidence: number
}

export type MaterialSuggestionLogItem = {
  id: string
  productId: string
  productName: string | null
  suggestedMaterials: MaterialLogSuggested[]
  chosenMaterialIds: string[]
  chosenMaterialNames: string[]
  action: "accepted" | "modified" | "rejected"
  createdAt: string
}

export type MaterialSuggestionLogResponse = {
  items: MaterialSuggestionLogItem[]
  total: number
  accepted: number
  modified: number
  rejected: number
}
