"use client"

import * as React from "react"
import { IconSparkles, IconLoader2, IconCategory, IconPalette, IconTag } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CategorySuggestion, TagSuggestion, MaterialSuggestion, AnalyzeImageResponse } from "@/services/ai-seller"
import type { MaterialDto } from "@/services/admin-materials"
import type { Tag } from "@/types/tag"
import { SectionLabel, confidenceText } from "./product-form-utils"
import { ProductCategoryPicker } from "./product-category-picker"
import { ProductMaterialPicker } from "./product-material-picker"
import { ProductTagPicker } from "./product-tag-picker"

type ManualCategoryRow = { id: number; name: string; pathLabel: string; level: number }
interface MaterialGroup { label: string; items: MaterialDto[] }
interface TagGroup { label: string; items: Tag[] }

interface ProductAiAssistantProps {
  // Loading states
  catLoading: boolean
  tagLoading: boolean
  imageAnalyzeLoading: boolean
  catError: boolean
  // AI result
  imageAnalyzeResult: AnalyzeImageResponse | null
  catSuggestions: CategorySuggestion[]
  tagSuggestions: TagSuggestion[]
  matSuggestions: MaterialSuggestion[]
  // Category
  selCategory: CategorySuggestion | null
  onSelectCategory: (cat: CategorySuggestion) => void
  manualCategoryOptions: ManualCategoryRow[]
  manualCatQuery: string
  onManualCatQueryChange: (q: string) => void
  debouncedManualCatQuery: string
  // Tags
  selTagIds: number[]
  onToggleTag: (id: number) => void
  onTogglePlatformTag: (tag: Tag) => void
  platformTags: Tag[]
  tagDialogOpen: boolean
  onTagDialogOpenChange: (v: boolean) => void
  platformTagLoading: boolean
  platformTagQuery: string
  onPlatformTagQueryChange: (q: string) => void
  groupedPlatformTags: TagGroup[]
  // Materials
  selMatIds: string[]
  onToggleMat: (key: string) => void
  onTogglePlatformMat: (mat: MaterialDto) => void
  matDialogOpen: boolean
  onMatDialogOpenChange: (v: boolean) => void
  platformMatLoading: boolean
  platformMatQuery: string
  onPlatformMatQueryChange: (q: string) => void
  groupedPlatformMaterials: MaterialGroup[]
  platformMaterials: MaterialDto[]
  // Actions
  onRunAiAnalysis: () => void
  hasInput: boolean
}

