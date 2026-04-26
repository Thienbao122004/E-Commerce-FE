"use client"

import { IconInfoCircle, IconPercentage } from "@tabler/icons-react"
import { formatPriceVND } from "@/lib/formatters"
import { estimatedNetAfterPlatformFeeVnd, platformFeeVndFromGross } from "@/lib/seller-platform-fee"
import { Skeleton } from "@/components/ui/skeleton"

type Props = {
  /** Tỷ lệ phí sàn 0–100; null = chưa tải */
  commissionPercent: number | null
  loading?: boolean
  /** Một mức giá bán (tiền hàng) để minh hoạ; bỏ qua nếu nhiều mức giá (biến thể) */
  grossVnd?: number
  /** Bật khi sản phẩm nhiều biến thể — không hiện số dự kiên theo 1 mức */
  isMultiPrice?: boolean
  className?: string
}

export function SellerPlatformFeeHint({
  commissionPercent,
  loading,
  grossVnd,
  isMultiPrice,
  className = "",
}: Props) {
  if (loading) {
    return (
      <div className={`rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 ${className}`}>
        <div className="flex items-start gap-2">
          <Skeleton className="size-4 rounded shrink-0 mt-0.5" />
          <div className="min-w-0 space-y-1.5 flex-1">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-full max-w-sm" />
          </div>
        </div>
      </div>
    )
  }

  if (commissionPercent == null) return null

  const pctLabel = Number.isInteger(commissionPercent)
    ? String(commissionPercent)
    : commissionPercent.toFixed(1).replace(/\.0$/, "")

  const showExample =
    !isMultiPrice &&
    grossVnd != null &&
    Number.isFinite(grossVnd) &&
    grossVnd > 0

  const estNet = showExample
    ? estimatedNetAfterPlatformFeeVnd(grossVnd, commissionPercent)
    : null
  const estFee = showExample ? platformFeeVndFromGross(grossVnd, commissionPercent) : null

  return (
    <div
      className={`rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-[11px] leading-snug text-foreground/90 ${className}`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0 rounded-md bg-primary/10 p-0.5 text-primary">
          <IconPercentage className="size-3.5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground flex items-center gap-1 flex-wrap">
            Phí nền tảng: {pctLabel}% trên tiền hàng
            <span className="font-normal text-muted-foreground">(khi quyết toán đơn)</span>
          </p>
          <p className="text-muted-foreground mt-0.5">
            Không tính trên phí vận chuyển.
          </p>
          {showExample && estNet != null && estFee != null ? (
            <p className="mt-1.5 text-foreground/95">
              Ví dụ: tiền hàng {formatPriceVND(grossVnd)} → trừ phí ~{formatPriceVND(estFee)} →
              ước tính về ví (tiền hàng) ~<span className="font-semibold tabular-nums">{formatPriceVND(estNet)}</span>
            </p>
          ) : isMultiPrice ? (
            <p className="mt-1.5 text-muted-foreground">
              Mỗi biến thể: tiền về ví ước tính = <span className="font-medium text-foreground/90">giá bán</span> ×
              (1 − {pctLabel}%)
            </p>
          ) : null}
        </div>
        <IconInfoCircle className="size-3.5 text-primary/50 shrink-0 max-sm:hidden" aria-hidden />
      </div>
    </div>
  )
}
