"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconPackage,
  IconRefresh,
  IconExternalLink,
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useProducts } from "@/hooks/use-products"
import { ProductStatus, ProductStatusLabels, ProductStatusColors } from "@/lib/types/product"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v)

const formatDate = (ts: string) =>
  new Date(ts).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

export default function InventoryPage() {
  const {
    products,
    totalCount,
    loading,
    params,
    totalPages,
    setPage,
    reload,
  } = useProducts({ status: ProductStatus.OutOfStock })

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {!loading && (
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 dark:border-orange-800">
              <CardHeader className="flex-row items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/50">
                  <IconAlertTriangle className="size-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">{totalCount} sản phẩm hết hàng</CardTitle>
                  <CardDescription>
                    Các sản phẩm cần được bổ sung hàng hoặc kiểm tra bởi người bán
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Table */}
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead className="w-[60px]">Ảnh</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Cửa hàng</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead className="text-right">Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      Không có sản phẩm hết hàng.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product, idx) => (
                    <TableRow key={product.id}>
                      <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(params.page - 1) * 20 + idx + 1}</TableCell>
                      <TableCell>
                        {product.imageUrls[0] ? (
                          <img
                            src={product.imageUrls[0]}
                            alt={product.name}
                            className="size-10 rounded border object-cover"
                          />
                        ) : (
                          <div className="bg-muted flex size-10 items-center justify-center rounded border text-xs text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="font-medium hover:underline line-clamp-1 max-w-[200px]"
                        >
                          {product.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{product.shopName}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {product.categoryName ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {currency(product.basePrice)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={ProductStatusColors[product.status] ?? ""}
                        >
                          {ProductStatusLabels[product.status] ?? product.statusName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm tabular-nums">
                        {formatDate(product.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                          <Link href={`/dashboard/products/${product.id}`}>
                            <IconExternalLink className="size-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Trang {params.page} / {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setPage(params.page - 1)}
                  disabled={params.page <= 1}
                >
                  <IconChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setPage(params.page + 1)}
                  disabled={params.page >= totalPages}
                >
                  <IconChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
