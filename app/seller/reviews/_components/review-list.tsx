"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IconMessage2, IconStar, IconStarFilled, IconThumbUp } from "@tabler/icons-react"
import type { Review } from "./review-data"
import { ratingColors } from "./review-data"

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= rating
          ? <IconStarFilled key={i} className="size-3.5 text-yellow-400" />
          : <IconStar key={i} className="size-3.5 text-muted-foreground/30" />
      )}
    </div>
  )
}

function BuyerAvatar({ name }: { name: string }) {
  const colors = ["bg-violet-500", "bg-blue-500", "bg-green-500", "bg-orange-500", "bg-pink-500"]
  const color = colors[name.charCodeAt(0) % colors.length]
  const initials = name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
  return (
    <div className={`size-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${color}`}>
      {initials}
    </div>
  )
}

type Props = {
  reviews: Review[]
  replies: Record<string, string>
  onOpenReply: (review: Review) => void
}

export function ReviewList({ reviews, replies, onOpenReply }: Props) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground rounded-xl border border-dashed">
        <IconStarFilled className="size-8 opacity-20" />
        <p className="text-sm">Không có đánh giá nào</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((review) => {
        const currentReply = review.sellerReply ?? replies[review.id] ?? null
        return (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <BuyerAvatar name={review.buyerName} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{review.buyerName}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${ratingColors[review.rating]}`}>
                        {review.rating} sao
                      </Badge>
                      {!currentReply && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-orange-50 text-orange-600 border-orange-200">
                          Chưa phản hồi
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 mb-2">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground truncate">{review.productName}</span>
                  </div>

                  <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>

                  {review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {review.images.map((src, i) => (
                        <a
                          key={i}
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block shrink-0 rounded-md border bg-muted/30 overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- data URL / URL ngoài */}
                          <img
                            src={src}
                            alt={`Ảnh đánh giá ${i + 1}`}
                            className="size-20 object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {review.helpful > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <IconThumbUp className="size-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">{review.helpful} người thấy hữu ích</span>
                    </div>
                  )}

                  {currentReply && (
                    <div className="mt-3 rounded-lg bg-muted/50 border border-muted p-3">
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1">Phản hồi của cửa hàng:</p>
                      <p className="text-sm leading-relaxed">{currentReply}</p>
                    </div>
                  )}

                  {!currentReply && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 h-7 text-xs"
                      onClick={() => onOpenReply(review)}
                    >
                      <IconMessage2 className="size-3 mr-1.5" />
                      Phản hồi khách hàng
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
