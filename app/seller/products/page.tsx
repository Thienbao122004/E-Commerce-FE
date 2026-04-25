"use client"

import React, { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { IconPlus, IconRefresh } from "@tabler/icons-react"
import { useSellerProducts } from "@/hooks/use-seller-products"
import { ProductStatus } from "@/types/seller-dashboard"
import { ProductStats } from "./_components/product-stats"
import { ProductTable } from "./_components/product-table"
import { ProductDeleteDialog } from "./_components/product-delete-dialog"
import { SellerProductDetailView } from "./_components/seller-product-detail-view"
import FilterBar from "@/components/common/filter-bar"
import type { FilterConfig } from "@/components/common/filter-bar"
import { useDebounce } from "@/hooks/use-debounce"
import { useTableData } from "@/hooks/use-table-data"
import { getNextSort } from "@/components/common/table-sorting"
import type { SortConfig } from "@/components/common/table-sorting"
import type { SellerProduct } from "@/types/seller-dashboard"
import { SetHeaderActions } from "@/hooks/use-header-actions"

function SellerProductsContent({ onReady }: { onReady?: (reload: () => void, loading: boolean) => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productIdFromUrl = searchParams.get("id")
  const prevProductIdRef = React.useRef<string | null>(productIdFromUrl)

  const { products, totalCount, loading, actionLoading, params, totalPages, setPage, setStatus, setSearch, remove, reload } = useSellerProducts()

  React.useEffect(() => {
    onReady?.(reload, loading)
  }, [reload, loading, onReady])

  React.useEffect(() => {
    const prevProductId = prevProductIdRef.current

    if (prevProductId && !productIdFromUrl) {
      reload()
    }

    prevProductIdRef.current = productIdFromUrl
  }, [productIdFromUrl, reload])

  const [searchInput, setSearchInput] = useState("")
  const [sort, setSort] = useState<SortConfig | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const debouncedSearch = useDebounce(searchInput)
  useEffect(() => { setSearch(debouncedSearch) }, [debouncedSearch, setSearch])

  const sortAccessor = (row: SellerProduct, key: string): string | number => {
    switch (key) {
      case "name": return row.name ?? ""
      case "categoryName": return row.categoryName ?? ""
      case "basePrice": return row.basePrice
      case "totalStock": return row.totalStock ?? 0
      case "status": return row.status
      case "createdAt": return row.createdAt ?? ""
      default: return ""
    }
  }

  const { filtered: sortedProducts } = useTableData<SellerProduct>({
    data: products,
    sort,
    sortAccessor,
  })

  const filters: FilterConfig[] = [
    {
      key: "status",
      label: "Trạng thái",
      value: params.status !== undefined ? String(params.status) : "all",
      onChange: (v) => setStatus(v === "all" ? undefined : Number(v)),
      width: "w-[160px]",
      options: [
        { value: "all", label: "Tất cả trạng thái" },
        { value: String(ProductStatus.PendingApproval), label: "Chờ duyệt" },
        { value: String(ProductStatus.Active), label: "Đang bán" },
        { value: String(ProductStatus.Draft), label: "Nháp" },
        { value: String(ProductStatus.Hidden), label: "Đã ẩn" },
        { value: String(ProductStatus.OutOfStock), label: "Hết hàng" },
        { value: String(ProductStatus.Removed), label: "Đã gỡ" },
      ],
    },
  ]

  const handleDelete = async () => {
    if (!deleteTarget) return
    const ok = await remove(deleteTarget.id)
    if (ok) setDeleteTarget(null)
  }

  const viewDetail = (id: string) => {
    router.push(`/seller/products?id=${id}`, { scroll: false })
  }

  const goBack = React.useCallback(() => {
    router.push("/seller/products", { scroll: false })
  }, [router])

  if (productIdFromUrl) {
    return (
      <SellerProductDetailView
        productId={productIdFromUrl}
        onBack={goBack}
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">

      <ProductStats products={products} totalCount={totalCount} loading={loading} />

      <FilterBar
        searchPlaceholder="Tìm kiếm sản phẩm..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearch={() => setSearch(searchInput)}
        filters={filters}
      />

      <ProductTable
        products={sortedProducts}
        loading={loading}
        totalCount={totalCount}
        totalPages={totalPages}
        page={params.page}
        pageSize={params.pageSize}
        sort={sort}
        onSort={(key) => setSort(getNextSort(sort, key))}
        onDeleteClick={(id, name) => setDeleteTarget({ id, name })}
        onPageChange={setPage}
        onViewDetail={viewDetail}
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

export default function SellerProductsPage() {
  const [reload, setReload] = React.useState<(() => void) | null>(null)
  const [loading, setLoading] = React.useState(true)

  const handleReady = React.useCallback((reloadFn: () => void, isLoading: boolean) => {
    setReload(() => reloadFn)
    setLoading(isLoading)
  }, [])

  return (
    <>
      <SetHeaderActions>
        <Button variant="outline" size="sm" onClick={() => reload?.()} disabled={loading || !reload}>
          <IconRefresh className="mr-1.5 size-4" />Làm mới
        </Button>
        <Button size="sm" asChild>
          <Link href="/seller/products/new">
            <IconPlus className="mr-1.5 size-4" />Thêm mới
          </Link>
        </Button>
      </SetHeaderActions>
      <Suspense>
        <SellerProductsContent onReady={handleReady} />
      </Suspense>
    </>
  )
}
