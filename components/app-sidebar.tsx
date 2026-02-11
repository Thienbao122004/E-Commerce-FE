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
  IconLock,
  IconPackage,
  IconReport,
  IconSearch,
  IconSettings,
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

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Tổng quan",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Quản lý sản phẩm",
      url: "/dashboard/products",
      icon: IconCamera,
      isActive: true,
      items: [
        {
          title: "Tất cả sản phẩm",
          url: "/dashboard/products",
          icon: IconList,
        },
        {
          title: "Sản phẩm nổi bật",
          url: "/dashboard/products/featured",
          icon: IconStar,
        },
        {
          title: "Kho hàng",
          url: "/dashboard/products/inventory",
          icon: IconPackage,
        },
      ],
    },
    {
      title: "Quản lý đơn hàng",
      url: "/dashboard/orders",
      icon: IconFolder,
      items: [
        {
          title: "Tất cả đơn hàng",
          url: "/dashboard/orders",
          icon: IconListDetails,
        },
      ],
    },
    {
      title: "Quản lý tranh chấp",
      url: "/dashboard/disputes",
      icon: IconGavel,
      items: [
        {
          title: "Tất cả tranh chấp",
          url: "/dashboard/disputes",
          icon: IconList,
        },
      ],
    },
    {
      title: "Danh mục và tags",
      url: "/dashboard/categories",
      icon: IconListDetails,
      items: [
        {
          title: "Danh mục",
          url: "/dashboard/categories",
          icon: IconFolderOpen,
        },
        {
          title: "Tags",
          url: "/dashboard/tags",
          icon: IconTag,
        },
      ],
    },
    {
      title: "Quản lý người dùng",
      url: "/dashboard/users",
      icon: IconUsers,
      items: [
        {
          title: "Tất cả người dùng",
          url: "/dashboard/users",
          icon: IconUserSearch,
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Cài đặt",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
    {
      title: "Hỗ trợ",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Tìm kiếm",
      url: "#",
      icon: IconSearch,
    },
  ],
  sellers: [
    {
      name: "Quản lý người bán",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Yêu cầu rút tiền",
      url: "#",
      icon: IconReport,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
        <NavSellers items={data.sellers} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
