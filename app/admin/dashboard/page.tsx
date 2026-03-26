"use client"

import * as React from "react"
import {
  IconBrain, IconChartBar, IconChartLine, IconAlertTriangle,
  IconTrendingUp, IconGavel, IconRefresh, IconSparkles,
  IconArrowUpRight, IconArrowDownRight, IconAlertCircle,
  IconChecks, IconBulb, IconArrowRight, IconLayoutDashboard,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardCharts } from "@/components/dashboard-charts"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { useDashboard } from "@/hooks/use-dashboard"

import {
  getDashboardInsights, generateReport, analyzeTrends,
  detectAnomalies, predictMetrics, summarizeDisputes,
} from "@/services/ai-admin"
import type {
  DashboardInsightsResponse, GenerateReportResponse, AnalyzeTrendsResponse,
  DetectAnomaliesResponse, PredictMetricsResponse, SummarizeDisputesResponse,
} from "@/services/ai-admin"

// ── Helpers ───────────────────────────────────────────────────────────────
const fmtVND = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

const fmtDateTime = (s: string) =>
  new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

function today() { return new Date().toISOString().slice(0, 10) }
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10)
}

// ── Shared AI sub-components ──────────────────────────────────────────────
function AiText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <p className={`text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed ${className}`}>{text}</p>
  )
}

function BulletList({ items, icon, color = "text-muted-foreground" }: { items: string[]; icon: React.ReactNode; color?: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground italic">Không có dữ liệu</p>
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className={`mt-0.5 shrink-0 ${color}`}>{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

const severityColor: Record<string, string> = {
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}

const METRIC_OPTIONS = [
  { value: "revenue", label: "Doanh thu" },
  { value: "orders", label: "Đơn hàng" },
  { value: "sellers", label: "Người bán" },
  { value: "products", label: "Sản phẩm" },
  { value: "customers", label: "Khách hàng" },
]

// ── Tab: Tổng quan ────────────────────────────────────────────────────────
function OverviewTab() {
  const {
    stats, activities, shops, products,
    statsLoading, activitiesLoading, shopsLoading, productsLoading,
  } = useDashboard()

  return (
    <div className="flex flex-col gap-6">
      <ChartAreaInteractive stats={stats ?? undefined} />
      <DashboardCharts stats={stats ?? undefined} />
      <DataTable
        products={products} shops={shops} activities={activities} stats={stats}
        productsLoading={productsLoading} shopsLoading={shopsLoading}
        activitiesLoading={activitiesLoading} statsLoading={statsLoading}
      />
    </div>
  )
}

// ── Tab: AI Insights ──────────────────────────────────────────────────────
function InsightsTab() {
  const [data, setData] = React.useState<DashboardInsightsResponse | null>(null)
  const [loading, setLoading] = React.useState(false)

  const run = React.useCallback(async () => {
    setLoading(true)
    try { setData(await getDashboardInsights()) }
    catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi tải AI insights") }
    finally { setLoading(false) }
  }, [])

  React.useEffect(() => { run() }, [run])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data ? <>Cập nhật lúc <strong>{fmtDateTime(data.generatedAt)}</strong></> : "Đang phân tích hệ thống..."}
        </p>
        <Button variant="outline" size="sm" onClick={run} disabled={loading}>
          <IconRefresh className={`mr-1.5 size-4 ${loading ? "animate-spin" : ""}`} />Làm mới
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-red-200 dark:border-red-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                  <IconAlertCircle className="size-4" />Cảnh báo cần xử lý
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BulletList items={data.keyAlerts} icon={<IconAlertCircle className="size-3.5" />} color="text-red-500" />
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                  <IconTrendingUp className="size-4" />Điểm tích cực
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BulletList items={data.positiveHighlights} icon={<IconChecks className="size-3.5" />} color="text-green-500" />
              </CardContent>
            </Card>
            <Card className="border-blue-200 dark:border-blue-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                  <IconBulb className="size-4" />Đề xuất hành động
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BulletList items={data.actionItems} icon={<IconArrowRight className="size-3.5" />} color="text-blue-500" />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Nhấn "Làm mới" để tải AI insights
        </div>
      )}
    </div>
  )
}

// ── Tab: Báo cáo AI ───────────────────────────────────────────────────────
const reportTypeLabels: Record<string, string> = {
  sales: "Doanh thu", sellers: "Người bán", products: "Sản phẩm",
  customers: "Khách hàng", disputes: "Tranh chấp",
}

