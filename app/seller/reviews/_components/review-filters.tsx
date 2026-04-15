"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconSearch, IconX } from "@tabler/icons-react"
import { useDebounce } from "@/hooks/use-debounce"

type Props = {
  search: string
  filterRating: string
  onSearchChange: (v: string) => void
  onRatingChange: (v: string) => void
}

export function ReviewFilters({ search, filterRating, onSearchChange, onRatingChange }: Props) {
  const debounced = useDebounce(search)
  const isPending = search !== debounced

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên, sản phẩm, nội dung..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 pr-8 h-9 text-sm"
        />
        {isPending && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5">
            <div className="size-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
          </div>
        )}
        {!isPending && search && (
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => onSearchChange("")}
            tabIndex={-1}
          >
            <IconX className="size-3.5" />
          </button>
        )}
      </div>
      <Select value={filterRating} onValueChange={onRatingChange}>
        <SelectTrigger className="w-[130px] h-9 text-xs sm:w-[140px]">
          <SelectValue placeholder="Số sao" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả sao</SelectItem>
          {[5, 4, 3, 2, 1].map((s) => (
            <SelectItem key={s} value={String(s)}>{s} sao</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
