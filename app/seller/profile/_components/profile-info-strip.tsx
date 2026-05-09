"use client"

import { Skeleton } from "@/components/ui/skeleton"
import type { SellerShopInfo } from "@/types/seller-dashboard"
import { IconCalendar, IconCopy, IconHash, IconLink } from "@tabler/icons-react"
import { toast } from "sonner"

type Props = {
  shop: SellerShopInfo | null
  loading: boolean
}

export function ProfileInfoStrip({ shop, loading }: Props) {
  if (loading || !shop) {
    return (
      <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const copyCode = () => {
    navigator.clipboard.writeText(shop.shopCode)
    toast.success("Đã sao chép mã cửa hàng")
  }

  const shopUrl = `/shop/${shop.slug}`

  return (
    <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        <div className="flex items-center gap-2">
          <IconHash className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Mã cửa hàng:</span>
          <span className="font-mono font-bold tracking-wider text-foreground">
            {shop.shopCode}
          </span>
          <button
            type="button"
            onClick={copyCode}
            className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Sao chép mã cửa hàng"
          >
            <IconCopy className="size-3" />
          </button>
        </div>

        <div className="hidden h-4 w-px bg-border sm:block" />

        <div className="flex items-center gap-2">
          <IconLink className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Đường dẫn:</span>
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-foreground hover:underline"
          >
            {shopUrl}
          </a>
        </div>

        <div className="hidden h-4 w-px bg-border sm:block" />

        <div className="flex items-center gap-2">
          <IconCalendar className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Tham gia từ:</span>
          <span className="text-foreground">
            {new Date(shop.createdAt).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
