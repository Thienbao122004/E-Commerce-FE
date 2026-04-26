"use client"

import { IconPercentage } from "@tabler/icons-react"
import { useAuth } from "@/contexts/auth-context"
import { useSellerPlatformFee } from "@/hooks/use-seller-platform-fee"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Một dòng gợi nhớ phí sàn ở footer sidebar (khu bán hàng).
 */
export function SellerPlatformFeeFooter() {
  const { role } = useAuth()
  const { commissionPercent, loading } = useSellerPlatformFee(role === "seller")

  if (role !== "seller") return null

  const label =
    commissionPercent != null && Number.isFinite(commissionPercent)
      ? Number.isInteger(commissionPercent)
        ? String(commissionPercent)
        : commissionPercent.toFixed(1).replace(/\.0$/, "")
      : null

  return (
    <div className="px-2 py-1.5 border-t border-sidebar-border/70">
      <div className="flex items-start gap-1.5 rounded-md bg-sidebar-accent/30 px-2 py-1.5 text-[10px] leading-snug text-sidebar-foreground/80">
        <IconPercentage
          className="size-3.5 shrink-0 text-violet-600 dark:text-violet-400 mt-0.5"
          aria-hidden
        />
        <div className="min-w-0">
          {loading ? (
            <Skeleton className="h-3 w-[min(100%,10rem)]" />
          ) : label != null ? (
            <>
              <span className="block font-medium text-sidebar-foreground">
                Phí nền tảng: <span className="tabular-nums text-violet-700 dark:text-violet-300">{label}%</span>
              </span>
              <span className="text-sidebar-foreground/60">
                Tính trên tiền hàng từng đơn (khi ghi có ví; không tính phí ship)
              </span>
            </>
          ) : (
            <span className="text-sidebar-foreground/50">Chưa tải cấu hình phí sàn</span>
          )}
        </div>
      </div>
    </div>
  )
}
