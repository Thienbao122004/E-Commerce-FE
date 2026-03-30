"use client"

import * as React from "react"
import {
  IconSparkles, IconBulb,
  IconArrowUpRight, IconArrowDownRight,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { analyzeTrends } from "@/services/ai-admin"
import type { AnalyzeTrendsResponse } from "@/services/ai-admin"

import { AiText, BulletList, METRIC_OPTIONS, fmtVND, daysAgo, today } from "./ai-shared"

export function TrendsTab() {
  const [metrics, setMetrics] = React.useState<string[]>(["revenue", "orders"])
  const [fromDate, setFromDate] = React.useState(daysAgo(30))
  const [toDate, setToDate] = React.useState(today())
  const [granularity, setGranularity] = React.useState<"daily" | "weekly" | "monthly">("daily")
  const [data, setData] = React.useState<AnalyzeTrendsResponse | null>(null)
  const [loading, setLoading] = React.useState(false)

  const toggle = (v: string) =>
    setMetrics(m => m.includes(v) ? m.filter(x => x !== v) : [...m, v])

  const run = async () => {
    if (!metrics.length) { toast.error("Chọn ít nhất 1 chỉ số"); return }
    setLoading(true); setData(null)
    try { setData(await analyzeTrends({ metricTypes: metrics, fromDate, toDate, granularity })) }
    catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-4">
              {METRIC_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex cursor-pointer items-center gap-2">
                  <Checkbox checked={metrics.includes(value)} onCheckedChange={() => toggle(value)} />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-4 grid-cols-3">
            <div className="space-y-1.5">
              <Label>Từ ngày</Label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Đến ngày</Label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-1.5">
                <Label>Độ chi tiết</Label>
                <Select value={granularity} onValueChange={v => setGranularity(v as typeof granularity)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Theo ngày</SelectItem>
                    <SelectItem value="weekly">Theo tuần</SelectItem>
                    <SelectItem value="monthly">Theo tháng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col justify-end">
                <Button onClick={run} disabled={loading}>
                  {loading ? "Đang phân tích..." : "Phân tích xu hướng"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && <Skeleton className="h-64 rounded-xl" />}
      {data && (
        <div className="space-y-4">
          {Object.keys(data.growthRates).length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(data.growthRates).map(([k, v]) => {
                const pos = v >= 0
                return (
                  <Card key={k} className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{METRIC_OPTIONS.find(m => m.value === k)?.label ?? k}</p>
                    <div className="flex items-center gap-1.5">
                      {pos ? <IconArrowUpRight className="size-5 text-green-500" /> : <IconArrowDownRight className="size-5 text-red-500" />}
                      <span className={`text-xl font-bold ${pos ? "text-green-600" : "text-red-600"}`}>
                        {pos ? "+" : ""}{v.toFixed(1)}%
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
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
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconBulb className="size-4 text-blue-500" />Nhận xét xu hướng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BulletList items={data.trendInsights} icon={<span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-400 block" />} />
              </CardContent>
            </Card>
          </div>
          {data.dataPoints.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Dữ liệu ({data.dataPoints.length} điểm)</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="py-1.5 pr-4 text-left font-medium text-muted-foreground">Ngày</th>
                      {Object.keys(data.dataPoints[0]?.values ?? {}).map(k => (
                        <th key={k} className="px-2 py-1.5 text-right font-medium text-muted-foreground">
                          {METRIC_OPTIONS.find(m => m.value === k)?.label ?? k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.dataPoints.slice(0, 15).map((pt, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5 pr-4 tabular-nums text-muted-foreground">{new Date(pt.date).toLocaleDateString("vi-VN")}</td>
                        {Object.entries(pt.values).map(([k, v]) => (
                          <td key={k} className="px-2 py-1.5 text-right font-medium tabular-nums">
                            {k === "revenue" ? fmtVND(v) : v.toLocaleString("vi-VN")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.dataPoints.length > 15 && (
                  <p className="mt-2 text-xs text-muted-foreground">...và {data.dataPoints.length - 15} dòng khác</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
