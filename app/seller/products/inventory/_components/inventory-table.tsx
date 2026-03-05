"use client"

import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IconChevronLeft, IconChevronRight, IconPackage } from "@tabler/icons-react"
import type { SellerProduct } from "@/types/seller-dashboard"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

function StockBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0
  const color = pct === 0 ? "bg-red-500" : pct < 30 ? "bg-orange-500" : pct < 70 ? "bg-yellow-500" : "bg-green-500"
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-16 text-right">{current}/{max}</span>
    </div>
  )
}

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
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
          <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-3 w-28" /></TableCell>
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
  onPageChange: (p: number) => void
}

export function InventoryTable({ products, loading, totalCount, totalPages, page, pageSize, onPageChange }: Props) {
  return (
    <>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-12 text-center">STT</TableHead>
              <TableHead className="w-[60px]">Ảnh</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead className="text-right">Giá</TableHead>
              <TableHead>Số lượng tồn kho</TableHead>
              <TableHead className="text-center">Tồn</TableHead>
              <TableHead>Cảnh báo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
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
                  <TableRow key={product.id} className="hover:bg-muted/50">
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
                    <TableCell className="text-right font-medium tabular-nums">
                      {currency(product.basePrice)}
                    </TableCell>
                    <TableCell>
                      <StockBar current={stock} max={Math.max(stock, 100)} />
                    </TableCell>
                    <TableCell className="text-center tabular-nums font-semibold">
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

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Hiển thị {products.length} trong số {totalCount} sản phẩm
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="size-8" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
              <IconChevronLeft className="size-4" />
            </Button>
            <span className="text-sm tabular-nums">{page} / {totalPages}</span>
            <Button variant="outline" size="icon" className="size-8" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
