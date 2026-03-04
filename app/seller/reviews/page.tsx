"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { MOCK_REVIEWS } from "./_components/review-data"
import type { Review } from "./_components/review-data"
import { ReviewOverview } from "./_components/review-overview"
import { ReviewFilters } from "./_components/review-filters"
import { ReviewList } from "./_components/review-list"
import { ReplyDialog } from "./_components/reply-dialog"

const PAGE_SIZE = 10

export default function SellerReviewsPage() {
  const [search, setSearch] = useState("")
  const [filterRating, setFilterRating] = useState("all")
  const [filterReply, setFilterReply] = useState("all")
  const [page, setPage] = useState(1)
  const [replyTarget, setReplyTarget] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replies, setReplies] = useState<Record<string, string>>({})

  const filtered = MOCK_REVIEWS.filter((r) => {
    const matchSearch =
      r.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase())
    const matchRating = filterRating === "all" || r.rating === Number(filterRating)
    const hasReply = r.sellerReply || replies[r.id]
    const matchReply =
      filterReply === "all" ||
      (filterReply === "replied" && hasReply) ||
      (filterReply === "not_replied" && !hasReply)
    return matchSearch && matchRating && matchReply
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const needReply = MOCK_REVIEWS.filter((r) => !r.sellerReply && !replies[r.id]).length

  const submitReply = () => {
    if (!replyTarget || !replyText.trim()) return
    setReplies((prev) => ({ ...prev, [replyTarget.id]: replyText.trim() }))
    setReplyText("")
    setReplyTarget(null)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-5 lg:p-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Đánh giá & Nhận xét</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Quản lý và phản hồi đánh giá từ khách hàng</p>
      </div>

      <ReviewOverview reviews={MOCK_REVIEWS} pendingReplyCount={needReply} />

      <ReviewFilters
        search={search}
        filterRating={filterRating}
        filterReply={filterReply}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onRatingChange={(v) => { setFilterRating(v); setPage(1) }}
        onReplyChange={(v) => { setFilterReply(v); setPage(1) }}
      />

      <ReviewList reviews={paged} replies={replies} onOpenReply={(r) => { setReplyTarget(r); setReplyText("") }} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Hiển thị {paged.length} / {filtered.length} đánh giá
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <IconChevronLeft className="size-4" />
            </Button>
            <span className="text-sm tabular-nums">{page} / {totalPages}</span>
            <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
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
