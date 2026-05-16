"use client"

import * as React from "react"
import {
  IconBrain,
  IconBuildingStore,
  IconDashboard,
  IconDatabase,
  IconFolderOpen,
  IconGavel,
  IconHelp,
  IconInnerShadowTop,
  IconClipboardCheck,
  IconList,
  IconListDetails,
  IconMessage2,
  IconPackage,
  IconPercentage,
  IconPlus,
  IconReport,
  IconSearch,
  IconSettings,
  IconShoppingBag,
  IconShoppingCart,
  IconStar,
  IconStarFilled,
  IconTag,
  IconUser,
  IconUsers,
  IconUserSearch,
  IconWallet,
} from "@tabler/icons-react"

import { NavSellers } from "@/components/nav-sellers"
import { NavMain } from "@/components/nav-main"
import { useAdminPendingProductCount } from "@/hooks/use-admin-pending-product-count"
import { useSellerPendingDisputeCount } from "@/hooks/use-seller-pending-dispute-count"
import { useSellerPendingOrderCount } from "@/hooks/use-seller-pending-order-count"
import { useSellerUnreadChatCount } from "@/hooks/use-seller-unread-chat-count"
import { useSellerPendingWithdrawalCount } from "@/hooks/use-seller-pending-withdrawal-count"
import { useAdminPendingDisputeCount } from "@/hooks/use-admin-pending-dispute-count"
import { useAdminPendingWithdrawalCount } from "@/hooks/use-admin-pending-withdrawal-count"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { SellerPlatformFeeFooter } from "@/components/seller/seller-platform-fee-footer"
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

type NavSubItem = {
  title: string
  url: string
  icon: typeof IconDashboard
  roles?: string[]
}

