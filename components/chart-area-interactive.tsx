"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatMonthYearVN } from "@/lib/formatters"
import type { DashboardStats } from "@/types/dashboard"

export const description = "An interactive area chart"

const chartConfig = {
  revenue: {
    label: "Phí sàn (doanh thu sàn)",
  },
  desktop: {
    label: "Phí sàn (₫)",
    color: "var(--primary)",
  },
  mobile: {
    label: "Đơn hàng",
    color: "var(--primary)",
  },
} satisfies ChartConfig

type Props = {
  stats?: DashboardStats
}

export function ChartAreaInteractive({ stats }: Props) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const chartData = React.useMemo(() => {
    if (!stats) return []

    const now = new Date()
    const months: { date: string; desktop: number; mobile: number }[] = []

    // Ước lượng 6 tháng từ tổng phí sàn và đơn hàng
    const totalRev = stats.revenue.totalRevenue
    const thisMonthRev = stats.revenue.thisMonthRevenue
    const lastMonthRev = stats.revenue.lastMonthRevenue
    const totalOrders = stats.orders.total
    const thisMonthOrders = stats.orders.thisMonthOrders

    // Ước tính phí các tháng trước dựa trên dữ liệu hiện có
    const remainingRev = Math.max(0, totalRev - thisMonthRev - lastMonthRev)
    const remainingOrders = Math.max(0, totalOrders - thisMonthOrders)

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = formatMonthYearVN(d)

      let rev = 0
      let ord = 0

      if (i === 0) {
        rev = thisMonthRev
        ord = thisMonthOrders
      } else if (i === 1) {
        rev = lastMonthRev
        ord = Math.round(remainingOrders * 0.3)
      } else {
        // Phân bổ đều cho các tháng còn lại
        rev = Math.round(remainingRev / 4)
        ord = Math.round(remainingOrders * 0.7 / 4)
      }

      months.push({ date: label, desktop: rev, mobile: ord })
    }

    return months
  }, [stats])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Doanh thu sàn (phí) — tổng quan</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Phí sàn và đơn hàng 6 tháng gần nhất (ước lượng từ dữ liệu hiện có)
          </span>
          <span className="@[540px]/card:hidden">6 tháng gần nhất</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">3 tháng</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 ngày</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 ngày</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="3 tháng" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                3 tháng
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 ngày
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                7 ngày
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                return String(value)
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => String(value)}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
