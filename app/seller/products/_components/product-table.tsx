"use client"

import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IconEdit, IconPackage, IconPlus, IconTrash } from "@tabler/icons-react"
import { ProductStatus } from "@/types/seller-dashboard"
import type { SellerProduct } from "@/types/seller-dashboard"
import { SortableTableHead } from "@/components/common/table-sorting"
import type { SortConfig } from "@/components/common/table-sorting"
import TablePagination from "@/components/common/table-pagination"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

const formatDate = (ts: string) =>
  new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })

const statusLabels: Record<number, string> = {
  [ProductStatus.Draft]: "Nháp",
  [ProductStatus.Active]: "Đang bán",
  [ProductStatus.Hidden]: "Đã ẩn",
  [ProductStatus.Deleted]: "Đã xóa",
}

const statusColors: Record<number, string> = {
  [ProductStatus.Draft]: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  [ProductStatus.Active]: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  [ProductStatus.Hidden]: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  [ProductStatus.Deleted]: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
          <TableCell><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
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
  onDeleteClick: (id: string, name: string) => void
  onPageChange: (p: number) => void
  onViewDetail: (id: string) => void
}

export function ProductTable({ products, loading, totalCount, totalPages, page, pageSize, sort, onSort, onDeleteClick, onPageChange, onViewDetail }: Props) {

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-12 text-center">STT</TableHead>
              <TableHead className="w-[60px]">Ảnh</TableHead>
              <SortableTableHead sortKey="name" currentSort={sort} onSort={onSort}>Tên sản phẩm</SortableTableHead>
              <SortableTableHead sortKey="categoryName" currentSort={sort} onSort={onSort}>Danh mục</SortableTableHead>
              <SortableTableHead sortKey="basePrice" currentSort={sort} onSort={onSort}>Giá</SortableTableHead>
              <SortableTableHead sortKey="totalStock" currentSort={sort} onSort={onSort}>Tồn kho</SortableTableHead>
              <SortableTableHead sortKey="status" currentSort={sort} onSort={onSort}>Trạng thái</SortableTableHead>
              <SortableTableHead sortKey="createdAt" currentSort={sort} onSort={onSort}>Ngày tạo</SortableTableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="flex items-center justify-center size-14 rounded-full bg-muted">
                      <IconPackage className="size-7 opacity-50" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Chưa có sản phẩm nào</p>
                      <p className="text-xs mt-0.5">Bắt đầu bằng cách thêm sản phẩm đầu tiên</p>
                    </div>
                    <Button size="sm" asChild>
                      <Link href="/seller/products/new">
                        <IconPlus className="mr-1.5 size-4" />Thêm sản phẩm đầu tiên
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product, idx) => {
                const imgUrl = product.images?.[0]?.imageUrl
                return (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onViewDetail(product.id)}
                  >
                    <TableCell className="text-center text-sm text-muted-foreground tabular-nums">
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell>
                      {imgUrl ? (
                        <Image src={imgUrl} alt={product.name} width={40} height={40} className="size-10 rounded-lg border object-cover" />
                      ) : (
                        <div className="bg-muted flex size-10 items-center justify-center rounded-lg border text-muted-foreground">
                          <IconPackage className="size-4 opacity-40" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{product.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {product.categoryName ? (
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
                          {product.categoryName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {currency(product.basePrice)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      <span className={
                        product.totalStock === 0
                          ? "text-red-500 font-semibold"
                          : (product.totalStock ?? 0) <= 10
                            ? "text-orange-500 font-semibold"
                            : ""
                      }>
                        {product.totalStock ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[product.status] ?? ""}>
                        {statusLabels[product.status] ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">
                      {formatDate(product.createdAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost" size="icon" className="size-8" title="Chỉnh sửa"
                          onClick={() => onViewDetail(product.id)}
                        >
                          <IconEdit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          title="Xóa"
                          onClick={() => onDeleteClick(product.id, product.name)}
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
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
