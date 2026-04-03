"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { mapSellerReviewToReview } from "./_components/review-data"
import type { Review } from "./_components/review-data"
import { ReviewOverview } from "./_components/review-overview"
import { ReviewFilters } from "./_components/review-filters"
import { ReviewList } from "./_components/review-list"
import { ReplyDialog } from "./_components/reply-dialog"
import { useDebounce } from "@/hooks/use-debounce"
import { fetchMyProductReviews } from "@/services/seller-dashboard"

const PAGE_SIZE = 10

const defaultStats = {
  averageRating: 0,
  totalCount: 0,
  ratingDistribution: [0, 0, 0, 0, 0] as number[],
  pendingReplyCount: 0,
}

export default function SellerReviewsPage() {
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 350)
  const [filterRating, setFilterRating] = useState("all")
  const [page, setPage] = useState(1)
  const [replyTarget, setReplyTarget] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replies, setReplies] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState(defaultStats)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterRating])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const rating =
          filterRating === "all" ? undefined : Number(filterRating)
        const res = await fetchMyProductReviews(
          page,
          PAGE_SIZE,
          Number.isFinite(rating) ? rating : undefined,
          debouncedSearch.trim() || undefined
        )
        if (cancelled) return
        if (!res.success || !res.data) {
          setError(res.message || "Không tải được đánh giá")
          setReviews([])
          setStats(defaultStats)
          return
        }
        const d = res.data
        setStats({
          averageRating: d.averageRating,
          totalCount: d.totalCount,
          ratingDistribution:
            d.ratingDistribution?.length === 5
              ? d.ratingDistribution
              : defaultStats.ratingDistribution,
          pendingReplyCount: d.pendingReplyCount,
        })
        setReviews(d.reviews.map(mapSellerReviewToReview))
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Lỗi tải đánh giá")
          setReviews([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [page, debouncedSearch, filterRating])

  const totalPages = Math.max(1, Math.ceil(stats.totalCount / PAGE_SIZE))

  const submitReply = () => {
    if (!replyTarget || !replyText.trim()) return
    setReplies((prev) => ({ ...prev, [replyTarget.id]: replyText.trim() }))
    setReplyText("")
    setReplyTarget(null)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <ReviewOverview
        averageRating={stats.averageRating}
        totalCount={stats.totalCount}
        ratingDistribution={stats.ratingDistribution}
        pendingReplyCount={stats.pendingReplyCount}
        loading={loading}
      />

      {error && (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          {error}
        </p>
      )}

      <ReviewFilters
        search={searchInput}
        filterRating={filterRating}
        onSearchChange={setSearchInput}
        onRatingChange={(v) => {
          setFilterRating(v)
        }}
      />

      {loading ? (
        <div className="flex justify-center py-16 text-sm text-muted-foreground">Đang tải đánh giá…</div>
      ) : (
        <ReviewList
          reviews={reviews}
          replies={replies}
          onOpenReply={(r) => {
            setReplyTarget(r)
            setReplyText("")
          }}
        />
      )}

      {!loading && stats.totalCount > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Hiển thị {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, stats.totalCount)} trong {stats.totalCount} đánh giá
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <span className="text-sm tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <ReplyDialog
        target={replyTarget}
        replyText={replyText}
        onTextChange={setReplyText}
        onClose={() => setReplyTarget(null)}
        onSubmit={submitReply}
      />
    </div>
  )
}
