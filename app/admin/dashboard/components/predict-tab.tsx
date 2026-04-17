"use client"

import * as React from "react"
import { IconSparkles } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { predictMetrics } from "@/services/ai-admin"
import type { PredictMetricsResponse } from "@/services/ai-admin"

import { AiText, fmtVND } from "./ai-shared"

const metricLabels: Record<string, string> = {
  revenue: "Doanh thu",
  orders: "Đơn hàng",
  users: "Người dùng",
  products: "Sản phẩm",
}

export function PredictTab() {
  const [metric, setMetric] = React.useState<"revenue" | "orders" | "users" | "products">("revenue")
  const [forecastDays, setForecastDays] = React.useState(30)
  const [data, setData] = React.useState<PredictMetricsResponse | null>(null)
  const [loading, setLoading] = React.useState(false)

  const run = async () => {
    setLoading(true); setData(null)
    try { setData(await predictMetrics({ metric, forecastDays })) }
    catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Chỉ số cần dự báo</Label>
            <Select value={metric} onValueChange={v => setMetric(v as typeof metric)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(metricLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Số ngày dự báo (1–90)</Label>
            <Input type="number" min={1} max={90} value={forecastDays}
              onChange={e => setForecastDays(Number(e.target.value))} />
          </div>
          <div className="flex items-end">
            <Button onClick={run} disabled={loading} className="gap-1.5">
              {loading ? "Đang dự báo..." : "Dự báo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <Skeleton className="h-64 rounded-xl" />}
      {data && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Chỉ số", value: metricLabels[data.metric] ?? data.metric },
              {
                label: "Độ tin cậy AI",
                value: `${(data.confidenceLevel * 100).toFixed(0)}%`,
                cls: data.confidenceLevel >= 0.7 ? "text-green-600" : "text-yellow-600",
              },
              { label: "Số điểm dự báo", value: `${data.predictions.length} ngày` },
            ].map(item => (
              <div key={item.label} className="rounded-lg border px-4 py-2">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`font-semibold ${item.cls ?? ""}`}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconSparkles className="size-4 text-purple-500" />Phân tích AI
                </CardTitle>
              </CardHeader>
              <CardContent><AiText text={data.aiAnalysis} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Dự báo {data.predictions.length} ngày tới</CardTitle>
                <CardDescription className="text-xs">Khoảng tin cậy thể hiện biên độ dao động</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="py-1.5 pr-3 text-left font-medium text-muted-foreground">Ngày</th>
                      <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Dự báo</th>
                      <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Thấp</th>
                      <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Cao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.predictions.slice(0, 10).map((pt, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5 pr-3 tabular-nums text-muted-foreground">{new Date(pt.date).toLocaleDateString("vi-VN")}</td>
                        <td className="px-2 py-1.5 text-right font-semibold tabular-nums">
                          {metric === "revenue" ? fmtVND(pt.predictedValue) : Math.round(pt.predictedValue).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                          {metric === "revenue" ? fmtVND(pt.lowerBound) : Math.round(pt.lowerBound).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                          {metric === "revenue" ? fmtVND(pt.upperBound) : Math.round(pt.upperBound).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.predictions.length > 10 && (
                  <p className="mt-2 text-xs text-muted-foreground">...và {data.predictions.length - 10} ngày tiếp theo</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
