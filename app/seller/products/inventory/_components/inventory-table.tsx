"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IconPackage } from "@tabler/icons-react"
import type { SellerProduct } from "@/types/seller-dashboard"
import { SortableTableHead } from "@/components/common/table-sorting"
import type { SortConfig } from "@/components/common/table-sorting"
import TablePagination from "@/components/common/table-pagination"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)


function getStockWarning(stock: number | null): { label: string; cls: string } | null {
  if (stock === null || stock === undefined) return null
  if (stock === 0) return { label: "HẾT HÀNG", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" }
  if (stock <= 10) return { label: "SẮP HẾT", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" }
  if (stock >= 100) return { label: "TỒN KHO CAO", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" }
  return { label: "ỔN ĐỊNH", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" }
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
          <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

type Props = {
  products: SellerProduct[]
  loading: boolean
  totalCount: number
  totalPages: number
  page: number
  pageSize: number
  sort: SortConfig | null
  onSort: (key: string) => void
  onPageChange: (p: number) => void
}

export function InventoryTable({ products, loading, totalCount, totalPages, page, pageSize, sort, onSort, onPageChange }: Props) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-12 text-center">STT</TableHead>
              <TableHead className="w-[60px]">Ảnh</TableHead>
              <SortableTableHead sortKey="name" currentSort={sort} onSort={onSort}>Sản phẩm</SortableTableHead>
              <SortableTableHead sortKey="basePrice" currentSort={sort} onSort={onSort}>Giá</SortableTableHead>
              <SortableTableHead sortKey="totalStock" currentSort={sort} onSort={onSort}>Tồn kho</SortableTableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <IconPackage className="size-10 opacity-30" />
                    <p>Chưa có sản phẩm trong kho</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product, idx) => {
                const imgUrl = product.images?.[0]?.imageUrl
                const stock = product.totalStock ?? 0
                const warning = getStockWarning(stock)
                return (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/seller/products/${product.id}`)}
                  >
                    <TableCell className="text-center text-sm text-muted-foreground tabular-nums">
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell>
                      {imgUrl ? (
                        <Image src={imgUrl} alt={product.name} width={40} height={40} className="size-10 rounded border object-cover" />
                      ) : (
                        <div className="bg-muted flex size-10 items-center justify-center rounded border text-xs text-muted-foreground">N/A</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="font-medium line-clamp-1">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.categoryName ?? "Chưa phân loại"} · {product.currency}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {currency(product.basePrice)}
                    </TableCell>
                    <TableCell className="tabular-nums font-bold text-sm">
                      <span className={stock === 0 ? "text-red-500" : stock <= 10 ? "text-orange-500" : ""}>
                        {stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      {warning && (
                        <Badge variant="secondary" className={`text-[10px] font-semibold ${warning.cls}`}>
                          {warning.label}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && (
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          onPageChange={onPageChange}
          itemLabel="sản phẩm"
        />
      )}
    </div>
  )
}
