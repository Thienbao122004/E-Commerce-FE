"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getProductReviews,
  getProductReviewStats,
  type ProductReviewDto,
  type ProductReviewStatsDto,
} from "@/services/reviews"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatCompactNumber, formatDateTimeVN } from "@/lib/formatters"

/** Màu nhấn kiểu Shopee */
const ACCENT = "#ee4d2d"

export type StorefrontReviewFilter =
  | "all"
  | "5"
  | "4"
  | "3"
  | "2"
  | "1"
  | "comment"
  | "image"

function filterToQuery(f: StorefrontReviewFilter): {
  rating?: number
  hasComment?: boolean
  hasImage?: boolean
} {
  switch (f) {
    case "all":
      return {}
    case "5":
      return { rating: 5 }
    case "4":
      return { rating: 4 }
    case "3":
      return { rating: 3 }
    case "2":
      return { rating: 2 }
    case "1":
      return { rating: 1 }
    case "comment":
      return { hasComment: true }
    case "image":
      return { hasImage: true }
    default:
      return {}
  }
}

function ReviewerAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const colors = ["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500"]
  const safe = name.trim() || "?"
  const color = colors[safe.charCodeAt(0) % colors.length]
  const words = safe.split(/\s+/).filter((w) => /^\D/.test(w))
  const initials = (words.length ? words : [safe])
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const fallback = (
    <div
      className={`size-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${color}`}
    >
      {initials}
    </div>
  )

  if (!avatarUrl) return fallback

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl}
        alt={name}
        className="size-10 rounded-full object-cover shrink-0"
        onError={(e) => {
          e.currentTarget.style.display = "none"
          const sib = e.currentTarget.nextElementSibling as HTMLElement | null
          if (sib) sib.style.display = "flex"
        }}
      />
      <div
        className={`size-10 rounded-full items-center justify-center text-white text-sm font-semibold shrink-0 ${color}`}
        style={{ display: "none" }}
      >
        {initials}
      </div>
    </>
  )
}

function StarRowShopee({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className="material-symbols-outlined text-[15px] leading-none"
          style={{
            color: i < rating ? ACCENT : "#e5e7eb",
            fontVariationSettings: i < rating ? "'FILL' 1" : "'FILL' 0",
          }}
        >
          star
        </span>
      ))}
    </div>
  )
}

type SortValue = "newest" | "rating" | "rating_asc"

type Props = {
  productId: string
  averageRating: number
  reviewCount: number
}

