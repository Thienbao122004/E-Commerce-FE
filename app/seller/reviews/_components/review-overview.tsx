"use client"

import { IconMessageReply, IconStarFilled } from "@tabler/icons-react"
import { Card, CardContent } from "@/components/ui/card"
import { StatsCard, StatsGrid } from "@/components/common/stats-card"
import type { Review } from "./review-data"

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= rating
          ? <IconStarFilled key={i} className="size-4 text-yellow-400" />
          : <IconStarFilled key={i} className="size-4 text-muted-foreground/20" />
      )}
    </div>
  )
}

type Props = {
  reviews: Review[]
  pendingReplyCount: number
}

export function ReviewOverview({ reviews, pendingReplyCount }: Props) {
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  return (
    <StatsGrid cols={4} gap="sm">
      {/* Average rating — custom content */}
      <Card>
        <CardContent className="p-4 h-full flex flex-col justify-center">
          <p className="text-xs text-muted-foreground font-medium mb-2">Điểm trung bình</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold tabular-nums text-yellow-500">
              {avgRating.toFixed(1)}
            </span>
            <div className="mb-0.5">
              <StarRating rating={Math.round(avgRating)} />
              <p className="text-[10px] text-muted-foreground mt-0.5">{reviews.length} đánh giá</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating distribution — custom content */}
      <Card className="col-span-1 md:col-span-2">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground font-medium mb-2">Phân bố đánh giá</p>
          <div className="grid gap-1">
            {ratingDist.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-[10px] w-3 text-muted-foreground">{star}</span>
                <IconStarFilled className="size-3 text-yellow-400 shrink-0" />
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] w-4 text-right text-muted-foreground tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <StatsCard
        label="Chờ phản hồi"
        value={pendingReplyCount}
        icon={<IconMessageReply />}
        iconBg="bg-orange-100 dark:bg-orange-900/30"
        iconColor="text-orange-600 dark:text-orange-400"
        valueColor="text-orange-500"
        subText="đánh giá chưa trả lời"
        className={pendingReplyCount > 0 ? "border-orange-200 dark:border-orange-800" : undefined}
      />
    </StatsGrid>
  )
}
