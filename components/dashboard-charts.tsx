"use client"

import * as React from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatPriceVND as currency } from "@/lib/formatters"
import type { DashboardStats } from "@/types/dashboard"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend
)

type Props = {
  stats?: DashboardStats
}

export function DashboardCharts({ stats }: Props) {
  const delayedRef = React.useRef(false)

  // Reset animation khi stats thay đổi
  React.useEffect(() => {
    delayedRef.current = false
  }, [stats])

  if (!stats) return null

  const pf = stats.platformFees

  // ── Chart 1: Doanh thu (+ phí sàn nếu có) ──
  const revenueChartData: ChartData<"line"> = {
    labels: ["Tháng trước", "Tháng này", "Hôm nay"],
    datasets: [
      {
        label: "Doanh thu (₫)",
        data: [
          stats.revenue.lastMonthRevenue,
          stats.revenue.thisMonthRevenue,
          stats.revenue.todayRevenue,
        ],
        borderColor: "#2a7f8a",
        backgroundColor: "rgba(42,127,138,0.08)",
        pointBackgroundColor: "#2a7f8a",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        borderWidth: 3,
        fill: true,
      },
      ...(pf
        ? [
            {
              label: "Phí sàn (₫)",
              data: [pf.lastMonthFees, pf.thisMonthFees, pf.todayFees],
              borderColor: "#b45309",
              backgroundColor: "rgba(180,83,9,0.06)",
              pointBackgroundColor: "#b45309",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.4,
              borderWidth: 2,
              fill: true,
            },
          ]
        : []),
    ],
  }

  const revenueOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      onComplete: () => {
        delayedRef.current = true
      },
      delay: (context) => {
        let delay = 0
        if (
          context.type === "data" &&
          context.mode === "default" &&
          !delayedRef.current
        ) {
          delay = context.dataIndex * 300 + context.datasetIndex * 100
        }
        return delay
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          color: "#78716c",
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#1b140d",
        bodyColor: "#78716c",
        borderColor: "#e7dbcf",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${currency(ctx.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#78716c", font: { size: 11 } },
      },
      y: {
        grid: { color: "#f0ebe5" },
        ticks: {
          color: "#a8a29e",
          font: { size: 11 },
          callback: (value) => {
            const v = value as number
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
            return v.toString()
          },
        },
      },
    },
  }

  const o = stats.orders
  const ordersChartData: ChartData<"bar"> = {
    labels: [
      "Chờ (TT/XN)",
      "Đang xử lý",
      "Đã xác nhận",
      "Đã giao",
      "Hoàn thành",
      "Đã hủy",
      "Hoàn tiền",
    ],
    datasets: [
      {
        label: "Số đơn hàng",
        data: [
          o.pending,
          o.processing,
          o.confirmed ?? 0,
          o.delivered ?? 0,
          o.completed,
          o.cancelled,
          o.refunded ?? 0,
        ],
        backgroundColor: [
          "#c49052",
          "#5b8db8",
          "#0ea5e9",
          "#14b8a6",
          "#4a9e6f",
          "#b85c5c",
          "#78716c",
        ],
        borderColor: [
          "#c49052",
          "#5b8db8",
          "#0ea5e9",
          "#14b8a6",
          "#4a9e6f",
          "#b85c5c",
          "#78716c",
        ],
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  const ordersOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      onComplete: () => {
        delayedRef.current = true
      },
      delay: (context) => {
        let delay = 0
        if (
          context.type === "data" &&
          context.mode === "default" &&
          !delayedRef.current
        ) {
          delay = context.dataIndex * 300 + context.datasetIndex * 100
        }
        return delay
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#1b140d",
        bodyColor: "#78716c",
        borderColor: "#e7dbcf",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.raw} đơn`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#78716c", font: { size: 12 } },
      },
      y: {
        grid: { color: "#f0ebe5" },
        ticks: {
          color: "#a8a29e",
          font: { size: 11 },
          stepSize: 1,
        },
      },
    },
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 lg:px-6">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Doanh thu</CardTitle>
          <CardDescription>
            Doanh thu đơn hoàn thành; phí sàn từ đơn đã quyết toán ví (nếu có dữ liệu)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <Line data={revenueChartData} options={revenueOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Phân bổ đơn hàng</CardTitle>
          <CardDescription>
            Số lượng đơn hàng theo từng trạng thái
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <Bar data={ordersChartData} options={ordersOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
