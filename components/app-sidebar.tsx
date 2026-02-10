"use client"

import * as React from "react"
import {
  IconCamera,
  IconDashboard,
  IconDatabase,
  IconFolder,
  IconGavel,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
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
      url: "#",
      icon: IconDashboard,
    },
    {
      title: "Quản lý sản phẩm",
      url: "#",
      icon: IconCamera,
      isActive: true,
      items: [
        {
          title: "Tất cả sản phẩm",
          url: "#",
        },
        {
          title: "Thêm sản phẩm mới",
          url: "#",
        },
        {
          title: "Sản phẩm nổi bật",
          url: "#",
        },
        {
          title: "Kho hàng",
          url: "#",
        },
      ],
    },
    {
      title: "Quản lý đơn hàng",
      url: "#",
      icon: IconFolder,
      items: [
        {
          title: "Tất cả đơn hàng",
          url: "#",
        },
      ],
    },
    {
      title: "Quản lý tranh chấp",
      url: "#",
      icon: IconGavel,
      items: [
        {
          title: "Tất cả tranh chấp",
          url: "#",
        },
        {
          title: "Duyệt hoàn tiền",
          url: "#",
        },
        {
          title: "Từ chối tranh chấp",
          url: "#",
        },
      ],
    },
    {
      title: "Danh mục và tags",
      url: "#",
      icon: IconListDetails,
      items: [
        {
          title: "Danh mục",
          url: "#",
        },
        {
          title: "Tags",
          url: "#",
        },
        {
          title: "Thuộc tính",
          url: "#",
        },
      ],
    },
    {
      title: "Quản lý người dùng",
      url: "#",
      icon: IconUsers,
    },
  ],
  navSecondary: [
    {
      title: "Cài đặt",
      url: "#",
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
