"use client"

import { IconCategory2 } from "@tabler/icons-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { SellerShopInfo } from "@/types/seller-dashboard"
import { cn } from "@/lib/utils"

type Props = {
  shop: SellerShopInfo | null
  loading: boolean
}

/**
 * Ngành hàng (mặt hàng) đã đăng ký — dùng ở hồ sơ / thêm sản phẩm / sửa sản phẩm.
 */
export function ShopPrimaryCategoryBanner({ shop, loading }: Props) {
  if (loading) {
    return (
      <div
        className="rounded-2xl border p-4 md:p-5"
        style={{ borderColor: "#e5ded6", backgroundColor: "#fffdfb" }}
      >
        <Skeleton className="h-4 w-40 mb-2" />
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-3 w-full max-w-lg mt-2" />
      </div>
    )
  }

  if (!shop) return null

  const hasRoot =
    shop.primaryCategoryId != null && shop.primaryCategoryId > 0
  const name = shop.primaryCategoryName?.trim() || null

  return (
    <div
      className={cn(
        "rounded-2xl border-2 p-4 md:px-6 md:py-5 shadow-sm",
        "ring-1 ring-black/[0.04]",
      )}
      style={{
        borderColor: "var(--color-primary, #e87f19)",
        background:
          "linear-gradient(135deg, rgba(232,127,25,0.06) 0%, #fffdfb 45%, #ffffff 100%)",
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: "rgba(232,127,25,0.12)", color: "var(--color-primary, #c45f0a)" }}
        >
          <IconCategory2 className="size-6" stroke={1.5} />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-primary, #b45309)" }}
          >
            Mặt hàng đăng ký
          </p>
          {hasRoot ? (
            <>
              <p className="text-xl font-bold leading-snug text-foreground md:text-2xl break-words">
                {name ?? `Danh mục #${shop.primaryCategoryId}`}
              </p>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Bạn <strong className="font-medium text-foreground/90">chỉ được đăng sản phẩm</strong> thuộc
                nhánh danh mục này. Không thể thêm sản phẩm thuộc ngành khác.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Hồ sơ chưa ghi nhận ngành hàng gốc — thường gặp với tài khoản shop tạo trước khi bổ sung
              tính năng. Liên hệ quản trị nếu cần cập nhật.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
