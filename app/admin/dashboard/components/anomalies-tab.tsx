"use client"

import * as React from "react"
import { IconSparkles, IconAlertTriangle, IconChecks } from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { detectAnomalies } from "@/services/ai-admin"
import type { DetectAnomaliesResponse } from "@/services/ai-admin"

import { AiText, severityColor, fmtDateTime } from "./ai-shared"

const dtLabels: Record<string, string> = {
  orders: "Đơn hàng",
  revenue: "Doanh thu",
  users: "Người dùng",
  products: "Sản phẩm",
}

const typeLabels: Record<string, string> = {
  spike: "↑ Tăng đột biến",
  drop: "↓ Giảm đột ngột",
  pattern_break: "⚡ Phá vỡ xu hướng",
}

export function AnomaliesTab() {
  const [dataType, setDataType] = React.useState<"orders" | "revenue" | "users" | "products">("orders")
  const [lookbackDays, setLookbackDays] = React.useState(30)
  const [data, setData] = React.useState<DetectAnomaliesResponse | null>(null)
  const [loading, setLoading] = React.useState(false)

  const run = async () => {
    setLoading(true); setData(null)
    try { setData(await detectAnomalies({ dataType, lookbackDays })) }
    catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }

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
            <Input type="number" min={7} max={90} value={lookbackDays}
              onChange={e => setLookbackDays(Number(e.target.value))} />
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
