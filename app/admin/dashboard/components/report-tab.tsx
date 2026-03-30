"use client"

import * as React from "react"
import { IconSparkles, IconAlertCircle, IconBulb } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { generateReport } from "@/services/ai-admin"
import type { GenerateReportResponse } from "@/services/ai-admin"

import { AiText, BulletList, fmtDateTime, daysAgo, today } from "./ai-shared"

const reportTypeLabels: Record<string, string> = {
  sales: "Doanh thu",
  sellers: "Người bán",
  products: "Sản phẩm",
  customers: "Khách hàng",
  disputes: "Tranh chấp",
}

export function ReportTab() {
  const [form, setForm] = React.useState({
    reportType: "sales" as "sales" | "sellers" | "products" | "customers" | "disputes",
    fromDate: daysAgo(30),
    toDate: today(),
    additionalContext: "",
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