export function ProductReviewsSection({ productId, averageRating, reviewCount }: Props) {
  const [filter, setFilter] = useState<StorefrontReviewFilter>("all")
  const [sortBy, setSortBy] = useState<SortValue>("newest")
  const [stats, setStats] = useState<ProductReviewStatsDto | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [reviews, setReviews] = useState<ProductReviewDto[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const pageSize = 10

  useEffect(() => {
    let cancelled = false
    setStatsLoading(true)
    void getProductReviewStats(productId)
      .then((res) => {
        if (!cancelled && res.success && res.data) setStats(res.data)
      })
      .catch(() => {
        if (!cancelled) setStats(null)
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [productId])

  const load = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError(null)
      const q = filterToQuery(filter)
      try {
        const res = await getProductReviews(productId, {
          page: nextPage,
          pageSize,
          sortBy,
          ...q,
        })
        if (res.success) {
          setTotalCount(res.totalCount)
          setReviews((prev) => (append ? [...prev, ...res.reviews] : res.reviews))
          setPage(nextPage)
        } else {
          setError(res.message ?? "Không tải được đánh giá")
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không tải được đánh giá")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [productId, sortBy, filter]
  )

  useEffect(() => {
    setReviews([])
    setPage(1)
    void load(1, false)
  }, [productId, sortBy, filter, load])

  const hasMore = reviews.length < totalCount

  const totalDisplay = stats?.total ?? reviewCount
  const countFor = (f: StorefrontReviewFilter): number => {
    if (!stats) return 0
    switch (f) {
      case "all":
        return stats.total
      case "5":
        return stats.count5
      case "4":
        return stats.count4
      case "3":
        return stats.count3
      case "2":
        return stats.count2
      case "1":
        return stats.count1
      case "comment":
        return stats.withComment
      case "image":
        return stats.withImage
      default:
        return 0
    }
  }

  const pill = (f: StorefrontReviewFilter, label: string) => {
    const n = countFor(f)
    const active = filter === f
    return (
      <button
        key={f}
        type="button"
        disabled={statsLoading}
        onClick={() => setFilter(f)}
        className={cn(
          "inline-flex items-center rounded-sm border px-2.5 py-1.5 text-xs sm:text-sm transition-colors whitespace-nowrap",
          active
            ? "border-[#ee4d2d] text-[#ee4d2d] bg-white font-medium"
            : "border-gray-200 text-gray-800 bg-white hover:border-gray-300"
        )}
      >
        {label}{" "}
        <span className={cn("ml-1 tabular-nums", active ? "text-[#ee4d2d]" : "text-gray-500")}>
          ({formatCompactNumber(n)})
        </span>
      </button>
    )
  }

  if (reviewCount <= 0) {
    return (
      <div className="py-8 text-center text-gray-400">
        <span className="material-symbols-outlined text-4xl block mb-2">rate_review</span>
        <p className="font-medium">Chưa có đánh giá nào</p>
        <p className="text-sm mt-1">Hãy là người đầu tiên đánh giá sản phẩm này</p>
      </div>
    )
  }

  const roundedAvg = Math.min(5, Math.max(0, Math.round(averageRating)))

  return (
    <div className="flex flex-col gap-5">
      {/* Khối tóm tắt + filter kiểu Shopee */}
      <div className="rounded-sm border border-orange-100/90 bg-[#fffbf8] p-4 md:p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex shrink-0 items-start gap-3">
            <div>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-3xl md:text-4xl font-bold tabular-nums" style={{ color: ACCENT }}>
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-base md:text-lg font-medium" style={{ color: ACCENT }}>
                  trên 5
                </span>
              </div>
              <div className="mt-1">
                <StarRowShopee rating={roundedAvg} />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {statsLoading ? "…" : `${formatCompactNumber(totalDisplay)} đánh giá`}
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Lọc theo
            </p>
            <div className="flex flex-wrap gap-2">
              {pill("all", "Tất cả")}
              {pill("5", "5 sao")}
              {pill("4", "4 sao")}
              {pill("3", "3 sao")}
              {pill("2", "2 sao")}
              {pill("1", "1 sao")}
              {pill("comment", "Có bình luận")}
              {pill("image", "Có hình ảnh")}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 lg:flex-col lg:items-end lg:gap-1">
            <span className="text-xs text-gray-500 whitespace-nowrap lg:sr-only">Sắp xếp</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortValue)}>
              <SelectTrigger className="h-9 w-[200px] text-sm bg-white border-gray-200">
                <SelectValue placeholder="Mới nhất" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="rating">Sao cao nhất</SelectItem>
                <SelectItem value="rating_asc">Sao thấp nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {loading && reviews.length === 0 ? (
        <div className="space-y-4 animate-pulse border-t border-gray-100 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 pb-4 border-b border-gray-50 last:border-0">
              <div className="size-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6 border-t border-gray-100">
          Không có đánh giá phù hợp bộ lọc.
        </p>
      ) : (
        <ul className="flex flex-col border-t border-gray-100">
          {reviews.map((r) => {
            const name = r.userName?.trim() || "Khách hàng"
            const imgs = Array.isArray(r.imageUrls) ? r.imageUrls : []
            const helpful = r.helpfulCount ?? 0
            const sellerReply = r.sellerReply?.trim()
            return (
              <li key={r.id} className="flex gap-3 py-5 border-b border-gray-100 last:border-0">
                <ReviewerAvatar name={name} avatarUrl={r.userAvatarUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-sm text-gray-900">{name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <StarRowShopee rating={r.rating} />
                    <span className="text-xs text-gray-400">
                      {formatDateTimeVN(r.createdAt)}
                    </span>
                  </div>

                  {r.comment?.trim() ? (
                    <p className="text-sm text-gray-800 mt-2 leading-relaxed whitespace-pre-wrap">
                      {r.comment}
                    </p>
                  ) : imgs.length === 0 ? (
                    <p className="text-sm text-gray-400 mt-2 italic">Khách không để lại nhận xét</p>
                  ) : null}

                  {imgs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {imgs.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLightbox(src)}
                          className="block rounded-md border border-gray-200 overflow-hidden bg-gray-50 shrink-0 focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={`Ảnh đánh giá ${i + 1}`}
                            className="size-[72px] sm:size-20 object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {sellerReply ? (
                    <div className="mt-3 rounded border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm">
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        Phản hồi của người bán
                      </p>
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{sellerReply}</p>
                    </div>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between text-gray-400">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#ee4d2d] transition-colors"
                      aria-label="Hữu ích"
                    >
                      <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                      {helpful > 0 ? (
                        <span className="tabular-nums">{helpful}</span>
                      ) : null}
                    </button>
                    <span className="material-symbols-outlined text-[18px] opacity-50" aria-hidden>
                      more_vert
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="outline"
            className="min-w-[200px] border-gray-200 text-gray-800 hover:bg-[#fffbf8] hover:border-[#ee4d2d]/50"
            disabled={loadingMore}
            onClick={() => void load(page + 1, true)}
          >
            {loadingMore ? "Đang tải…" : "Xem thêm đánh giá"}
          </Button>
        </div>
      )}

      <Dialog open={lightbox != null} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent
          showCloseButton
          className="max-w-[min(100vw-2rem,520px)] p-0 overflow-hidden border-0 bg-black/95 text-white [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:bg-white/10"
        >
          {lightbox ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={lightbox}
              alt="Xem ảnh đánh giá"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
