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
  const [timeRange, setTimeRange] = React.useState("7d")

  const chartData = React.useMemo(() => {
    if (!stats) return []

    const dataPoints: { date: string; desktop: number; mobile: number }[] = []

    if (timeRange === "7d") {
      const daily = stats.dailyStats || []
      const sliced = daily.slice(-7)
      sliced.forEach(d => {
        // Date format from backend is yyyy-MM-dd
        const parts = d.dateLabel.split("-")
        const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.dateLabel
        dataPoints.push({
          date: label,
          desktop: d.revenue,
          mobile: d.orders
        })
      })
    } else if (timeRange === "30d") {
      const daily = stats.dailyStats || []
      daily.forEach(d => {
        const parts = d.dateLabel.split("-")
        const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.dateLabel
        dataPoints.push({
          date: label,
          desktop: d.revenue,
          mobile: d.orders
        })
      })
    } else {
      // 180d (6 months)
      const monthly = stats.monthlyStats || []
      monthly.forEach(m => {
        // Date format from backend is yyyy-MM
        const parts = m.dateLabel.split("-")
        const label = parts.length === 2 ? `Thg ${parts[1]}` : m.dateLabel
        dataPoints.push({
          date: label,
          desktop: m.revenue,
          mobile: m.orders
        })
      })
    }

    return dataPoints
  }, [stats, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Doanh thu sàn (phí) — tổng quan</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Phí sàn và đơn hàng theo thời gian (ước lượng từ dữ liệu hiện có)
          </span>
          <span className="@[540px]/card:hidden">Theo thời gian</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(val) => val && setTimeRange(val)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="7d">7 ngày</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 ngày</ToggleGroupItem>
            <ToggleGroupItem value="180d">6 tháng</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="7 ngày" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">
                7 ngày
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 ngày
              </SelectItem>
              <SelectItem value="180d" className="rounded-lg">
                6 tháng
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
