"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconPackage, IconRefresh, IconSearch } from "@tabler/icons-react"
import { useSellerProducts } from "@/hooks/use-seller-products"
import { InventoryStats } from "./_components/inventory-stats"
import { InventoryTable } from "./_components/inventory-table"

export default function InventoryPage() {
  const { products, totalCount, loading, params, totalPages, setPage, setSearch, reload } = useSellerProducts()
  const [searchInput, setSearchInput] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(val), 400)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-5 lg:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <IconPackage className="size-5 text-muted-foreground" />
            Kho hàng
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Theo dõi và cập nhật số lượng tồn kho sản phẩm</p>
        </div>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
          <IconRefresh className="mr-1.5 size-4" />Làm mới
        </Button>
      </div>

      <InventoryStats products={products} loading={loading} />

      <div className="relative max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm tên sản phẩm..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <InventoryTable
        products={products}
        loading={loading}
        totalCount={totalCount}
        totalPages={totalPages}
        page={params.page}
        pageSize={params.pageSize}
        onPageChange={setPage}
      />
    </div>
  )
}
