"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
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
  IconBrain,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconEdit,
  IconPalette,
  IconSearch,
  IconX,
} from "@tabler/icons-react"
import type { MaterialSuggestionLogItem } from "@/types/ai-seller"

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

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 85 ? "bg-green-500" : pct >= 70 ? "bg-blue-500" : "bg-muted-foreground"
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-xs text-muted-foreground">Độ tin cậy</span>
      <span
        className={`text-base font-bold leading-none ${
          pct >= 85
            ? "text-green-600 dark:text-green-400"
            : pct >= 70
              ? "text-blue-600 dark:text-blue-400"
              : "text-muted-foreground"
        }`}
      >
        {pct}%
      </span>
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function MaterialDiff({ suggested, chosen }: { suggested: string[]; chosen: string[] }) {
  const added = chosen.filter((t) => !suggested.includes(t))
  const removed = suggested.filter((t) => !chosen.includes(t))
  const kept = suggested.filter((t) => chosen.includes(t))

  return (
    <div className="flex flex-wrap gap-1.5">
      {kept.map((t) => (
        <Badge key={t} variant="secondary" className="text-[11px] px-1.5 py-0">
          {t}
        </Badge>
      ))}
      {removed.map((t) => (
        <Badge
          key={t}
          className="text-[11px] px-1.5 py-0 line-through bg-red-50 text-red-500 dark:bg-red-900/20"
        >
          {t}
        </Badge>
      ))}
      {added.map((t) => (
        <Badge
          key={t}
          className="text-[11px] px-1.5 py-0 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
        >
          +{t}
        </Badge>
      ))}
    </div>
  )
}

function MaterialCard({ item }: { item: MaterialSuggestionLogItem }) {
  const [expanded, setExpanded] = useState(false)
  const action = item.action as ActionType
  const cfg = ACTION_CONFIG[action]
  const isModified = action === "modified"

  const suggestedNames = item.suggestedMaterials.map((m) => m.materialName)
  const topConfidence =
    item.suggestedMaterials.length > 0
      ? Math.max(...item.suggestedMaterials.map((m) => m.confidence))
      : 0

  const title = item.productName?.trim() || "Sản phẩm"

  return (
    <Card className={`border-l-4 ${cfg.borderCls} transition-colors hover:bg-muted/20`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-medium text-sm">{title}</span>
              <Badge className={`text-[11px] shrink-0 ${cfg.badgeCls}`}>
                <cfg.icon className="size-3 mr-1" />
                {cfg.label}
              </Badge>
            </div>

            {isModified && (
              <div className="flex items-center gap-1.5 text-xs mb-2.5 flex-wrap">
                <span className="text-muted-foreground w-16 shrink-0">Chất liệu</span>
                <div className="flex flex-wrap gap-1">
                  {suggestedNames.slice(0, 3).map((t) => (
                    <span key={t} className="line-through text-muted-foreground">
                      {t}
                    </span>
                  ))}
                  {suggestedNames.length > 3 && (
                    <span className="text-muted-foreground">+{suggestedNames.length - 3}</span>
                  )}
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="flex flex-wrap gap-1">
                  {item.chosenMaterialNames.slice(0, 3).map((t) => (
                    <span key={t} className="font-medium text-blue-600 dark:text-blue-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-start gap-1.5">
              <IconPalette className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
              {isModified && item.chosenMaterialNames.length > 0 ? (
                <MaterialDiff suggested={suggestedNames} chosen={item.chosenMaterialNames} />
              ) : (
                suggestedNames.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[11px] px-1.5 py-0">
                    {t}
                  </Badge>
                ))
              )}
            </div>

            {expanded && (
              <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                  <IconBrain className="size-3" /> Gợi ý AI (độ tin cậy)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {item.suggestedMaterials.map((m) => (
                    <div
                      key={`${m.materialName}-${m.materialId ?? ""}`}
                      className="flex items-center gap-1 bg-background border rounded-full px-2 py-0.5"
                    >
                      <span className="text-[11px]">{m.materialName}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {Math.round(m.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
                {isModified && item.chosenMaterialNames.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mt-2">
                      Chất liệu đã chọn
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.chosenMaterialNames.map((t) => (
                        <Badge
                          key={t}
                          className="text-[11px] px-1.5 py-0 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        >
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
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? (
                  <>
                    <IconChevronUp className="size-3" />
                    Ẩn bớt
                  </>
                ) : (
                  <>
                    <IconChevronDown className="size-3" />
                    Xem chi tiết
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MaterialSuggestionSkeleton() {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-l-4 border-l-muted">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-1.5 mt-1">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-20 rounded-full" />
                  ))}
                </div>
              </div>
              <Skeleton className="h-8 w-14 shrink-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

type Props = {
  items: MaterialSuggestionLogItem[]
  loading: boolean
  error: string | null
}

export function MaterialSuggestionList({ items, loading, error }: Props) {
  const [search, setSearch] = useState("")
  const [filterAction, setFilterAction] = useState<"all" | ActionType>("all")

  const filtered = items.filter((s) => {
    const label = (s.productName ?? "").toLowerCase()
    const matchSearch = label.includes(search.toLowerCase())
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
        <MaterialSuggestionSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-destructive">
          <IconPalette className="size-10 opacity-30" />
          <p className="text-sm">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <IconPalette className="size-10 opacity-20" />
          <p className="text-sm">
            {items.length === 0
              ? "Chưa có lịch sử gợi ý chất liệu. Hãy dùng AI khi thêm sản phẩm rồi lưu."
              : "Không có mục nào phù hợp với bộ lọc."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            {filtered.map((s) => (
              <MaterialCard key={s.id} item={s} />
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
