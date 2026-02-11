"use client"

import * as React from "react"
import {
  IconStar,
  IconTrophy,
  IconRefresh,
  IconMedal,
  IconMedal2,
  IconHash,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
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
import { supabase } from "@/lib/supabase"
import { fetchTopProducts } from "@/lib/api/dashboard"
import type { TopProduct } from "@/lib/types/dashboard"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v)

const fmt = (v: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(v)

export default function FeaturedProductsPage() {
  const [products, setProducts] = React.useState<TopProduct[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      toast.error("Phiên đăng nhập hết hạn.")
      setLoading(false)
      return
    }
    try {
      const res = await fetchTopProducts(token)
      if (res.success) setProducts(res.products)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <IconStar className="size-6 text-yellow-500" />
                  Sản phẩm nổi bật
                </h1>
                <p className="text-muted-foreground text-sm">
                  Top sản phẩm bán chạy nhất trên hệ thống
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <IconRefresh className="mr-1.5 size-4" />
                Làm mới
              </Button>
            </div>

            {/* Top 3 Cards */}
            {!loading && products.length >= 3 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {products.slice(0, 3).map((product, i) => (
                  <Card
                    key={product.id}
                    className={
                      i === 0
                        ? "border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 dark:border-yellow-800"
                        : i === 1
                        ? "border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 dark:border-gray-700"
                        : "border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 dark:border-orange-800"
                    }
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <IconTrophy
                          className={`size-5 ${
                            i === 0
                              ? "text-yellow-500"
                              : i === 1
                              ? "text-gray-400"
                              : "text-orange-500"
                          }`}
                        />
                        <Badge variant="secondary" className="text-xs">
                          #{i + 1}
                        </Badge>
                      </div>
                      <CardTitle className="text-base line-clamp-1">
                        {product.name}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <p className="text-sm">{product.shopName}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm font-medium text-foreground">
                            {fmt(product.totalSold)} đã bán
                          </span>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {currency(product.revenue)}
                          </span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {/* Full table */}
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="w-12 text-center">STT</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead>Cửa hàng</TableHead>
                    <TableHead className="text-right">Đã bán</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        Chưa có dữ liệu sản phẩm nổi bật.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product, i) => (
                      <TableRow key={product.id}>
                        <TableCell className="text-center">
                          {i === 0 ? (
                            <IconMedal className="size-5 text-yellow-500 mx-auto" />
                          ) : i === 1 ? (
                            <IconMedal2 className="size-5 text-gray-400 mx-auto" />
                          ) : i === 2 ? (
                            <IconMedal className="size-5 text-orange-500 mx-auto" />
                          ) : (
                            <span className="text-sm text-muted-foreground font-medium tabular-nums">{i + 1}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-muted-foreground">
                            {product.shopName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {fmt(product.totalSold)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-green-600 dark:text-green-400">
                          {currency(product.revenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
