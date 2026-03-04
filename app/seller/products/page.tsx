"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPlus, IconRefresh, IconSearch } from "@tabler/icons-react"
import { useSellerProducts } from "@/hooks/use-seller-products"
import { ProductStatus } from "@/types/seller-dashboard"
import { ProductStats } from "./_components/product-stats"
import { ProductTable } from "./_components/product-table"
import { ProductDeleteDialog } from "./_components/product-delete-dialog"

const STATUS_OPTIONS = [
  { label: "Tất cả", value: "all" },
  { label: "Đang bán", value: String(ProductStatus.Active) },
  { label: "Nháp", value: String(ProductStatus.Draft) },
  { label: "Đã ẩn", value: String(ProductStatus.Hidden) },
]

export default function SellerProductsPage() {
  const { products, totalCount, loading, actionLoading, params, totalPages, setPage, setStatus, setSearch, remove, reload } = useSellerProducts()
  const [searchInput, setSearchInput] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(val), 400)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const ok = await remove(deleteTarget.id)
    if (ok) setDeleteTarget(null)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-5 lg:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Sản phẩm</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quản lý tất cả sản phẩm của cửa hàng</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
            <IconRefresh className="mr-1.5 size-4" />Làm mới
          </Button>
          <Button size="sm" asChild>
            <Link href="/seller/products/new">
              <IconPlus className="mr-1.5 size-4" />Thêm mới
            </Link>
          </Button>
        </div>
      </div>

      <ProductStats products={products} totalCount={totalCount} loading={loading} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={params.status !== undefined ? String(params.status) : "all"}
          onValueChange={(val) => setStatus(val === "all" ? undefined : Number(val))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ProductTable
        products={products}
        loading={loading}
        totalCount={totalCount}
        totalPages={totalPages}
        page={params.page}
        pageSize={params.pageSize}
        onDeleteClick={(id, name) => setDeleteTarget({ id, name })}
        onPageChange={setPage}
      />

      <ProductDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        loading={actionLoading}
        productName={deleteTarget?.name ?? ""}
        onConfirm={handleDelete}
      />
    </div>
  )
}
