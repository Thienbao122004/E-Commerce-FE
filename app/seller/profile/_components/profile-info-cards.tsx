"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  VerificationStatus,
} from "@/types/seller"
import type { SellerShopInfo } from "@/types/seller-dashboard"
import {
  IconClock,
  IconCopy,
  IconHash,
  IconLink,
} from "@tabler/icons-react"
import { toast } from "sonner"

type Props = {
  shop: SellerShopInfo | null
  loading: boolean
}

export function ProfileInfoCards({ shop, loading }: Props) {
  if (loading || !shop) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 lg:p-5 space-y-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 lg:p-5 space-y-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const copyCode = () => {
    navigator.clipboard.writeText(shop.shopCode)
    toast.success("Đã sao chép mã cửa hàng")
  }

  const copyId = () => {
    navigator.clipboard.writeText(shop.id)
    toast.success("Đã sao chép UUID")
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-muted">
              <IconHash className="size-3.5 text-muted-foreground" />
            </div>
            Thông tin hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3.5">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Mã cửa hàng</p>
            <div className="flex items-center gap-1.5">
              <p className="font-mono font-bold text-sm text-foreground tracking-wider flex-1">{shop.shopCode}</p>
              <button
                type="button"
                onClick={copyCode}
                className="shrink-0 flex items-center justify-center size-6 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <IconCopy className="size-3" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Đường dẫn cửa hàng</p>
            <div className="flex items-center gap-1.5 text-xs font-mono text-foreground">
              <IconLink className="size-3 text-muted-foreground shrink-0" />
              <span>/shop/{shop.slug}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
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
