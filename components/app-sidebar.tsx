"use client"

import * as React from "react"
import {
  IconCamera,
  IconDashboard,
  IconDatabase,
  IconFolder,
  IconFolderOpen,
  IconGavel,
  IconHelp,
  IconInnerShadowTop,
  IconList,
  IconListDetails,
  IconPackage,
  IconReport,
  IconSearch,
  IconStar,
  IconTag,
  IconUsers,
  IconUserSearch,
} from "@tabler/icons-react"

import { NavSellers } from "@/components/nav-sellers"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"

const ALL_NAV_ITEMS = [
  {
    title: "Tổng quan",
    url: "/dashboard",
    icon: IconDashboard,
    roles: ['admin', 'seller'],
  },
  {
    title: "Quản lý sản phẩm",
    url: "/dashboard/products",
    icon: IconCamera,
    roles: ['admin', 'seller'],
    items: [
      { title: "Tất cả sản phẩm", url: "/dashboard/products", icon: IconList },
      { title: "Sản phẩm nổi bật", url: "/dashboard/products/featured", icon: IconStar },
      { title: "Kho hàng", url: "/dashboard/products/inventory", icon: IconPackage },
    ],
  },
  {
    title: "Quản lý đơn hàng",
    url: "/dashboard/orders",
    icon: IconFolder,
    roles: ['admin', 'seller'],
    items: [
      { title: "Tất cả đơn hàng", url: "/dashboard/orders", icon: IconListDetails },
    ],
  },
  {
    title: "Quản lý tranh chấp",
    url: "/dashboard/disputes",
    icon: IconGavel,
    roles: ['admin'],
    items: [
      { title: "Tất cả tranh chấp", url: "/dashboard/disputes", icon: IconList },
    ],
  },
  {
    title: "Danh mục và tags",
    url: "/dashboard/categories",
    icon: IconListDetails,
    roles: ['admin'],
    items: [
      { title: "Danh mục", url: "/dashboard/categories", icon: IconFolderOpen },
      { title: "Tags", url: "/dashboard/tags", icon: IconTag },
    ],
  },
  {
    title: "Quản lý người dùng",
    url: "/dashboard/users",
    icon: IconUsers,
    roles: ['admin'],
    items: [
      { title: "Tất cả người dùng", url: "/dashboard/users", icon: IconUserSearch },
    ],
  },
]

const SELLERS_ITEMS = [
  { name: "Quản lý người bán", url: "#", icon: IconDatabase },
  { name: "Yêu cầu rút tiền", url: "#", icon: IconReport },
]

const NAV_SECONDARY = [
  { title: "Hỗ trợ", url: "#", icon: IconHelp },
  { title: "Tìm kiếm", url: "#", icon: IconSearch },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { role } = useAuth()

  const visibleNavItems = ALL_NAV_ITEMS.filter(item =>
    !item.roles || (role && item.roles.includes(role))
  ).map(item => {
    const basePath = role === 'admin' ? '/admin' : (role === 'seller' ? '/seller' : '')
    return {
      ...item,
      url: item.url.startsWith('/dashboard') ? `${basePath}${item.url}` : item.url,
      items: item.items?.map(subItem => ({
        ...subItem,
        url: subItem.url.startsWith('/dashboard') ? `${basePath}${subItem.url}` : subItem.url,
      }))
    }
  })

  const secondaryNavItems = NAV_SECONDARY.map(item => {
    const basePath = role === 'admin' ? '/admin' : (role === 'seller' ? '/seller' : '')
    return {
      ...item,
      url: item.url.startsWith('/dashboard') ? `${basePath}${item.url}` : item.url,
    }
  })

  const showSellers = role === 'admin'

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Shopio</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleNavItems} />
        {showSellers && <NavSellers items={SELLERS_ITEMS} />}
        <NavSecondary items={secondaryNavItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
