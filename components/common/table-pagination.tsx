"use client"

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface TablePaginationProps {
    currentPage: number
    totalPages: number
    totalItems: number
    onPageChange: (page: number) => void
    itemLabel?: string
    pageSize?: number
    onPageSizeChange?: (size: number) => void
    pageSizeOptions?: number[]
}

export default function TablePagination({
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
    itemLabel = "mục",
    pageSize,
    onPageSizeChange,
    pageSizeOptions,
}: TablePaginationProps) {
    if (totalPages <= 1 && !pageSizeOptions) return null

    return (
        <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
                Trang {currentPage} / {totalPages} · {totalItems} {itemLabel}
            </p>

            <div className="flex items-center gap-3">
                {pageSizeOptions && pageSize && onPageSizeChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm whitespace-nowrap">Hiển thị</span>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(v) => onPageSizeChange(Number(v))}
                        >
                            <SelectTrigger className="w-[72px] h-8 bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {pageSizeOptions.map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        <IconChevronLeft className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        <IconChevronRight className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
