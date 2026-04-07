"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { IconStar, IconStarFilled } from "@tabler/icons-react"
import type { Review } from "./review-data"

const QUICK_TEMPLATES = [
  "Cảm ơn bạn đã ủng hộ shop!",
  "Shop rất tiếc về trải nghiệm của bạn.",
  "Shop sẽ cải thiện ngay!",
]

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

type Props = {
  target: Review | null
  replyText: string
  submitting?: boolean
  onTextChange: (v: string) => void
  onClose: () => void
  onSubmit: () => void
}

export function ReplyDialog({ target, replyText, submitting, onTextChange, onClose, onSubmit }: Props) {
  return (
    <Dialog open={!!target} onOpenChange={(v) => { if (!v && !submitting) onClose() }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Phản hồi đánh giá</DialogTitle>
        </DialogHeader>
        {target && (
          <div className="grid gap-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-medium">{target.buyerName}</span>
                <StarRating rating={target.rating} />
              </div>
              <p className="text-muted-foreground">{target.comment}</p>
            </div>
            <Textarea
              autoFocus
              placeholder="Nhập phản hồi của bạn..."
              rows={4}
              value={replyText}
              onChange={(e) => onTextChange(e.target.value)}
              className="text-sm resize-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TEMPLATES.map((t) => (
                <button
                  key={t}
                  onClick={() => onTextChange(t)}
                  className="text-[11px] rounded-full border px-2.5 py-1 hover:bg-muted transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button onClick={onSubmit} disabled={!replyText.trim() || submitting}>
            {submitting ? "Đang gửi..." : "Gửi phản hồi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
