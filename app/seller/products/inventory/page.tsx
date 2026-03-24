"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { IconPackage, IconRefresh } from "@tabler/icons-react"
import { useSellerProducts } from "@/hooks/use-seller-products"
import type { SellerProduct } from "@/types/seller-dashboard"
import { InventoryStats } from "./_components/inventory-stats"
import { InventoryTable } from "./_components/inventory-table"
import FilterBar from "@/components/common/filter-bar"
import type { FilterConfig } from "@/components/common/filter-bar"
import { useDebounce } from "@/hooks/use-debounce"
import { useTableData } from "@/hooks/use-table-data"
import { getNextSort } from "@/components/common/table-sorting"
import type { SortConfig } from "@/components/common/table-sorting"
import { SetHeaderActions } from "@/hooks/use-header-actions"

export default function InventoryPage() {
  const { products, totalCount, loading, params, totalPages, setPage, setSearch, reload } = useSellerProducts()

  const [searchInput, setSearchInput] = useState("")
  const [sort, setSort] = useState<SortConfig | null>(null)
  const [stockFilter, setStockFilter] = useState("all")

  const debouncedSearch = useDebounce(searchInput)
  useEffect(() => { setSearch(debouncedSearch) }, [debouncedSearch, setSearch])

  const sortAccessor = (row: SellerProduct, key: string): string | number => {
    switch (key) {
      case "name": return row.name ?? ""
      case "basePrice": return row.basePrice
      case "totalStock": return row.totalStock ?? 0
      case "categoryName": return row.categoryName ?? ""
      default: return ""
    }
  }

  const { filtered: sortedProducts } = useTableData<SellerProduct>({
    data: products,
    sort,
    sortAccessor,
    filters: stockFilter === "all" ? [] : [
      {
        key: "stockWarning",
        value: stockFilter,
        match: (row) => {
          const stock = (row as SellerProduct).totalStock ?? 0
          if (stockFilter === "out") return stock === 0 ? "out" : "other"
          if (stockFilter === "low") return stock > 0 && stock <= 10 ? "low" : "other"
          return "other"
        },
      },
    ],
  })

  const filters: FilterConfig[] = [
    {
      key: "stockWarning",
      label: "Tình trạng kho",
      value: stockFilter,
      onChange: setStockFilter,
      width: "w-[170px]",
      options: [
        { value: "all", label: "Tất cả tình trạng" },
        { value: "out", label: "Hết hàng" },
        { value: "low", label: "Sắp hết (≤ 10)" },
      ],
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <SetHeaderActions>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
          <IconRefresh className="mr-1.5 size-4" />Làm mới
        </Button>
      </SetHeaderActions>

      <InventoryStats products={products} loading={loading} />

      <FilterBar
        searchPlaceholder="Tìm kiếm tên sản phẩm..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearch={() => setSearch(searchInput)}
        filters={filters}
      />

      <InventoryTable
        products={sortedProducts}
        loading={loading}
        totalCount={totalCount}
        totalPages={totalPages}
        page={params.page}
        pageSize={params.pageSize}
        sort={sort}
        onSort={(key) => setSort(getNextSort(sort, key))}
        onPageChange={setPage}
      />
    </div>
  )
}
