"use client"

import { IconSearch } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export interface FilterOption {
    value: string
    label: string
}

export interface FilterConfig {
    key: string
    label: string
    options: FilterOption[]
    value: string
    onChange: (value: string) => void
    width?: string
}

interface FilterBarProps {
    searchPlaceholder?: string
    searchValue: string
    onSearchChange: (value: string) => void
    onSearch: () => void
    filters?: FilterConfig[]
}

export default function FilterBar({
    searchPlaceholder = "Tìm kiếm...",
    searchValue,
    onSearchChange,
    onSearch,
    filters = [],
}: FilterBarProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            onSearch()
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-lg">
            <div className="relative flex-1">
                <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-9 bg-background h-10"
                />
            </div>

            {filters.length > 0 && (
                <div className="flex items-center gap-2">
                    {filters.map((filter) => (
                        <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
                            <SelectTrigger className={`${filter.width ?? "w-[160px]"} bg-background h-10`}>
                                <SelectValue placeholder={filter.label} />
                            </SelectTrigger>
                            <SelectContent>
                                {filter.options.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ))}
                </div>
            )}

            <Button onClick={onSearch} className="h-9 shrink-0">
                <IconSearch className="size-4 mr-2" />
                Tìm kiếm
            </Button>
        </div>
    )
}
