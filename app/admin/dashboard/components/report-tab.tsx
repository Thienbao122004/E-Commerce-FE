"use client"

import * as React from "react"
import { IconSparkles, IconAlertCircle, IconBulb, IconDownload } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { generateReport } from "@/services/ai-admin"
import type { GenerateReportResponse } from "@/services/ai-admin"
import {
  downloadAdminReportCsv,
  downloadAdminReportExcel,
  downloadAdminReportJson,
  downloadAdminReportMarkdown,
  downloadAdminReportPdf,
} from "@/lib/export-admin-report"

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
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Báo cáo <strong>{reportTypeLabels[data.reportType]}</strong> &nbsp;·&nbsp;
              {new Date(data.fromDate).toLocaleDateString("vi-VN")} — {new Date(data.toDate).toLocaleDateString("vi-VN")} &nbsp;·&nbsp;
              Tạo lúc {fmtDateTime(data.generatedAt)}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5">
                  <IconDownload className="size-4" />
                  Xuất báo cáo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem
                  onClick={() => {
                    try {
                      downloadAdminReportMarkdown(data, {
                        reportLabel: reportTypeLabels[data.reportType] ?? data.reportType,
                        additionalContext: form.additionalContext,
                      })
                      toast.success("Đã tải file Markdown")
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Không xuất được file")
                    }
                  }}
                >
                  Tải Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    try {
                      downloadAdminReportJson(data, {
                        reportLabel: reportTypeLabels[data.reportType] ?? data.reportType,
                        additionalContext: form.additionalContext,
                      })
                      toast.success("Đã tải file JSON")
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Không xuất được file")
                    }
                  }}
                >
                  Tải JSON (.json)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    const id = toast.loading("Đang tạo PDF...")
                    try {
                      await downloadAdminReportPdf(data, {
                        reportLabel: reportTypeLabels[data.reportType] ?? data.reportType,
                        additionalContext: form.additionalContext,
                      })
                      toast.success("Đã tải file PDF", { id })
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Không tạo được PDF", { id })
                    }
                  }}
                >
                  Xuất PDF (.pdf)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    const id = toast.loading("Đang tạo Excel...")
                    try {
                      await downloadAdminReportExcel(data, {
                        reportLabel: reportTypeLabels[data.reportType] ?? data.reportType,
                        additionalContext: form.additionalContext,
                      })
                      toast.success("Đã tải file Excel", { id })
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Không xuất được Excel", { id })
                    }
                  }}
                >
                  Xuất Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    try {
                      downloadAdminReportCsv(data, {
                        reportLabel: reportTypeLabels[data.reportType] ?? data.reportType,
                        additionalContext: form.additionalContext,
                      })
                      toast.success("Đã tải file CSV")
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Không xuất được CSV")
                    }
                  }}
                >
                  Tải CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
