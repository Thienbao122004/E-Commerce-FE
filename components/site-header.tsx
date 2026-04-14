"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useHeaderActions } from "@/hooks/use-header-actions"

const NAV_LABELS: { url: string; title: string }[] = [
  // Admin
  { url: "/admin/dashboard", title: "Tổng quan" },
  { url: "/admin/dashboard/products/featured", title: "Sản phẩm nổi bật" },
  { url: "/admin/dashboard/products/inventory", title: "Kho hàng" },
  { url: "/admin/dashboard/products", title: "Quản lý sản phẩm" },
  { url: "/admin/dashboard/disputes", title: "Quản lý tranh chấp" },
  { url: "/admin/dashboard/categories", title: "Danh mục và tags" },
  { url: "/admin/dashboard/tags", title: "Tags" },
  { url: "/admin/dashboard/materials", title: "Chất liệu" },
  { url: "/admin/dashboard/users", title: "Quản lý người dùng" },
  { url: "/admin/dashboard/settings", title: "Cài đặt" },
  { url: "/admin/dashboard/sellers", title: "Quản lý người bán" },
  { url: "/admin/dashboard/withdrawals", title: "Quản lý rút tiền" },
  { url: "/admin/dashboard/platform-fees", title: "Phí sàn & báo cáo" },
  { url: "/admin/dashboard/platform-fee-config", title: "Cấu hình phí sàn" },

  { url: "/seller/dashboard", title: "Tổng quan" },
  { url: "/seller/products/featured", title: "Sản phẩm nổi bật" },
  { url: "/seller/products/inventory", title: "Kho hàng" },
  { url: "/seller/products/new", title: "Thêm sản phẩm" },
  { url: "/seller/products", title: "Quản lý sản phẩm" },
  { url: "/seller/orders", title: "Đơn hàng" },
  { url: "/seller/disputes", title: "Tranh chấp" },
  { url: "/seller/reviews", title: "Đánh giá" },
  { url: "/seller/wallet", title: "Ví tiền" },
  { url: "/seller/ai-suggestions", title: "Gợi ý AI" },
  { url: "/seller/chat", title: "Tin nhắn" },
  { url: "/seller/profile", title: "Hồ sơ cửa hàng" },
  { url: "/seller/settings", title: "Cài đặt" },
  { url: "/seller/categories", title: "Danh mục" },
  { url: "/seller/tags", title: "Tags" },
  { url: "/seller/users", title: "Người dùng" },
]

function getPageTitle(pathname: string): string {
  const sorted = [...NAV_LABELS].sort((a, b) => b.url.length - a.url.length)
  const match = sorted.find((item) => pathname === item.url || pathname.startsWith(item.url + "/"))
  return match?.title ?? "Dashboard"
}

export function SiteHeader() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const { actions } = useHeaderActions()
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}

