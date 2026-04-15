import * as React from "react"
import type { SortConfig } from "@/components/common/table-sorting"

type FilterDef = {
    key: string
    value: string
    match: (row: Record<string, unknown>) => unknown
}

type Options<T> = {
    data: T[]
    search?: string
    searchKeys?: (keyof T)[]
    filters?: FilterDef[]
    sort?: SortConfig | null
    sortAccessor?: (row: T, key: string) => string | number
}

export function useTableData<T extends Record<string, unknown>>({
    data,
    search,
    searchKeys = [],
    filters = [],
    sort,
    sortAccessor,
}: Options<T>) {
    const filtered = React.useMemo(() => {
        let result = data

        if (search) {
            const q = search.toLowerCase()
            result = result.filter((row) =>
                searchKeys.some((k) => {
                    const v = row[k]
                    return typeof v === "string" && v.toLowerCase().includes(q)
                })
            )
        }

        for (const f of filters) {
            if (f.value === "all") continue
            const numVal = Number(f.value)
            result = result.filter((row) => {
                const fieldVal = f.match(row)
                return typeof fieldVal === "number" ? fieldVal === numVal : String(fieldVal) === f.value
            })
        }

        return result
    }, [data, search, searchKeys, filters])

    const sorted = React.useMemo(() => {
        if (!sort || !sortAccessor) return filtered
        const { key, direction } = sort
        const dir = direction === "asc" ? 1 : -1
        return [...filtered].sort((a, b) => {
            const av = sortAccessor(a, key)
            const bv = sortAccessor(b, key)
            if (av < bv) return -1 * dir
            if (av > bv) return 1 * dir
            return 0
        })
    }, [filtered, sort, sortAccessor])

    return { filtered: sorted, count: sorted.length }
}
