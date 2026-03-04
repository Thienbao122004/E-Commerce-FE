"use client"

import { Card, CardContent } from "@/components/ui/card"
import { IconBrain, IconCircleCheck, IconEdit, IconTrendingUp, IconX } from "@tabler/icons-react"

type Props = {
  total: number
  accepted: number
  modified: number
  rejected: number
}

export function SuggestionStats({ total, accepted, modified, rejected }: Props) {
  const acceptanceRate = total > 0 ? Math.round(((accepted + modified) / total) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Tổng gợi ý</p>
            <div className="flex items-center justify-center size-7 rounded-full bg-primary/10">
              <IconBrain className="size-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold leading-none">{total}</p>
          <p className="text-xs text-muted-foreground mt-1.5">lần AI phân tích</p>
        </CardContent>
      </Card>

      <Card className="border-green-200/50 dark:border-green-800/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Đã chấp nhận</p>
            <div className="flex items-center justify-center size-7 rounded-full bg-green-50 dark:bg-green-950/40">
              <IconCircleCheck className="size-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold leading-none text-green-600 dark:text-green-400">{accepted}</p>
          <p className="text-xs text-muted-foreground mt-1.5">dùng nguyên gợi ý</p>
        </CardContent>
      </Card>

      <Card className="border-blue-200/50 dark:border-blue-800/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Đã chỉnh sửa</p>
            <div className="flex items-center justify-center size-7 rounded-full bg-blue-50 dark:bg-blue-950/40">
              <IconEdit className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold leading-none text-blue-600 dark:text-blue-400">{modified}</p>
          <p className="text-xs text-muted-foreground mt-1.5">chỉnh sửa rồi dùng</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Tỷ lệ hữu ích</p>
            <div className="flex items-center justify-center size-7 rounded-full bg-muted">
              <IconTrendingUp className="size-4 text-muted-foreground" />
            </div>
          </div>
          <p className="text-2xl font-bold leading-none">{acceptanceRate}%</p>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${acceptanceRate}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              <IconX className="size-2.5 inline mr-0.5" />{rejected} bỏ qua
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
