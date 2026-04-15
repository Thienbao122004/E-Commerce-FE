"use client"

import * as React from "react"
import {
  IconAlertCircle, IconTrendingUp, IconBulb,
  IconRefresh, IconChecks, IconArrowRight,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getDashboardInsights } from "@/services/ai-admin"
import type { DashboardInsightsResponse } from "@/services/ai-admin"

import { AiText, BulletList } from "./ai-shared"

export function InsightsTab() {
  const [data, setData] = React.useState<DashboardInsightsResponse | null>(null)
  const [loading, setLoading] = React.useState(false)

  const run = React.useCallback(async () => {
    setLoading(true)
    try { setData(await getDashboardInsights()) }
    catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi tải AI insights") }
    finally { setLoading(false) }
  }, [])

  return (
    <div className="space-y-4">
      {data && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={run} disabled={loading}>
            <IconRefresh className={`mr-1.5 size-4 ${loading ? "animate-spin" : ""}`} />Làm mới
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : data ? (
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
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <div>
            <p className="font-medium">Phân tích AI chưa được chạy</p>
            <p className="mt-1 text-sm text-muted-foreground">Nhấn nút bên dưới để AI phân tích tình hình kinh doanh 7 ngày qua</p>
          </div>
          <Button onClick={run} disabled={loading} className="gap-2">
            Phân tích ngay
          </Button>
        </div>
      )}
    </div>
  )
}
