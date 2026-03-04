"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  VerificationStatus,
  VerificationStatusLabels,
  VerificationStatusColors,
  ShopStatusLabels,
  ShopStatusColors,
} from "@/types/seller"
import type { SellerShopInfo } from "@/types/seller-dashboard"
import { IconCircleCheckFilled, IconClock, IconHash, IconShieldCheck } from "@tabler/icons-react"

type Props = {
  shop: SellerShopInfo | null
  loading: boolean
}

export function ProfileInfoCards({ shop, loading }: Props) {
  if (loading || !shop) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const isVerified = shop.verificationStatus === VerificationStatus.Verified

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <IconShieldCheck className="size-4 text-muted-foreground" />
            Trạng thái
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Xác thực thương hiệu</p>
            <Badge className={`text-xs gap-1 ${VerificationStatusColors[shop.verificationStatus] ?? ""}`}>
              {isVerified && <IconCircleCheckFilled className="size-3" />}
              {VerificationStatusLabels[shop.verificationStatus] ?? "Không rõ"}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Trạng thái cửa hàng</p>
            <Badge variant="outline" className={`text-xs ${ShopStatusColors[shop.status] ?? ""}`}>
              {ShopStatusLabels[shop.status] ?? "Không rõ"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <IconHash className="size-4 text-muted-foreground" />
            Thông tin hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">ID cửa hàng</p>
            <p className="text-xs font-mono truncate text-foreground">{shop.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Đường dẫn (slug)</p>
            <p className="text-xs font-mono text-foreground">/shop/{shop.slug}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconClock className="size-3.5 shrink-0" />
            <span>
              Tạo ngày{" "}
              {new Date(shop.createdAt).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
