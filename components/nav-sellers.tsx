"use client"

import {
  IconDots,
  IconFolder,
  IconShare3,
  IconTrash,
  type Icon,
} from "@tabler/icons-react"
import Link from "next/link"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavSellers({
  items,
  adminPendingSellerWithdrawCount = 0,
  adminPendingCustomerWithdrawCount = 0,
}: {
  items: {
    name: string
    url: string
    icon: Icon
  }[]
  adminPendingSellerWithdrawCount?: number
  adminPendingCustomerWithdrawCount?: number
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Người bán</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link href={item.url}>
                <item.icon />
                <span className="flex-1 min-w-0 truncate">{item.name}</span>
                {item.url === "/admin/dashboard/withdrawals" && adminPendingSellerWithdrawCount > 0 && (
                  <span
                    className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none text-white tabular-nums"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {adminPendingSellerWithdrawCount > 99 ? "99+" : adminPendingSellerWithdrawCount}
                  </span>
                )}
                {item.url === "/admin/dashboard/customer-withdrawals" && adminPendingCustomerWithdrawCount > 0 && (
                  <span
                    className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none text-white tabular-nums"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {adminPendingCustomerWithdrawCount > 99 ? "99+" : adminPendingCustomerWithdrawCount}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
