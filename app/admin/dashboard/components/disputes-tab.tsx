"use client"

import * as React from "react"
import { IconSparkles, IconAlertCircle, IconBulb } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { summarizeDisputes } from "@/services/ai-admin"
import type { SummarizeDisputesResponse } from "@/services/ai-admin"

import { AiText, BulletList, daysAgo, today } from "./ai-shared"

export function DisputesTab() {
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
            <Input type="number" min={10} max={500} value={maxItems}
              onChange={e => setMaxItems(Number(e.target.value))} />
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
