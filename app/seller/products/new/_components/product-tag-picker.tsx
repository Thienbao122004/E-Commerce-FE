"use client"

import * as React from "react"
import { IconLoader2, IconCheck, IconPlus, IconSearch } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { TagSuggestion, CategorySuggestion } from "@/services/ai-seller"
import type { Tag } from "@/types/tag"
import { parseTagIdFromSuggestion } from "./product-form-utils"

interface TagGroup { label: string; items: Tag[] }

interface ProductTagPickerProps {
  selCategory: CategorySuggestion | null
  tagLoading: boolean
  tagSuggestions: TagSuggestion[]
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
}

export function ProductTagPicker({
  selCategory,
  tagLoading,
  tagSuggestions,
  selTagIds,
  onToggleTag,
  onTogglePlatformTag,
  platformTags,
  tagDialogOpen,
  onTagDialogOpenChange,
  platformTagLoading,
  platformTagQuery,
  onPlatformTagQueryChange,
  groupedPlatformTags,
}: ProductTagPickerProps) {
  if (!selCategory) {
    return (
      <div className="rounded-xl border border-dashed border-[#c6d1bc] bg-[#fffdfb] p-3 text-[11px] text-[#7c8f72]">
        Chọn danh mục để thêm thẻ gợi ý.
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
      {tagSuggestions.map((tag, idx) => {
        const tagId = parseTagIdFromSuggestion(tag as TagSuggestion & { tag_id?: unknown })
        const active = tagId !== null ? selTagIds.includes(tagId) : false
        return (
          <button
            key={`${tagId ?? "unknown"}-${tag.tagName}-${idx}`}
            type="button"
            onClick={() => { if (tagId !== null) onToggleTag(tagId) }}
            disabled={tagId === null}
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
              active
                ? "border-[#e8b37f] bg-white text-[#b06017]"
                : "border-[#efd4b7] bg-white text-[#c06f2a] hover:border-[#e8b37f]"
            }`}
          >
            #{tag.tagName}
            {active && <IconCheck className="size-3" />}
          </button>
        )
      })}

      {platformTags
        .filter(
          (t) =>
            selTagIds.includes(t.id) &&
            !tagSuggestions.some(
              (s) => parseTagIdFromSuggestion(s as TagSuggestion & { tag_id?: unknown }) === t.id
            )
        )
        .map((t) => (
          <button
            key={`platform-tag-${t.id}`}
            type="button"
            onClick={() => onTogglePlatformTag(t)}
            className="inline-flex items-center gap-1 rounded-md border border-[#e8b37f] bg-white px-2.5 py-1 text-xs font-medium text-[#b06017] transition-all hover:border-red-300 hover:text-red-500"
          >
            #{t.name}
            <IconCheck className="size-3" />
          </button>
        ))}

      {tagSuggestions.length === 0 &&
        platformTags.filter(
          (t) =>
            selTagIds.includes(t.id) &&
            !tagSuggestions.some(
              (s) => parseTagIdFromSuggestion(s as TagSuggestion & { tag_id?: unknown }) === t.id
            )
        ).length === 0 &&
        selCategory && !tagLoading && (
          <span className="text-[11px] italic text-[#8a9a80]">Không có gợi ý tag từ AI</span>
        )}

      <button
        type="button"
        onClick={() => onTagDialogOpenChange(true)}
        className="inline-flex items-center justify-center size-7 rounded-md border-2 border-dashed border-[#e8b37f] bg-white text-[#c06f2a] hover:border-[#d49640] hover:bg-[#fdf5eb] transition-all"
        title="Chọn thẻ từ nền tảng"
      >
        <IconPlus className="size-3.5" />
      </button>

      <Dialog open={tagDialogOpen} onOpenChange={onTagDialogOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-[#8a3d05]">Chọn thẻ</DialogTitle>
            <p className="text-[11px] font-normal text-muted-foreground pt-0.5">
              Đã nhóm theo loại. Dùng ô tìm để thu hẹp.
            </p>
          </DialogHeader>
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={platformTagQuery}
              onChange={(e) => onPlatformTagQueryChange(e.target.value)}
              placeholder="Tìm thẻ..."
              className="h-9 pl-8 text-sm"
              autoFocus
            />
          </div>
          {platformTagLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <IconLoader2 className="size-4 animate-spin" /> Đang tải...
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto py-1 pr-1 space-y-2">
              {groupedPlatformTags.map(({ label: grpLabel, items: grpItems }) => {
                if (grpItems.length === 0) return null
                return (
                  <details key={grpLabel} className="rounded-lg border border-[#f0e0d0] bg-[#fffdfb] px-2 py-1" open>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1.5 text-[11px] font-semibold text-[#8a3d05] [&::-webkit-details-marker]:hidden">
                      <span>{grpLabel}</span>
                      <span className="font-normal text-muted-foreground">{grpItems.length}</span>
                    </summary>
                    <div className="flex flex-wrap gap-2 pb-2 pt-0.5">
                      {grpItems.map((tag) => {
                        const active = selTagIds.includes(tag.id)
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => onTogglePlatformTag(tag)}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                              active
                                ? "border-[#e8b37f] bg-[#fdf0e2] text-[#b06017]"
                                : "border-[#efd4b7] bg-white text-[#c06f2a] hover:border-[#e8b37f] hover:bg-[#fdf5eb]"
                            }`}
                          >
                            #{tag.name}
                            {active && <IconCheck className="size-3.5" />}
                          </button>
                        )
                      })}
                    </div>
                  </details>
                )
              })}
              {platformTags.length === 0 && (
                <p className="w-full text-center text-sm italic text-muted-foreground py-4">Không tìm thấy thẻ</p>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Đã chọn: <span className="font-semibold text-foreground">{selTagIds.length}</span> thẻ
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
