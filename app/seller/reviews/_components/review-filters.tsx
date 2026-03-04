"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconFilter, IconSearch } from "@tabler/icons-react"

type Props = {
  search: string
  filterRating: string
  filterReply: string
  onSearchChange: (v: string) => void
  onRatingChange: (v: string) => void
  onReplyChange: (v: string) => void
}

export function ReviewFilters({ search, filterRating, filterReply, onSearchChange, onRatingChange, onReplyChange }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên, sản phẩm, nội dung..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Select value={filterRating} onValueChange={onRatingChange}>
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <IconFilter className="size-3.5 mr-1.5" />
            <SelectValue placeholder="Số sao" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {[5, 4, 3, 2, 1].map((s) => (
              <SelectItem key={s} value={String(s)}>{s} sao</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterReply} onValueChange={onReplyChange}>
          <SelectTrigger className="w-[145px] h-9 text-xs">
            <SelectValue placeholder="Trạng thái phản hồi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="replied">Đã phản hồi</SelectItem>
            <SelectItem value="not_replied">Chưa phản hồi</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
