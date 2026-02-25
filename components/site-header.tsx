"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const NAV_LABELS: { url: string; title: string }[] = [
  { url: "/admin/dashboard", title: "Tổng quan" },
  { url: "/admin/dashboard/products/featured", title: "Sản phẩm nổi bật" },
  { url: "/admin/dashboard/products/inventory", title: "Kho hàng" },
  { url: "/admin/dashboard/products", title: "Quản lý sản phẩm" },
  { url: "/admin/dashboard/orders", title: "Quản lý đơn hàng" },
  { url: "/admin/dashboard/disputes", title: "Quản lý tranh chấp" },
  { url: "/admin/dashboard/categories", title: "Danh mục và tags" },
  { url: "/admin/dashboard/tags", title: "Tags" },
  { url: "/admin/dashboard/users", title: "Quản lý người dùng" },
  { url: "/admin/dashboard/settings", title: "Cài đặt" },
]

function getPageTitle(pathname: string): string {
  const sorted = [...NAV_LABELS].sort((a, b) => b.url.length - a.url.length)
  const match = sorted.find((item) => pathname === item.url || pathname.startsWith(item.url + "/"))
  return match?.title ?? "Dashboard"
}

export function SiteHeader() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}
