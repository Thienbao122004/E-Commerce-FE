"use client"

import { IconSearch } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { UserStatus, UserStatusLabels } from "@/types/user"

interface UserFiltersProps {
    searchTerm: string
    roleFilter: string
    statusFilter: string
    onSearchChange: (value: string) => void
    onRoleFilterChange: (value: string) => void
    onStatusFilterChange: (value: string) => void
    onSearch: () => void
}

export default function UserFilters({
    searchTerm,
    roleFilter,
    statusFilter,
    onSearchChange,
    onRoleFilterChange,
    onStatusFilterChange,
    onSearch,
}: UserFiltersProps) {
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
                    placeholder="Tìm theo tên, email, số điện thoại..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-9 bg-background h-10"
                />
            </div>

            <div className="flex items-center gap-2">
                <Select value={roleFilter} onValueChange={onRoleFilterChange}>
                    <SelectTrigger className="w-[140px] bg-background h-10">
                        <SelectValue placeholder="Vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả vai trò</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="seller">Seller</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                    <SelectTrigger className="w-[180px] bg-background h-10">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value={String(UserStatus.Active)}>
                            {UserStatusLabels[UserStatus.Active]}
                        </SelectItem>
                        <SelectItem value={String(UserStatus.Inactive)}>
                            {UserStatusLabels[UserStatus.Inactive]}
                        </SelectItem>
                        <SelectItem value={String(UserStatus.Suspended)}>
                            {UserStatusLabels[UserStatus.Suspended]}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button onClick={onSearch} className="h-9 shrink-0">
                <IconSearch className="size-4 mr-2" />
                Tìm kiếm
            </Button>
        </div>
    )
}