function ReportTab() {
  const [form, setForm] = React.useState({
    reportType: "sales" as "sales" | "sellers" | "products" | "customers" | "disputes",
    fromDate: daysAgo(30), toDate: today(), additionalContext: "",
  })
  const [data, setData] = React.useState<GenerateReportResponse | null>(null)
  const [loading, setLoading] = React.useState(false)

  const run = async () => {
    setLoading(true); setData(null)
    try { setData(await generateReport(form)) }
    catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label>Loại báo cáo</Label>
            <Select value={form.reportType} onValueChange={v => setForm(f => ({ ...f, reportType: v as typeof f.reportType }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(reportTypeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Từ ngày</Label>
            <Input type="date" value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Đến ngày</Label>
            <Input type="date" value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Ghi chú (tuỳ chọn)</Label>
            <Input placeholder="Ví dụ: tập trung sản phẩm hot..." value={form.additionalContext}
              onChange={e => setForm(f => ({ ...f, additionalContext: e.target.value }))} />
          </div>
          <div className="flex flex-col justify-end">
            <Button onClick={run} disabled={loading}>
              {loading ? "Đang tạo báo cáo..." : "Tạo báo cáo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <Skeleton className="h-64 rounded-xl" />}
      {data && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Báo cáo <strong>{reportTypeLabels[data.reportType]}</strong> &nbsp;·&nbsp;
            {new Date(data.fromDate).toLocaleDateString("vi-VN")} — {new Date(data.toDate).toLocaleDateString("vi-VN")} &nbsp;·&nbsp;
            Tạo lúc {fmtDateTime(data.generatedAt)}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconSparkles className="size-4 text-purple-500" />Phân tích AI
                </CardTitle>
              </CardHeader>
              <CardContent><AiText text={data.aiInsights} /></CardContent>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IconAlertCircle className="size-4 text-orange-500" />Phát hiện chính
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={data.keyFindings} icon={<span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-400 block" />} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IconBulb className="size-4 text-blue-500" />Đề xuất
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={data.recommendations} icon={<span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-400 block" />} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Xu hướng ─────────────────────────────────────────────────────────
function TrendsTab() {
  const [metrics, setMetrics] = React.useState<string[]>(["revenue", "orders"])
  const [fromDate, setFromDate] = React.useState(daysAgo(30))
  const [toDate, setToDate] = React.useState(today())
  const [granularity, setGranularity] = React.useState<"daily" | "weekly" | "monthly">("daily")
  const [data, setData] = React.useState<AnalyzeTrendsResponse | null>(null)
  const [loading, setLoading] = React.useState(false)

  const toggle = (v: string) => setMetrics(m => m.includes(v) ? m.filter(x => x !== v) : [...m, v])

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
            <Label>Chỉ số</Label>
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

// ── Tab: Bất thường ───────────────────────────────────────────────────────
function AnomaliesTab() {
  const [dataType, setDataType] = React.useState<"orders" | "revenue" | "users">("orders")
  const [lookbackDays, setLookbackDays] = React.useState(30)
  const [data, setData] = React.useState<DetectAnomaliesResponse | null>(null)
  const [loading, setLoading] = React.useState(false)

  const run = async () => {
    setLoading(true); setData(null)
    try { setData(await detectAnomalies({ dataType, lookbackDays })) }
    catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }

  const dtLabels: Record<string, string> = { orders: "Đơn hàng", revenue: "Doanh thu", users: "Người dùng" }
  const typeLabels: Record<string, string> = { spike: "↑ Tăng đột biến", drop: "↓ Giảm đột ngột", pattern_break: "⚡ Phá vỡ xu hướng" }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Loại dữ liệu</Label>
            <Select value={dataType} onValueChange={v => setDataType(v as typeof dataType)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(dtLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Số ngày nhìn lại</Label>
            <Input type="number" min={7} max={90} value={lookbackDays} onChange={e => setLookbackDays(Number(e.target.value))} />
          </div>
          <div className="flex items-end">
            <Button onClick={run} disabled={loading} className="gap-1.5">
              {loading ? "Đang phát hiện..." : "Phát hiện bất thường"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <Skeleton className="h-64 rounded-xl" />}
      {data && (
        <div className="space-y-4">
          {data.anomalies.length === 0 ? (
            <Card className="border-green-200 dark:border-green-900/50">
              <CardContent className="flex items-center gap-2 pt-5 text-green-600">
                <IconChecks className="size-5" />
                <span className="text-sm font-medium">Không phát hiện bất thường trong {lookbackDays} ngày qua</span>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {data.anomalies.map((a, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <IconAlertTriangle className="mt-0.5 size-5 shrink-0 text-orange-500" />
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className={severityColor[a.severity] ?? ""}>{a.severity.toUpperCase()}</Badge>
                        <span className="text-xs text-muted-foreground">{typeLabels[a.type] ?? a.type}</span>
                        <span className="text-xs text-muted-foreground">{fmtDateTime(a.detectedAt)}</span>
                      </div>
                      <p className="text-sm font-medium">{a.description}</p>
                      <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Kỳ vọng: <strong>{a.expectedValue.toLocaleString("vi-VN")}</strong></span>
                        <span>Thực tế: <strong>{a.actualValue.toLocaleString("vi-VN")}</strong></span>
                        <span className={a.deviationPercent > 0 ? "text-red-500" : "text-green-500"}>
                          Lệch: <strong>{a.deviationPercent > 0 ? "+" : ""}{a.deviationPercent.toFixed(1)}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <IconSparkles className="size-4 text-purple-500" />Giải thích AI
              </CardTitle>
            </CardHeader>
            <CardContent><AiText text={data.aiExplanation} /></CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ── Tab: Dự báo ───────────────────────────────────────────────────────────
function PredictTab() {
  const [metric, setMetric] = React.useState<"revenue" | "orders" | "users">("revenue")
  const [forecastDays, setForecastDays] = React.useState(30)
  const [data, setData] = React.useState<PredictMetricsResponse | null>(null)
  const [loading, setLoading] = React.useState(false)

  const run = async () => {
    setLoading(true); setData(null)
    try { setData(await predictMetrics({ metric, forecastDays })) }
    catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }

  const metricLabels: Record<string, string> = { revenue: "Doanh thu", orders: "Đơn hàng", users: "Người dùng" }

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
            <Input type="number" min={1} max={90} value={forecastDays} onChange={e => setForecastDays(Number(e.target.value))} />
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
              { label: "Độ tin cậy AI", value: `${(data.confidenceLevel * 100).toFixed(0)}%`, cls: data.confidenceLevel >= 0.7 ? "text-green-600" : "text-yellow-600" },
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
                          {metric === "revenue" ? fmtVND(pt.predictedValue) : pt.predictedValue.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                          {metric === "revenue" ? fmtVND(pt.lowerBound) : pt.lowerBound.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                          {metric === "revenue" ? fmtVND(pt.upperBound) : pt.upperBound.toLocaleString("vi-VN")}
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

// ── Tab: Tranh chấp AI ───────────────────────────────────────────────────
function DisputesTab() {
  const [fromDate, setFromDate] = React.useState(daysAgo(30))
  const [toDate, setToDate] = React.useState(today())
  const [maxItems, setMaxItems] = React.useState(100)
  const [data, setData] = React.useState<SummarizeDisputesResponse | null>(null)
  const [loading, setLoading] = React.useState(false)

  const run = async () => {
    setLoading(true); setData(null)
    try { setData(await summarizeDisputes({ fromDate, toDate, maxItems })) }
    catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Từ ngày</Label>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Đến ngày</Label>
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tối đa</Label>
            <Input type="number" min={10} max={500} value={maxItems} onChange={e => setMaxItems(Number(e.target.value))} />
          </div>
          <div className="flex flex-col justify-end">
            <Button onClick={run} disabled={loading} className="gap-1.5 w-full">
              {loading ? "Đang phân tích..." : "Tóm tắt tranh chấp"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <Skeleton className="h-64 rounded-xl" />}
      {data && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Tổng tranh chấp</p>
              <p className="text-2xl font-bold">{data.totalDisputes.toLocaleString("vi-VN")}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Theo loại</p>
              <div className="space-y-1">
                {Object.entries(data.byType).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Theo trạng thái</p>
              <div className="space-y-1">
                {Object.entries(data.byStatus).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconSparkles className="size-4 text-purple-500" />Tóm tắt AI
                </CardTitle>
              </CardHeader>
              <CardContent><AiText text={data.aiSummary} /></CardContent>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IconAlertCircle className="size-4 text-orange-500" />Vấn đề phổ biến
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={data.commonIssues} icon={<span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-400 block" />} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IconBulb className="size-4 text-blue-500" />Đề xuất cải thiện
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={data.recommendations} icon={<span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-400 block" />} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { stats, statsLoading } = useDashboard()

  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="flex flex-col gap-6 py-4 md:py-6">
        <SectionCards stats={stats ?? undefined} loading={statsLoading} />
        <div className="px-4 lg:px-6">
          <Tabs defaultValue="overview">
            <TabsList className="h-auto w-full gap-1 bg-muted/60">
              <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-background">
                <IconLayoutDashboard className="size-3.5" />Tổng quan
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-1.5 data-[state=active]:bg-background">
                <IconSparkles className="size-3.5 text-purple-500" />AI Insights
              </TabsTrigger>
              <TabsTrigger value="report" className="gap-1.5 data-[state=active]:bg-background">
                <IconChartBar className="size-3.5" />Báo cáo
              </TabsTrigger>
              <TabsTrigger value="trends" className="gap-1.5 data-[state=active]:bg-background">
                <IconChartLine className="size-3.5" />Xu hướng
              </TabsTrigger>
              <TabsTrigger value="anomalies" className="gap-1.5 data-[state=active]:bg-background">
                <IconAlertTriangle className="size-3.5" />Bất thường
              </TabsTrigger>
              <TabsTrigger value="predict" className="gap-1.5 data-[state=active]:bg-background">
                <IconTrendingUp className="size-3.5" />Dự báo
              </TabsTrigger>
              <TabsTrigger value="disputes" className="gap-1.5 data-[state=active]:bg-background">
                <IconGavel className="size-3.5" />Tranh chấp AI
              </TabsTrigger>
            </TabsList>

            <Separator className="my-4" />

            <TabsContent value="overview"><OverviewTab /></TabsContent>
            <TabsContent value="insights"><InsightsTab /></TabsContent>
            <TabsContent value="report"><ReportTab /></TabsContent>
            <TabsContent value="trends"><TrendsTab /></TabsContent>
            <TabsContent value="anomalies"><AnomaliesTab /></TabsContent>
            <TabsContent value="predict"><PredictTab /></TabsContent>
            <TabsContent value="disputes"><DisputesTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
