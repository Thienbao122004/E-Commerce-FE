"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getFollowedShops, unfollowShop } from "@/services/storefront-shops"
import type { ShopFollowedDto } from "@/services/storefront-shops"
import { toast } from "sonner"
import { formatCompactNumber } from "@/lib/formatters"

export default function FollowedShopsPage() {
  const [shops, setShops] = useState<ShopFollowedDto[]>([])
  const [loading, setLoading] = useState(true)

  const loadShops = async () => {
    setLoading(true)
    try {
      const res = await getFollowedShops()
      if (res.success) {
        setShops(res.shops)
      }
    } catch {
      toast.error("Không thể lấy danh sách shop theo dõi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShops()
  }, [])

  const handleUnfollow = async (shopId: string) => {
    try {
      await unfollowShop(shopId)
      toast.success("Đã bỏ theo dõi gian hàng")
      setShops((prev) => prev.filter((s) => s.id !== shopId))
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau")
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-main)" }}>
          Shop Đang Theo Dõi
        </h1>
        <p className="text-sm text-gray-500 mt-1">Danh sách các gian hàng bạn lưu lại</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 animate-pulse">
              <div className="size-16 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-8 bg-gray-200 rounded mt-2 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-gray-200 block mb-4">storefront</span>
          <p className="text-gray-500 text-lg font-medium">Bạn chưa theo dõi gian hàng nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-orange-200 transition bg-white"
            >
              <Link href={`/shop/${shop.slug}`} className="shrink-0 flex items-center">
                {shop.logoUrl ? (
                  <img
                    src={shop.logoUrl}
                    alt={shop.name}
                    className="size-16 rounded-full object-cover border border-gray-100"
                  />
                ) : (
                  <div className="size-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                    <span className="material-symbols-outlined text-2xl">storefront</span>
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/shop/${shop.slug}`} className="block">
                  <h3
                    className="font-bold text-sm md:text-base truncate hover:text-orange-500 transition-colors"
                    style={{ color: "var(--color-text-main)" }}
                  >
                    {shop.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 mb-3">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 15 }}>group</span>
                    <span>{formatCompactNumber(shop.followerCount ?? 0)} Người theo dõi</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-yellow-400" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span>{(shop.averageRating ?? 0).toFixed(1)} Đánh giá</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/shop/${shop.slug}`}
                    className="flex-1 max-w-[120px] text-center px-3 py-1.5 rounded-lg border border-orange-200 text-orange-500 text-xs font-bold hover:bg-orange-50 transition"
                  >
                    Xem Shop
                  </Link>
                  <button
                    onClick={() => handleUnfollow(shop.id)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition"
                  >
                    Bỏ theo dõi
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
