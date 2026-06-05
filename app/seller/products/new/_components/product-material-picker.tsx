"use client"

import * as React from "react"
import { IconLoader2, IconCheck, IconPlus, IconSearch } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { MaterialSuggestion, CategorySuggestion } from "@/services/ai-seller"
import type { MaterialDto } from "@/services/admin-materials"
import { materialSelectionKey, isPlatformMatSelected } from "./product-form-utils"

interface MaterialGroup { label: string; items: MaterialDto[] }

interface ProductMaterialPickerProps {
  selCategory: CategorySuggestion | null
  tagLoading: boolean
  matSuggestions: MaterialSuggestion[]
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
}

export function ProductMaterialPicker({
  selCategory,
  tagLoading,
  matSuggestions,
  selMatIds,
  onToggleMat,
  onTogglePlatformMat,
  matDialogOpen,
  onMatDialogOpenChange,
  platformMatLoading,
  platformMatQuery,
  onPlatformMatQueryChange,
  groupedPlatformMaterials,
  platformMaterials,
}: ProductMaterialPickerProps) {
  if (!selCategory) {
    return (
      <div className="rounded-xl border border-dashed border-[#c6d1bc] bg-[#fafcf8] p-3 text-[11px] text-[#7c8f72]">
        Chọn danh mục để thêm chất liệu.
      </div>
    )
  }

  if (tagLoading) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-[#728568]">
        <IconLoader2 className="size-3 animate-spin text-[#6f8659]" /> Đang tải...
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {matSuggestions.map((m, idx) => {
        const selectKey = materialSelectionKey(m, idx)
        const active = selMatIds.includes(selectKey)
        return (
          <button
            key={`${selectKey}-${idx}`}
            type="button"
            onClick={() => onToggleMat(selectKey)}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              active
                ? "border-[#8ea27a] bg-white text-[#415337]"
                : "border-[#cfd8c6] bg-white text-[#718267] hover:border-[#8ea27a]"
            }`}
          >
            {m.materialName}
            {active && <IconCheck className="size-3.5" />}
          </button>
        )
      })}

      {platformMaterials
        .filter(
          (mat) =>
            isPlatformMatSelected(mat, selMatIds, matSuggestions) &&
            !matSuggestions.some(
              (m) =>
                (m.materialId && m.materialId === mat.id) ||
                m.materialName?.trim().toLowerCase() === mat.name.trim().toLowerCase()
            )
        )
        .map((mat) => (
          <button
            key={`platform-mat-${mat.id}`}
            type="button"
            onClick={() => onTogglePlatformMat(mat)}
            className="inline-flex items-center gap-1 rounded-full border border-[#8ea27a] bg-white px-3 py-1 text-xs font-medium text-[#415337] transition-all hover:border-red-300 hover:text-red-500"
          >
            {mat.name}
            <IconCheck className="size-3.5" />
          </button>
        ))}

      {matSuggestions.length === 0 &&
        platformMaterials.filter(
          (mat) =>
            isPlatformMatSelected(mat, selMatIds, matSuggestions) &&
            !matSuggestions.some(
              (m) =>
                (m.materialId && m.materialId === mat.id) ||
                m.materialName?.trim().toLowerCase() === mat.name.trim().toLowerCase()
            )
        ).length === 0 && (
          <span className="text-[11px] italic text-[#8a9a80]">Không có gợi ý từ AI</span>
        )}

      <button
        type="button"
        onClick={() => onMatDialogOpenChange(true)}
        className="inline-flex items-center justify-center size-7 rounded-full border-2 border-dashed border-[#9db183] bg-white text-[#6b7f5e] hover:border-[#5a7248] hover:bg-[#f2f7ee] transition-all"
        title="Chọn chất liệu từ nền tảng"
      >
        <IconPlus className="size-3.5" />
      </button>

      <Dialog open={matDialogOpen} onOpenChange={onMatDialogOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-[#44553a]">Chọn chất liệu</DialogTitle>
            <p className="text-[11px] font-normal text-muted-foreground pt-0.5">
              Đã gom nhóm theo loại. Dùng ô tìm kiếm để thu hẹp nhanh.
            </p>
          </DialogHeader>
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={platformMatQuery}
              onChange={(e) => onPlatformMatQueryChange(e.target.value)}
              placeholder="Tìm chất liệu..."
              className="h-9 pl-8 text-sm"
              autoFocus
            />
          </div>
          {platformMatLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <IconLoader2 className="size-4 animate-spin" /> Đang tải...
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto py-1 pr-1 space-y-2">
              {groupedPlatformMaterials.map(({ label: grpLabel, items: grpItems }) => {
                if (grpItems.length === 0) return null
                return (
                  <details key={grpLabel} className="rounded-lg border border-[#e3eadb] bg-[#fafcf8] px-2 py-1" open>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1.5 text-[11px] font-semibold text-[#44553a] [&::-webkit-details-marker]:hidden">
                      <span>{grpLabel}</span>
                      <span className="font-normal text-muted-foreground">{grpItems.length}</span>
                    </summary>
                    <div className="flex flex-wrap gap-2 pb-2 pt-0.5">
                      {grpItems.map((mat) => {
                        const active = isPlatformMatSelected(mat, selMatIds, matSuggestions)
                        return (
                          <button
                            key={mat.id}
                            type="button"
                            onClick={() => onTogglePlatformMat(mat)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                              active
                                ? "border-[#8ea27a] bg-[#e9f0e2] text-[#415337]"
                                : "border-[#cfd8c6] bg-white text-[#718267] hover:border-[#8ea27a] hover:bg-[#f2f6ee]"
                            }`}
                          >
                            {mat.name}
                            {active && <IconCheck className="size-3.5" />}
                          </button>
                        )
                      })}
                    </div>
                  </details>
                )
              })}
              {platformMaterials.length === 0 && (
                <p className="w-full text-center text-sm italic text-muted-foreground py-4">Không tìm thấy chất liệu</p>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Đã chọn: <span className="font-semibold text-foreground">{selMatIds.length}</span> chất liệu
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
