"use client"

import { IconBrain, IconCircleCheck, IconEdit, IconTrendingUp, IconX } from "@tabler/icons-react"
import { StatsCard, StatsGrid } from "@/components/common/stats-card"

type Props = {
  total: number
  accepted: number
  modified: number
  rejected: number
  loading?: boolean
}

export function SuggestionStats({ total, accepted, modified, rejected, loading }: Props) {
  const acceptanceRate = total > 0 ? Math.round(((accepted + modified) / total) * 100) : 0

  return (
    <StatsGrid cols={4} gap="sm">
      <StatsCard
        label="Tổng gợi ý"
        value={total}
        icon={<IconBrain />}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        subText="lần AI phân tích"
        className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
      />
      <StatsCard
        label="Đã chấp nhận"
        value={accepted}
        icon={<IconCircleCheck />}
        iconBg="bg-green-50 dark:bg-green-950/40"
        iconColor="text-green-600 dark:text-green-400"
        valueColor="text-green-600 dark:text-green-400"
        subText="dùng nguyên gợi ý"
        className="border-green-200/50 dark:border-green-800/30"
      />
      <StatsCard
        label="Đã chỉnh sửa"
        value={modified}
        icon={<IconEdit />}
        iconBg="bg-blue-50 dark:bg-blue-950/40"
        iconColor="text-blue-600 dark:text-blue-400"
        valueColor="text-blue-600 dark:text-blue-400"
        subText="chỉnh sửa rồi dùng"
        className="border-blue-200/50 dark:border-blue-800/30"
      />
      <StatsCard
        label="Tỷ lệ hữu ích"
        value={`${acceptanceRate}%`}
        icon={<IconTrendingUp />}
        footer={
          <div className="flex items-center gap-1.5">
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
        }
      />
    </StatsGrid>
  )
}