export function ProductAiAssistant({
  catLoading, tagLoading, imageAnalyzeLoading, catError,
  imageAnalyzeResult, catSuggestions, tagSuggestions, matSuggestions,
  selCategory, onSelectCategory,
  manualCategoryOptions, manualCatQuery, onManualCatQueryChange, debouncedManualCatQuery,
  selTagIds, onToggleTag, onTogglePlatformTag, platformTags,
  tagDialogOpen, onTagDialogOpenChange, platformTagLoading, platformTagQuery, onPlatformTagQueryChange, groupedPlatformTags,
  selMatIds, onToggleMat, onTogglePlatformMat,
  matDialogOpen, onMatDialogOpenChange, platformMatLoading, platformMatQuery, onPlatformMatQueryChange,
  groupedPlatformMaterials, platformMaterials,
  onRunAiAnalysis, hasInput,
}: ProductAiAssistantProps) {
  const isAnalyzing = catLoading || tagLoading || imageAnalyzeLoading
  const confidenceBadge = selCategory?.confidenceScore ?? catSuggestions[0]?.confidenceScore

  return (
    <Card className="!rounded">
      <CardHeader>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <IconSparkles className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">Trợ lý thông minh</CardTitle>
          </div>
          {isAnalyzing && <IconLoader2 className="mt-1 size-3.5 shrink-0 animate-spin text-[#738f5b]" />}
        </div>
      </CardHeader>

      <CardContent className="grid gap-4">
        {/* Trigger button */}
        <div className="rounded-xl border border-[#d4deca] bg-[#f8fbf5] p-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-[#617457]">Hoàn tất thông tin rồi bấm để AI phân tích một lần.</p>
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 px-3 text-[11px]"
              onClick={onRunAiAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <><IconLoader2 className="mr-1 size-3 animate-spin" />Đang phân tích...</>
              ) : (
                <><IconSparkles className="mr-1 size-3" />Bắt đầu phân tích</>
              )}
            </Button>
          </div>
        </div>

        {/* Image analysis summary */}
        {!imageAnalyzeLoading && imageAnalyzeResult?.summary && (
          <div className="rounded-xl border border-[#d4deca] bg-white p-2.5 text-[11px] leading-relaxed text-[#647759]">
            <span className="font-semibold text-[#44553a]">Phân tích ảnh:</span> {imageAnalyzeResult.summary}
          </div>
        )}

        {/* Category */}
        <div>
          <SectionLabel
            icon={IconCategory}
            badge={
              !catLoading && typeof confidenceBadge === "number" ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-[#60794b]">
                  Độ chính xác: {confidenceText(confidenceBadge)}
                </span>
              ) : null
            }
          >
            Danh mục
          </SectionLabel>
          <ProductCategoryPicker
            catLoading={catLoading}
            catError={catError}
            catSuggestions={catSuggestions}
            selCategory={selCategory}
            onSelectCategory={onSelectCategory}
            manualCategoryOptions={manualCategoryOptions}
            manualCatQuery={manualCatQuery}
            onManualCatQueryChange={onManualCatQueryChange}
            debouncedManualCatQuery={debouncedManualCatQuery}
          />
        </div>

        {/* Materials */}
        <div>
          <SectionLabel icon={IconPalette}>Chất liệu gợi ý</SectionLabel>
          <ProductMaterialPicker
            selCategory={selCategory}
            tagLoading={tagLoading}
            matSuggestions={matSuggestions}
            selMatIds={selMatIds}
            onToggleMat={onToggleMat}
            onTogglePlatformMat={onTogglePlatformMat}
            matDialogOpen={matDialogOpen}
            onMatDialogOpenChange={onMatDialogOpenChange}
            platformMatLoading={platformMatLoading}
            platformMatQuery={platformMatQuery}
            onPlatformMatQueryChange={onPlatformMatQueryChange}
            groupedPlatformMaterials={groupedPlatformMaterials}
            platformMaterials={platformMaterials}
          />
        </div>

        {/* Tags */}
        <div className="border-t border-[#dce3d5] pt-3">
          <SectionLabel icon={IconTag}>Thẻ gợi ý</SectionLabel>
          <ProductTagPicker
            selCategory={selCategory}
            tagLoading={tagLoading}
            tagSuggestions={tagSuggestions}
            selTagIds={selTagIds}
            onToggleTag={onToggleTag}
            onTogglePlatformTag={onTogglePlatformTag}
            platformTags={platformTags}
            tagDialogOpen={tagDialogOpen}
            onTagDialogOpenChange={onTagDialogOpenChange}
            platformTagLoading={platformTagLoading}
            platformTagQuery={platformTagQuery}
            onPlatformTagQueryChange={onPlatformTagQueryChange}
            groupedPlatformTags={groupedPlatformTags}
          />
        </div>

        {/* Summary */}
        {selCategory && (
          <div className="rounded-xl border border-[#d4deca] bg-white p-3 text-[11px] text-[#627458]">
            Đã chọn: <span className="font-semibold text-[#46573b]">{selCategory.categoryName}</span>
            {selTagIds.length > 0 && ` · ${selTagIds.length} tag`}
            {selMatIds.length > 0 && ` · ${selMatIds.length} đặc tính`}
          </div>
        )}

        {!hasInput && catSuggestions.length === 0 && !catLoading && (
          <div className="rounded-xl border border-dashed border-[#c7d2bd] bg-white p-3 text-center text-[11px] italic leading-relaxed text-[#7b8d71]">
            Nhập tên hoặc mô tả sản phẩm để AI gợi ý danh mục
          </div>
        )}
      </CardContent>
    </Card>
  )
}
