"use client"

import * as React from "react"
import { IconLoader2, IconCheck, IconAlertCircle } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import type { CategorySuggestion } from "@/services/ai-seller"
import { ConfidenceDot } from "./product-form-utils"

type ManualCategoryRow = {
  id: number
  name: string
  pathLabel: string
  level: number
}

interface ProductCategoryPickerProps {
  catLoading: boolean
  catError: boolean
  catSuggestions: CategorySuggestion[]
  selCategory: CategorySuggestion | null
  onSelectCategory: (cat: CategorySuggestion) => void
  manualCategoryOptions: ManualCategoryRow[]
  manualCatQuery: string
  onManualCatQueryChange: (q: string) => void
  debouncedManualCatQuery: string
}

export function ProductCategoryPicker({
  catLoading,
  catError,
  catSuggestions,
  selCategory,
  onSelectCategory,
  manualCategoryOptions,
  manualCatQuery,
  onManualCatQueryChange,
  debouncedManualCatQuery,
}: ProductCategoryPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {catLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#cfd8c7] bg-white p-3 text-[11px] text-[#6d7f62]">
          <IconLoader2 className="size-3 animate-spin text-[#70885a]" />
          Đang phân tích danh mục...
        </div>
      ) : (
        <>
          {catError && (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-red-200 bg-red-50 p-3 text-[11px] text-red-500">
              <IconAlertCircle className="size-3.5 shrink-0" />
              Không thể kết nối AI. Bạn vẫn có thể chọn danh mục thủ công bên dưới.
            </div>
          )}

          {!catError && catSuggestions.length > 0 && (
            <>
              {catSuggestions.map((cat, idx) => {
                const active = selCategory?.categoryId === cat.categoryId
                return (
                  <button
                    key={`${cat.categoryId}-${cat.categoryName}-${idx}`}
                    type="button"
                    onClick={() => onSelectCategory(cat)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      active
                        ? "border-[#9db183] bg-white"
                        : "border-[#d7dfcf] bg-white hover:border-[#a9bc95]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#2d3a25]">{cat.categoryName}</p>
                      <p className="truncate text-xs text-[#7f8f74]">{cat.categoryPath}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ConfidenceDot score={cat.confidenceScore} />
                      {active && <IconCheck className="size-3.5 text-[#5f7a49]" />}
                    </div>
                  </button>
                )
              })}
              {Array.from({ length: Math.max(0, 3 - catSuggestions.length) }).map((_, idx) => (
                <div
                  key={`empty-cat-${idx}`}
                  className="flex w-full items-center justify-center rounded-xl border border-dashed border-[#d7dfcf] bg-[#fafcf8] px-3 py-3 opacity-60"
                >
                  <span className="text-xs italic text-[#8a9a80]">--- AI không có thêm gợi ý ---</span>
                </div>
              ))}
            </>
          )}

          {!catError && catSuggestions.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#c6d1bc] bg-white p-3 text-center text-[11px] text-[#7c8f72]">
              Chưa phân tích AI — bấm &quot;Bắt đầu phân tích&quot; hoặc chọn danh mục thủ công bên dưới.
            </div>
          )}

          {/* Manual picker */}
          <div className="rounded-xl border border-dashed border-[#c9d3bf] bg-[#fafcf8] p-2.5">
            <p className="mb-2 text-[11px] text-[#6d7f62]">
              {catSuggestions.length > 0 ? "Không đúng gợi ý? Chọn danh mục thủ công:" : "Chọn danh mục thủ công:"}
            </p>
            <div className="relative">
              <Input
                value={manualCatQuery}
                onChange={(e) => onManualCatQueryChange(e.target.value)}
                placeholder="Tìm danh mục..."
                className="h-8 text-xs bg-white pr-7"
              />
              {manualCatQuery !== debouncedManualCatQuery && (
                <IconLoader2 className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-[#8a9a80]" />
              )}
            </div>
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {manualCategoryOptions.map((c, idx) => {
                const active = selCategory?.categoryId === c.id
                return (
                  <button
                    key={`cat-manual-${idx}-${String(c.id)}-${c.name ?? ""}`}
                    type="button"
                    onClick={() =>
                      onSelectCategory({
                        categoryId: c.id,
                        categoryName: c.name,
                        categoryPath: c.pathLabel,
                        confidenceScore: 1,
                      })
                    }
                    className={`w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                      active ? "bg-[#e9f0e2] text-[#2f3f27] font-medium" : "hover:bg-[#f2f6ee] text-[#5f7253]"
                    }`}
                  >
                    <span className="block line-clamp-2 break-words">{c.pathLabel}</span>
                    {c.level > 1 && (
                      <span className="mt-0.5 block text-[10px] font-normal text-[#8a9a80]">Cấp {c.level}</span>
                    )}
                  </button>
                )
              })}
              {manualCategoryOptions.length === 0 && (
                <p className="px-2 py-1 text-[11px] italic text-[#8a9a80]">Không tìm thấy danh mục phù hợp</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
