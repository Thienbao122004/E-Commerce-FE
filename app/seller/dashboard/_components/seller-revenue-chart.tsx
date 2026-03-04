"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { SellerProduct, SellerWallet } from "@/types/seller-dashboard"

type Props = {
  wallet: SellerWallet | null
  products: SellerProduct[]
  loading: boolean
}

const revenueChartConfig = {
  revenue: {
    label: "Doanh thu",
    color: "var(--primary)",
  },
} satisfies ChartConfig

const PIE_COLORS = [
  "var(--primary)",
  "hsl(142 71% 45%)",
  "hsl(48 96% 53%)",
  "hsl(280 67% 55%)",
  "hsl(200 80% 50%)",
  "hsl(340 75% 55%)",
]

export function SellerRevenueChart({ wallet, products, loading }: Props) {
  // Build revenue chart data from wallet
  const revenueData = React.useMemo(() => {
    if (!wallet) return []
    const total = wallet.totalEarnings
    const available = wallet.availableBalance
    const pending = wallet.pendingBalance
    const withdrawn = wallet.totalWithdrawn

    return [
      { name: "Tổng thu nhập", revenue: total },
      { name: "Khả dụng", revenue: available },
      { name: "Đang chờ", revenue: pending },
      { name: "Đã rút", revenue: withdrawn },
    ]
  }, [wallet])

  // Build category donut from products
  const categoryData = React.useMemo(() => {
    const map = new Map<string, number>()
    products.forEach((p) => {
      const cat = p.categoryName || "Chưa phân loại"
      map.set(cat, (map.get(cat) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [products])

  const totalProducts = products.length

  const currency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="bg-muted h-5 w-40 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="bg-muted h-[250px] w-full animate-pulse rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="bg-muted h-5 w-40 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="bg-muted mx-auto size-[200px] animate-pulse rounded-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
      {/* Revenue Area Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Biến động doanh thu</CardTitle>
          <CardDescription>Tổng quan tài chính của cửa hàng</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {revenueData.length > 0 ? (
            <ChartContainer
              config={revenueChartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(v) => String(v)}
                      indicator="dot"
                      formatter={(value) => currency(Number(value))}
                    />
                  }
                />
                <Area
                  dataKey="revenue"
                  type="natural"
                  fill="url(#fillRevenue)"
                  stroke="var(--color-revenue)"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground">
              Chưa có dữ liệu doanh thu
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tỷ trọng danh mục</CardTitle>
          <CardDescription>Phân bố sản phẩm theo danh mục</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {categoryData.length > 0 ? (
            <>
              <div className="relative">
                <PieChart width={200} height={200}>
                  <Pie
                    data={categoryData}
                    cx={100}
                    cy={100}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{totalProducts}</span>
                  <span className="text-xs text-muted-foreground">Sản phẩm</span>
                </div>
              </div>
              <div className="w-full space-y-2">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="truncate max-w-[120px]">{cat.name}</span>
                    </div>
                    <span className="font-medium text-muted-foreground">
                      {totalProducts > 0
                        ? `${Math.round((cat.value / totalProducts) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              Chưa có sản phẩm
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
