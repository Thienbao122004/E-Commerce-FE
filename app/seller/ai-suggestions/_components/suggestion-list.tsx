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

type ActionType = "accepted" | "modified" | "rejected"

type Suggestion = {
  id: string
  productName: string
  aiCategory: string
  aiSubcategory: string
  aiTags: string[]
  finalCategory?: string
  finalSubcategory?: string
  finalTags?: string[]
  confidence: number
  action: ActionType
  aiRationale: string
  createdAt: string
}

const MOCK_DATA: Suggestion[] = [
  {
    id: "1",
    productName: "Túi da thủ công Vintage Brown",
    aiCategory: "Phụ kiện thời trang",
    aiSubcategory: "Túi xách",
    aiTags: ["handmade", "da bò", "vintage", "thủ công"],
    confidence: 92,
    action: "accepted",
    aiRationale: 'Phát hiện từ khóa "da thủ công" và "Vintage" trong tên sản phẩm, gợi ý danh mục phụ kiện với độ tin cậy cao.',
    createdAt: "2026-03-01T10:30:00",
  },
  {
    id: "2",
    productName: "Nến thơm tinh dầu sả chanh",
    aiCategory: "Gia dụng & Nội thất",
    aiSubcategory: "Trang trí nhà cửa",
    aiTags: ["nến thơm", "tinh dầu", "handmade", "organic"],
    finalCategory: "Sức khỏe & Làm đẹp",
    finalSubcategory: "Hương liệu & Tinh dầu",
    finalTags: ["nến thơm", "tinh dầu", "handmade", "organic", "sả chanh"],
    confidence: 85,
    action: "modified",
    aiRationale: 'AI nhận dạng "nến thơm" là vật trang trí, nhưng seller chuyển sang Sức khỏe & Làm đẹp phù hợp hơn với sản phẩm.',
    createdAt: "2026-02-28T14:15:00",
  },
  {
    id: "3",
    productName: "Bộ trang sức bạc thổ cẩm",
    aiCategory: "Trang sức",
    aiSubcategory: "Dây chuyền",
    aiTags: ["bạc 925", "thổ cẩm", "dân tộc", "handmade"],
    confidence: 78,
    action: "accepted",
    aiRationale: 'Từ khóa "bạc" và "trang sức" được phát hiện. Subcategory "Dây chuyền" được chọn dựa trên mẫu dữ liệu tương tự.',
    createdAt: "2026-02-27T09:00:00",
  },
  {
    id: "4",
    productName: "Áo dài truyền thống lụa tơ tằm",
    aiCategory: "Thời trang",
    aiSubcategory: "Trang phục nữ",
    aiTags: ["áo dài", "lụa", "truyền thống", "cao cấp"],
    confidence: 95,
    action: "accepted",
    aiRationale: 'Phân tích "áo dài" + "lụa tơ tằm" → thời trang truyền thống Việt Nam. Độ chính xác rất cao.',
    createdAt: "2026-02-26T16:45:00",
  },
  {
    id: "5",
    productName: "Xà phòng dừa hữu cơ cold process",
    aiCategory: "Sức khỏe & Làm đẹp",
    aiSubcategory: "Chăm sóc da",
    aiTags: ["organic", "cold process", "dừa", "thuần tự nhiên"],
    confidence: 60,
    action: "rejected",
    aiRationale: 'Phát hiện "xà phòng" và "hữu cơ" nhưng độ tin cậy thấp do "cold process" là thuật ngữ ít gặp trong dataset.',
    createdAt: "2026-02-25T11:20:00",
  },
  {
    id: "6",
    productName: "Giỏ mây tre đan thủ công",
    aiCategory: "Gia dụng & Nội thất",
    aiSubcategory: "Đồ gia dụng",
    aiTags: ["mây tre", "handmade", "bền vững", "thiên nhiên"],
    finalCategory: "Thủ công mỹ nghệ",
    finalSubcategory: "Đồ đan lát",
    finalTags: ["mây tre", "handmade", "bền vững", "thiên nhiên", "quà tặng"],
    confidence: 88,
    action: "modified",
    aiRationale: 'AI xếp vào Gia dụng nhưng seller chuyển sang Thủ công mỹ nghệ và thêm tag "quà tặng" phù hợp hơn với định vị sản phẩm.',
    createdAt: "2026-02-24T08:30:00",
  },
]

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
  const color = value >= 85 ? "bg-green-500" : value >= 70 ? "bg-blue-500" : "bg-muted-foreground"
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-xs text-muted-foreground">Độ tin cậy</span>
      <span className={`text-base font-bold leading-none ${
        value >= 85 ? "text-green-600 dark:text-green-400"
        : value >= 70 ? "text-blue-600 dark:text-blue-400"
        : "text-muted-foreground"
      }`}>
        {value}%
      </span>
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function TagDiff({ original, final }: { original: string[]; final: string[] }) {
  const added = final.filter((t) => !original.includes(t))
  const removed = original.filter((t) => !final.includes(t))
  const kept = original.filter((t) => final.includes(t))

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

function SuggestionCard({ s }: { s: Suggestion }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = ACTION_CONFIG[s.action]
  const isModified = s.action === "modified"

  return (
    <Card className={`border-l-4 ${cfg.borderCls} transition-colors hover:bg-muted/20`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-medium text-sm">{s.productName}</span>
              <Badge className={`text-[11px] shrink-0 ${cfg.badgeCls}`}>
                <cfg.icon className="size-3 mr-1" />
                {cfg.label}
              </Badge>
            </div>

            {isModified ? (
              <div className="grid gap-1.5 mb-2.5">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground w-16 shrink-0">Danh mục</span>
                  <span className="line-through text-muted-foreground">{s.aiCategory}</span>
                  <IconArrowRight className="size-3 text-muted-foreground shrink-0" />
                  <span className="font-medium text-blue-600 dark:text-blue-400">{s.finalCategory}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground w-16 shrink-0">Phân loại</span>
                  <span className="line-through text-muted-foreground">{s.aiSubcategory}</span>
                  <IconArrowRight className="size-3 text-muted-foreground shrink-0" />
                  <span className="font-medium text-blue-600 dark:text-blue-400">{s.finalSubcategory}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2.5">
                <span>
                  <span className="font-medium text-foreground/70">Danh mục:</span>{" "}
                  {s.aiCategory}
                </span>
                <span>
                  <span className="font-medium text-foreground/70">Phân loại:</span>{" "}
                  {s.aiSubcategory}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-start gap-1.5">
              <IconTag className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
              {isModified && s.finalTags ? (
                <TagDiff original={s.aiTags} final={s.finalTags} />
              ) : (
                s.aiTags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[11px] px-1.5 py-0">{t}</Badge>
                ))
              )}
            </div>

            {expanded && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <IconBrain className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">{s.aiRationale}</p>
              </div>
            )}
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
            <ConfidenceBar value={s.confidence} />
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">
                {new Date(s.createdAt).toLocaleDateString("vi-VN", {
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
                  <><IconChevronDown className="size-3" />Xem lý do AI</>
                )}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SuggestionList() {
  const [search, setSearch] = useState("")
  const [filterAction, setFilterAction] = useState<"all" | ActionType>("all")

  const filtered = MOCK_DATA.filter((s) => {
    const matchSearch = s.productName.toLowerCase().includes(search.toLowerCase())
    const matchAction = filterAction === "all" || s.action === filterAction
    return matchSearch && matchAction
  })

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
            <SelectItem value="all">Tất cả ({MOCK_DATA.length})</SelectItem>
            <SelectItem value="accepted">Đã chấp nhận ({MOCK_DATA.filter((s) => s.action === "accepted").length})</SelectItem>
            <SelectItem value="modified">Đã chỉnh sửa ({MOCK_DATA.filter((s) => s.action === "modified").length})</SelectItem>
            <SelectItem value="rejected">Đã bỏ qua ({MOCK_DATA.filter((s) => s.action === "rejected").length})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <IconBrain className="size-10 opacity-20" />
          <p className="text-sm">Không có gợi ý nào phù hợp.</p>
        </div>
      )}

      <div className="grid gap-2">
        {filtered.map((s) => (
          <SuggestionCard key={s.id} s={s} />
        ))}
      </div>

      {filtered.length > 0 && (
        <p className="text-center text-xs text-muted-foreground pt-2">
          Dữ liệu mẫu · Tích hợp API khi backend sẵn sàng
        </p>
      )}
    </div>
  )
}
