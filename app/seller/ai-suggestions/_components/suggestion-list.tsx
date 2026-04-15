"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  IconArrowRight,
  IconBrain,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconEdit,
  IconSearch,
  IconTag,
  IconX,
} from "@tabler/icons-react"
import type { TagSuggestionLogItem, TagSuggestionItem } from "@/services/ai-seller"

// ── Types ────────────────────────────────────────────────────────────────────
type ActionType = "accepted" | "modified" | "rejected"

const ACTION_CONFIG: Record<ActionType, { label: string; icon: React.ElementType; badgeCls: string; borderCls: string }> = {
  accepted: {
    label: "Đã chấp nhận",
    icon: IconCircleCheck,
    badgeCls: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    borderCls: "border-l-green-500",
  },
  modified: {
    label: "Đã chỉnh sửa",
    icon: IconEdit,
    badgeCls: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    borderCls: "border-l-blue-500",
  },
  rejected: {
    label: "Đã bỏ qua",
    icon: IconX,
    badgeCls: "bg-muted text-muted-foreground",
    borderCls: "border-l-border",
  },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 85 ? "bg-green-500" : pct >= 70 ? "bg-blue-500" : "bg-muted-foreground"
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-xs text-muted-foreground">Độ tin cậy</span>
      <span className={`text-base font-bold leading-none ${
        pct >= 85 ? "text-green-600 dark:text-green-400"
        : pct >= 70 ? "text-blue-600 dark:text-blue-400"
        : "text-muted-foreground"
      }`}>
        {pct}%
      </span>
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/** So sánh tags AI gợi ý vs tags seller đã chọn (cả hai đều là tag name strings) */
function TagDiff({ suggested, chosen }: { suggested: string[]; chosen: string[] }) {
  const added   = chosen.filter((t) => !suggested.includes(t))
  const removed = suggested.filter((t) => !chosen.includes(t))
  const kept    = suggested.filter((t) => chosen.includes(t))

  return (
    <div className="flex flex-wrap gap-1.5">
      {kept.map((t) => (
        <Badge key={t} variant="secondary" className="text-[11px] px-1.5 py-0">{t}</Badge>
      ))}
      {removed.map((t) => (
        <Badge key={t} className="text-[11px] px-1.5 py-0 line-through bg-red-50 text-red-500 dark:bg-red-900/20">{t}</Badge>
      ))}
      {added.map((t) => (
        <Badge key={t} className="text-[11px] px-1.5 py-0 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">+{t}</Badge>
      ))}
    </div>
  )
}

function SuggestionCard({ item }: { item: TagSuggestionLogItem }) {
  const [expanded, setExpanded] = useState(false)
  const action = item.action as ActionType
  const cfg = ACTION_CONFIG[action]
  const isModified = action === "modified"

  // Tên các tag AI gợi ý (dùng để hiển thị và so sánh)
  const suggestedTagNames = item.suggestedTags.map((t) => t.tag)

  // Tag có confidence cao nhất để hiển thị trên ConfidenceBar
  const topConfidence = item.suggestedTags.length > 0
    ? Math.max(...item.suggestedTags.map((t) => t.confidence))
    : 0

  return (
    <Card className={`border-l-4 ${cfg.borderCls} transition-colors hover:bg-muted/20`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Product name + action badge */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-medium text-sm">{item.inputTitle ?? "Sản phẩm không tên"}</span>
              <Badge className={`text-[11px] shrink-0 ${cfg.badgeCls}`}>
                <cfg.icon className="size-3 mr-1" />
                {cfg.label}
              </Badge>
            </div>

            {/* Tag comparison for modified items */}
            {isModified && (
              <div className="flex items-center gap-1.5 text-xs mb-2.5">
                <span className="text-muted-foreground w-16 shrink-0">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {suggestedTagNames.slice(0, 3).map((t) => (
                    <span key={t} className="line-through text-muted-foreground">{t}</span>
                  ))}
                  {suggestedTagNames.length > 3 && (
                    <span className="text-muted-foreground">+{suggestedTagNames.length - 3}</span>
                  )}
                </div>
                <IconArrowRight className="size-3 text-muted-foreground shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {item.chosenTags.slice(0, 3).map((t) => (
                    <span key={t} className="font-medium text-blue-600 dark:text-blue-400">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags display */}
            <div className="flex flex-wrap items-start gap-1.5">
              <IconTag className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
              {isModified && item.chosenTags.length > 0 ? (
                <TagDiff suggested={suggestedTagNames} chosen={item.chosenTags} />
              ) : (
                suggestedTagNames.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[11px] px-1.5 py-0">{t}</Badge>
                ))
              )}
            </div>

            {/* Expanded: show all tags with confidence */}
            {expanded && (
              <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                  <IconBrain className="size-3" /> Gợi ý AI (kèm độ tin cậy)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {item.suggestedTags.map((t) => (
                    <div key={t.tag} className="flex items-center gap-1 bg-background border rounded-full px-2 py-0.5">
                      <span className="text-[11px]">{t.tag}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {Math.round(t.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
                {isModified && item.chosenTags.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mt-2">
                      Tags đã chọn cuối cùng
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.chosenTags.map((t) => (
                        <Badge key={t} className="text-[11px] px-1.5 py-0 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
            <ConfidenceBar value={topConfidence} />
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? (
                  <><IconChevronUp className="size-3" />Ẩn bớt</>
                ) : (
                  <><IconChevronDown className="size-3" />Xem chi tiết</>
                )}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SuggestionSkeleton() {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-l-4 border-l-muted">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
                <div className="flex gap-1.5 mt-1">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-16 rounded-full" />
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

type Props = {
  items: TagSuggestionLogItem[]
  loading: boolean
  error: string | null
}

export function SuggestionList({ items, loading, error }: Props) {
  const [search, setSearch] = useState("")
  const [filterAction, setFilterAction] = useState<"all" | ActionType>("all")

  const filtered = items.filter((s) => {
    const matchSearch = (s.inputTitle ?? "").toLowerCase().includes(search.toLowerCase())
    const matchAction = filterAction === "all" || s.action === filterAction
    return matchSearch && matchAction
  })

  const counts = {
    all: items.length,
    accepted: items.filter((s) => s.action === "accepted").length,
    modified: items.filter((s) => s.action === "modified").length,
    rejected: items.filter((s) => s.action === "rejected").length,
  }

  return (
    <div className="grid gap-3">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên sản phẩm..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterAction} onValueChange={(v) => setFilterAction(v as typeof filterAction)}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
            <SelectValue placeholder="Lọc theo hành động" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả ({counts.all})</SelectItem>
            <SelectItem value="accepted">Đã chấp nhận ({counts.accepted})</SelectItem>
            <SelectItem value="modified">Đã chỉnh sửa ({counts.modified})</SelectItem>
            <SelectItem value="rejected">Đã bỏ qua ({counts.rejected})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <SuggestionSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-destructive">
          <IconBrain className="size-10 opacity-30" />
          <p className="text-sm">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <IconBrain className="size-10 opacity-20" />
          <p className="text-sm">
            {items.length === 0
              ? "Chưa có lịch sử gợi ý nào. Hãy dùng AI khi chỉnh sửa tags sản phẩm."
              : "Không có gợi ý nào phù hợp với bộ lọc."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            {filtered.map((s) => (
              <SuggestionCard key={s.id} item={s} />
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground pt-2">
            Hiển thị {filtered.length} / {items.length} gợi ý
          </p>
        </>
      )}
    </div>
  )
}
