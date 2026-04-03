"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  IconArrowRight,
  IconBrain,
  IconBuildingStore,
  IconGavel,
  IconMessage2,
  IconSearch,
  IconShoppingBag,
  IconShoppingCart,
  IconStar,
  IconWallet,
  type Icon,
} from "@tabler/icons-react"

type SearchTarget = {
  title: string
  description: string
  href: string
  icon: Icon
}

const SEARCH_TARGETS: SearchTarget[] = [
  {
    title: "Tổng quan",
    description: "Số liệu nhanh về doanh thu, đơn hàng và hiệu suất cua shop.",
    href: "/seller/dashboard",
    icon: IconArrowRight,
  },
  {
    title: "Quản lý sản phẩm",
    description: "Xem danh sách, thêm mới và cập nhật thông tin sản phẩm.",
    href: "/seller/products",
    icon: IconShoppingBag,
  },
  {
    title: "Đơn hàng",
    description: "Theo dõi và xử lý đơn hàng của khách hàng.",
    href: "/seller/orders",
    icon: IconShoppingCart,
  },
  {
    title: "Chat với khách",
    description: "Trao đổi trực tiếp với khách hàng theo thời gian thực.",
    href: "/seller/chat",
    icon: IconMessage2,
  },
  {
    title: "Đánh giá và nhận xét",
    description: "Kiểm tra đánh giá, phản hồi nhận xét của khách hàng.",
    href: "/seller/reviews",
    icon: IconStar,
  },
  {
    title: "AI gợi ý",
    description: "Nhận gợi ý tối ưu nội dung và vận hành shop.",
    href: "/seller/ai-suggestions",
    icon: IconBrain,
  },
  {
    title: "Ví và rút tiền",
    description: "Theo dõi số dư, giao dịch và yêu cầu rút tiền.",
    href: "/seller/wallet",
    icon: IconWallet,
  },
  {
    title: "Khiếu nại",
    description: "Quản lý và xử lý các khiếu nại liên quan đến đơn hàng.",
    href: "/seller/disputes",
    icon: IconGavel,
  },
  {
    title: "Hồ sơ cửa hàng",
    description: "Cập nhật thông tin cửa hàng, hình ảnh và mô tả.",
    href: "/seller/profile",
    icon: IconBuildingStore,
  },
]

export default function SellerSearchPage() {
  const [keyword, setKeyword] = useState("")

  const normalizedKeyword = keyword.trim().toLowerCase()

  const filteredTargets = useMemo(() => {
    if (!normalizedKeyword) return SEARCH_TARGETS

    return SEARCH_TARGETS.filter((item) => {
      const haystack = `${item.title} ${item.description}`.toLowerCase()
      return haystack.includes(normalizedKeyword)
    })
  }, [normalizedKeyword])

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8 gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tìm kiếm</h1>
        <p className="text-muted-foreground mt-1">Tìm nhanh tính năng bạn muốn thao tác trong khu vực người bán.</p>
      </div>

      <div className="relative max-w-2xl">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Nhập từ khóa, ví dụ: đơn hàng, chat, sản phẩm..."
          className="h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {filteredTargets.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Khong tim thay muc phu hop voi tu khoa "{keyword}".
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTargets.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="inline-flex size-10 items-center justify-center rounded-lg bg-muted mb-3">
                <item.icon className="size-5" />
              </div>
              <h2 className="font-semibold group-hover:text-primary">{item.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Mở trang
                <IconArrowRight className="size-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
