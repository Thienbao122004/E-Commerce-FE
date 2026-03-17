"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  IconEye, IconEyeOff, IconTrash, IconRefresh, IconPackage,
} from "@tabler/icons-react"
import Image from "next/image"
import dynamic from "next/dynamic"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useProducts } from "@/hooks/use-products"
import { fetchProductById } from "@/services/products"
import { supabase } from "@/lib/supabase"
import { ProductStatus, ProductStatusLabels, ProductStatusColors } from "@/types/product"
import type { ProductModeration } from "@/types/product"
const ProductDetailView = dynamic(() => import("./_components/product-detail-view").then(m => m.ProductDetailView), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" /></div>,
})
const ActionDialog = dynamic(() => import("./_components/action-dialog").then(m => m.ActionDialog))

import FilterBar from "@/components/common/filter-bar"
import type { FilterConfig } from "@/components/common/filter-bar"
import TablePagination from "@/components/common/table-pagination"
import { SortableTableHead, getNextSort } from "@/components/common/table-sorting"
import type { SortConfig } from "@/components/common/table-sorting"
import { useDebounce } from "@/hooks/use-debounce"
import { useTableData } from "@/hooks/use-table-data"
import { SetHeaderActions } from "@/hooks/use-header-actions"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

const formatDate = (ts: string) =>
  new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productIdFromUrl = searchParams.get("id")

  const {
    products, totalCount, loading, actionLoading, params, totalPages,
    setPage, setStatus, setSearch, hideProduct, unhideProduct, removeProduct, reload,
  } = useProducts()

  const [searchInput, setSearchInput] = React.useState("")
  const debouncedSearch = useDebounce(searchInput)
  const [sort, setSort] = React.useState<SortConfig | null>(null)
  const [dialogState, setDialogState] = React.useState<{
    type: "hide" | "remove" | "unhide" | null
    product: ProductModeration | null
  }>({ type: null, product: null })

  const [selectedProduct, setSelectedProduct] = React.useState<ProductModeration | null>(null)
  const [detailLoading, setDetailLoading] = React.useState(false)

  React.useEffect(() => { setSearch(debouncedSearch) }, [debouncedSearch, setSearch])

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const loadProductById = React.useCallback(async (id: string) => {
    setDetailLoading(true)
    const token = await getToken()
    if (!token) { setDetailLoading(false); return }
    try {
      const res = await fetchProductById(token, id)
      if (res.success && res.product) setSelectedProduct(res.product)
    } catch { /* ignore */ }
    finally { setDetailLoading(false) }
  }, [])

  React.useEffect(() => {
    if (productIdFromUrl) {
      loadProductById(productIdFromUrl)
    } else {
      setSelectedProduct(null)
    }
  }, [productIdFromUrl, loadProductById])

  const viewDetail = (product: ProductModeration) => {
    setSelectedProduct(product)
    router.push(`/admin/dashboard/products?id=${product.id}`, { scroll: false })
    loadProductById(product.id)
  }

  const goBack = () => {
    setSelectedProduct(null)
    router.push("/admin/dashboard/products", { scroll: false })
  }

  const handleListAction = async (reason: string) => {
    if (!dialogState.product || !dialogState.type) return
    let ok = false
    if (dialogState.type === "hide") ok = await hideProduct(dialogState.product.id, reason)
    else if (dialogState.type === "unhide") ok = await unhideProduct(dialogState.product.id)
    else if (dialogState.type === "remove") ok = await removeProduct(dialogState.product.id, reason)
    if (ok) setDialogState({ type: null, product: null })
  }

  const sortAccessor = React.useCallback((row: ProductModeration, key: string): string | number => {
    switch (key) {
      case "name": return row.name ?? ""
      case "shopName": return row.shopName ?? ""
      case "basePrice": return row.basePrice
      case "status": return row.status
      case "createdAt": return row.createdAt ?? ""
      default: return ""
    }
  }, [])

  const { filtered: sorted } = useTableData<ProductModeration>({
    data: products,
    sort,
    sortAccessor,
  })

  const handleSort = (key: string) => setSort(getNextSort(sort, key))

  const filters: FilterConfig[] = React.useMemo(() => [
    {
      key: "status",
      label: "Trạng thái",
      value: params.status === null ? "all" : String(params.status),
      onChange: (v: string) => setStatus(v === "all" ? null : Number(v)),
      width: "w-[160px]",
      options: [
        { value: "all", label: "Tất cả trạng thái" },
        { value: String(ProductStatus.Active), label: "Đang bán" },
        { value: String(ProductStatus.Draft), label: "Nháp" },
        { value: String(ProductStatus.Hidden), label: "Đã ẩn" },
        { value: String(ProductStatus.OutOfStock), label: "Hết hàng" },
        { value: String(ProductStatus.Removed), label: "Đã gỡ" },
      ],
    },
  ], [params.status, setStatus])

  if (selectedProduct) {
    return (
      <ProductDetailView
        product={selectedProduct}
        detailLoading={detailLoading}
        actionLoading={actionLoading}
        onBack={goBack}
        onHide={hideProduct}
        onUnhide={unhideProduct}
        onRemove={removeProduct}
        onProductUpdated={setSelectedProduct}
      />
    )
  }

  return (
    <>
      <SetHeaderActions>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
          <IconRefresh className="mr-1.5 size-4" />Làm mới
        </Button>
      </SetHeaderActions>

      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4">
          <FilterBar
            searchPlaceholder="Tìm kiếm sản phẩm..."
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearch={reload}
            filters={filters}
          />

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead className="w-[60px]">Ảnh</TableHead>
                  <SortableTableHead sortKey="name" currentSort={sort} onSort={handleSort}>Tên sản phẩm</SortableTableHead>
                  <SortableTableHead sortKey="shopName" currentSort={sort} onSort={handleSort}>Cửa hàng</SortableTableHead>
                  <SortableTableHead sortKey="basePrice" currentSort={sort} onSort={handleSort}>Giá</SortableTableHead>
                  <SortableTableHead sortKey="status" currentSort={sort} onSort={handleSort}>Trạng thái</SortableTableHead>
                  <SortableTableHead sortKey="createdAt" currentSort={sort} onSort={handleSort}>Ngày tạo</SortableTableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Không tìm thấy sản phẩm nào.</TableCell>
                  </TableRow>
                ) : sorted.map((product, idx) => (
                  <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewDetail(product)}>
                    <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(params.page - 1) * 10 + idx + 1}</TableCell>
                    <TableCell>
                      {product.imageUrls[0] ? (
                        <Image src={product.imageUrls[0]} alt={product.name} width={40} height={40} className="size-10 rounded border object-cover" />
                      ) : (
                        <div className="bg-muted flex size-10 items-center justify-center rounded border text-xs text-muted-foreground">N/A</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium max-w-[250px]">{product.name}</span>
                        {product.categoryName && <p className="text-muted-foreground text-xs mt-0.5">{product.categoryName}</p>}
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm">{product.shopName}</span></TableCell>
                    <TableCell className="font-medium tabular-nums">{currency(product.basePrice)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={ProductStatusColors[product.status] ?? ""}>{ProductStatusLabels[product.status] ?? product.statusName}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">{formatDate(product.createdAt)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => viewDetail(product)}>
                          <IconEye className="size-4" />
                        </Button>
                        {product.status === ProductStatus.Hidden ? (
                          <Button variant="ghost" size="icon" className="size-8 text-green-600 hover:text-green-700" onClick={() => setDialogState({ type: "unhide", product })} disabled={actionLoading} title="Hiển thị lại">
                            <IconEye className="size-4" />
                          </Button>
                        ) : product.status !== ProductStatus.Removed ? (
                          <Button variant="ghost" size="icon" className="size-8 text-yellow-600 hover:text-yellow-700" onClick={() => setDialogState({ type: "hide", product })} disabled={actionLoading} title="Ẩn sản phẩm">
                            <IconEyeOff className="size-4" />
                          </Button>
                        ) : null}
                        {product.status !== ProductStatus.Removed && product.status !== ProductStatus.Draft && (
                          <Button variant="ghost" size="icon" className="size-8 text-red-600 hover:text-red-700" onClick={() => setDialogState({ type: "remove", product })} disabled={actionLoading} title="Gỡ sản phẩm">
                            <IconTrash className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!loading && (
            <TablePagination
              currentPage={params.page}
              totalPages={totalPages}
              totalItems={totalCount}
              onPageChange={setPage}
              itemLabel="sản phẩm"
            />
          )}
        </div>
      </div>

      <ActionDialog
        open={dialogState.type === "hide"}
        onOpenChange={(v) => !v && setDialogState({ type: null, product: null })}
        title="Ẩn sản phẩm"
        description={`Bạn có chắc muốn ẩn "${dialogState.product?.name ?? ""}"? Sản phẩm sẽ không còn hiển thị cho người mua.`}
        loading={actionLoading}
        onConfirm={handleListAction}
        requireReason
      />
      <ActionDialog
        open={dialogState.type === "unhide"}
        onOpenChange={(v) => !v && setDialogState({ type: null, product: null })}
        title="Hiển thị lại sản phẩm"
        description={`Bạn có chắc muốn hiển thị lại "${dialogState.product?.name ?? ""}"?`}
        loading={actionLoading}
        onConfirm={handleListAction}
        requireReason={false}
      />
      <ActionDialog
        open={dialogState.type === "remove"}
        onOpenChange={(v) => !v && setDialogState({ type: null, product: null })}
        title="Gỡ sản phẩm vĩnh viễn"
        description={`Thao tác này sẽ gỡ "${dialogState.product?.name ?? ""}" (shop: ${dialogState.product?.shopName ?? ""}) khỏi nền tảng. Hành động này không thể hoàn tác.`}
        loading={actionLoading}
        onConfirm={handleListAction}
        requireReason
      />
    </>
  )
}
