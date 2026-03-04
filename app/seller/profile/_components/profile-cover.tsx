"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  VerificationStatus,
  VerificationStatusLabels,
  ShopStatusLabels,
  ShopStatusColors,
} from "@/types/seller"
import type { SellerShopInfo } from "@/types/seller-dashboard"
import { IconCircleCheckFilled, IconExternalLink } from "@tabler/icons-react"

type Props = {
  shop: SellerShopInfo | null
  loading: boolean
}

export function ProfileCover({ shop, loading }: Props) {
  if (loading || !shop) {
    return (
      <div className="rounded-xl border overflow-hidden bg-card">
        <Skeleton className="h-44 w-full rounded-none" />
        <div className="px-6 pb-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10">
            <Skeleton className="size-20 rounded-full border-4 border-background shrink-0" />
            <div className="flex-1 space-y-2 pt-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isVerified = shop.verificationStatus === VerificationStatus.Verified

  return (
    <div className="rounded-xl border overflow-hidden bg-card">
      <div className="relative h-44 bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)]" />
      </div>

      <div className="relative px-5 pb-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10">
          <div className="relative shrink-0">
            <div className="size-20 rounded-full border-4 border-background overflow-hidden bg-muted shadow-md">
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.name} className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center bg-stone-700 text-3xl font-bold text-white">
                  {shop.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="absolute bottom-1 right-1 size-3.5 rounded-full border-2 border-background bg-green-500" />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left pt-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-bold truncate">{shop.name}</h1>
              {isVerified && (
                <Badge className="bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 gap-1 text-xs">
                  <IconCircleCheckFilled className="size-3 text-green-500" />
                  Local Brand Xác Thực
                </Badge>
              )}
              {!isVerified && (
                <Badge variant="outline" className="text-xs">
                  {VerificationStatusLabels[shop.verificationStatus] ?? "Chưa xác thực"}
                </Badge>
              )}
            </div>

            {shop.description && (
              <p className="mt-1 text-sm text-muted-foreground italic line-clamp-1">
                &ldquo;{shop.description}&rdquo;
              </p>
            )}

            <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Badge variant="outline" className={`text-xs ${ShopStatusColors[shop.status] ?? ""}`}>
                {ShopStatusLabels[shop.status] ?? "—"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Tham gia từ{" "}
                {new Date(shop.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                })}
              </span>
            </div>
          </div>

          <Button variant="outline" size="sm" className="shrink-0 text-xs" asChild>
            <a href={`/shop/${shop.slug}`} target="_blank" rel="noopener noreferrer">
              <IconExternalLink className="mr-1.5 size-3.5" />
              Xem trước cửa hàng
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
