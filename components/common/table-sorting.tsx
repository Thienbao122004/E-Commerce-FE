"use client"

import { IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface SortConfig {
    key: string
    direction: "asc" | "desc"
}

interface SortableTableHeadProps {
    sortKey: string
    currentSort: SortConfig | null
    onSort: (key: string) => void
    children: React.ReactNode
    className?: string
}

export function SortableTableHead({
    sortKey,
    currentSort,
    onSort,
    children,
    className,
}: SortableTableHeadProps) {
    const isActive = currentSort?.key === sortKey
    const direction = isActive ? currentSort.direction : null

    const handleClick = () => {
        onSort(sortKey)
    }

    return (
        <TableHead
            className={cn(
                "cursor-pointer select-none transition-colors hover:bg-muted/50",
                isActive && "text-foreground",
                className
            )}
            onClick={handleClick}
        >
            <div className="flex items-center gap-1">
                {children}
                <span className="inline-flex size-4 items-center justify-center">
                    {direction === "asc" ? (
                        <IconArrowUp className="size-3.5" />
                    ) : direction === "desc" ? (
                        <IconArrowDown className="size-3.5" />
                    ) : (
                        <IconArrowsSort className="size-3.5 opacity-30" />
                    )}
                </span>
            </div>
        </TableHead>
    )
}

export function getNextSort(currentSort: SortConfig | null, key: string): SortConfig | null {
    if (currentSort?.key !== key) return { key, direction: "asc" }
    if (currentSort.direction === "asc") return { key, direction: "desc" }
    return null
}