type NavItem = {
  title: string
  url: string
  icon: typeof IconDashboard
  roles?: string[]
  items?: NavSubItem[]
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    title: "Tổng quan",
    url: "/dashboard",
    icon: IconDashboard,
    roles: ['admin', 'seller'],
  },
  {
    title: "Quản lý sản phẩm",
    url: "/dashboard/products",
    icon: IconShoppingBag,
    roles: ['admin', 'seller'],
    items: [
      { title: "Tất cả sản phẩm", url: "/dashboard/products", icon: IconList, roles: ['admin', 'seller'] },
      { title: "Chờ duyệt", url: "/dashboard/products/pending-approval", icon: IconClipboardCheck, roles: ['admin'] },
      { title: "Thêm mới", url: "/dashboard/products/new", icon: IconPlus, roles: ['seller'] },
      { title: "Sản phẩm nổi bật", url: "/dashboard/products/featured", icon: IconStar, roles: ['admin'] },
      { title: "Kho hàng", url: "/dashboard/products/inventory", icon: IconPackage, roles: ['admin', 'seller'] },
    ],
  },
  {
    title: "Đơn hàng",
    url: "/dashboard/orders",
    icon: IconShoppingCart,
    roles: ['seller'],
    items: [
      { title: "Tất cả đơn hàng", url: "/dashboard/orders", icon: IconListDetails, roles: ['seller'] },
    ],
  },
  {
    title: "AI Gợi ý",
    url: "/dashboard/ai-suggestions",
    icon: IconBrain,
    roles: ['seller'],
  },
  {
    title: "Đánh giá & Nhận xét",
    url: "/dashboard/reviews",
    icon: IconStarFilled,
    roles: ['seller'],
  },
  {
    title: "Chat với khách",
    url: "/dashboard/chat",
    icon: IconMessage2,
    roles: ['seller'],
  },
  {
    title: "Ví & Rút tiền",
    url: "/dashboard/wallet",
    icon: IconWallet,
    roles: ['seller'],
  },
  {
    title: "Khiếu nại",
    url: "/dashboard/disputes",
    icon: IconGavel,
    roles: ['seller'],
  },
  {
    title: "Hồ sơ tài khoản",
    url: "/dashboard/account",
    icon: IconUser,
    roles: ['seller'],
  },
  {
    title: "Hồ sơ cửa hàng",
    url: "/profile",
    icon: IconBuildingStore,
    roles: ['seller'],
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
    title: "Danh mục, Tags & Chất liệu",
    url: "/dashboard/categories",
    icon: IconListDetails,
    roles: ['admin'],
    items: [
      { title: "Danh mục", url: "/dashboard/categories", icon: IconFolderOpen },
      { title: "Tags", url: "/dashboard/tags", icon: IconTag },
      { title: "Chất liệu", url: "/dashboard/materials", icon: IconPackage },
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
  { name: "Quản lý người bán", url: "/admin/dashboard/sellers", icon: IconDatabase },
  { name: "Rút tiền người bán", url: "/admin/dashboard/withdrawals", icon: IconReport },
  { name: "Rút tiền khách hàng", url: "/admin/dashboard/customer-withdrawals", icon: IconWallet },
  { name: "Phí sàn & báo cáo", url: "/admin/dashboard/platform-fees", icon: IconPercentage },
  { name: "Cấu hình phí sàn", url: "/admin/dashboard/platform-fee-config", icon: IconSettings },
]

const NAV_SECONDARY = [
  { title: "Hỗ trợ", url: "/dashboard/support", icon: IconHelp },
  { title: "Tìm kiếm", url: "/dashboard/search", icon: IconSearch },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { role } = useAuth()
  const { count: pendingApprovalCount } = useAdminPendingProductCount(role === "admin")
  const { count: sellerDisputeCount } = useSellerPendingDisputeCount(role === "seller")
  const { count: sellerOrderCount } = useSellerPendingOrderCount(role === "seller")
  const { count: unreadChatCount } = useSellerUnreadChatCount(role === "seller")
  const { count: pendingWithdrawalCount } = useSellerPendingWithdrawalCount(role === "seller")
  
  const { count: adminPendingDisputeCount } = useAdminPendingDisputeCount(role === "admin")
  const { sellerCount: adminPendingSellerWithdrawCount, customerCount: adminPendingCustomerWithdrawCount } = useAdminPendingWithdrawalCount(role === "admin")

  const prefixUrl = (url: string, basePath: string) => {
    if (url.startsWith('/dashboard') || url.startsWith('/profile')) {
      if (role === 'seller') {
        if (url === '/dashboard') return `${basePath}/dashboard`
        if (url.startsWith('/dashboard/')) return `${basePath}${url.replace('/dashboard', '')}`
        return `${basePath}${url}`
      }
      return `${basePath}${url}`
    }
    return url
  }

  const visibleNavItems = ALL_NAV_ITEMS.filter(item =>
    !item.roles || (role && item.roles.includes(role))
  ).map(item => {
    const basePath = role === 'admin' ? '/admin' : (role === 'seller' ? '/seller' : '')
    return {
      ...item,
      url: prefixUrl(item.url, basePath),
      items: item.items
        ?.filter(subItem => !subItem.roles || (role && subItem.roles.includes(role)))
        .map(subItem => ({
          ...subItem,
          url: prefixUrl(subItem.url, basePath),
        }))
    }
  })

  const secondaryNavItems = NAV_SECONDARY.map(item => {
    const basePath = role === 'admin' ? '/admin' : (role === 'seller' ? '/seller' : '')
    return {
      ...item,
      url: prefixUrl(item.url, basePath),
    }
  })

  const showSellers = role === 'admin'

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex  gap-2 p-1.5">
              <IconInnerShadowTop className="!size-5 mt-0.5" />
              <span className="text-base font-semibold">EcomViet</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain 
          items={visibleNavItems} 
          pendingApprovalCount={pendingApprovalCount} 
          sellerDisputeCount={sellerDisputeCount}
          sellerOrderCount={sellerOrderCount}
          unreadChatCount={unreadChatCount}
          pendingWithdrawalCount={pendingWithdrawalCount}
          adminPendingDisputeCount={adminPendingDisputeCount}
        />
        {showSellers && (
          <NavSellers 
            items={SELLERS_ITEMS} 
            adminPendingSellerWithdrawCount={adminPendingSellerWithdrawCount}
            adminPendingCustomerWithdrawCount={adminPendingCustomerWithdrawCount}
          />
        )}
        <NavSecondary items={secondaryNavItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <SellerPlatformFeeFooter />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
