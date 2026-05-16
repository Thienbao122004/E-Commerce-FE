"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { IconChevronRight } from "@tabler/icons-react"
import { type Icon } from "@tabler/icons-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  pendingApprovalCount = 0,
  sellerDisputeCount = 0,
  sellerOrderCount = 0,
  unreadChatCount = 0,
  pendingWithdrawalCount = 0,
  adminPendingDisputeCount = 0,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    isActive?: boolean
    items?: {
      title: string
      url: string
      icon?: Icon
    }[]
  }[]
  pendingApprovalCount?: number
  sellerDisputeCount?: number
  sellerOrderCount?: number
  unreadChatCount?: number
  pendingWithdrawalCount?: number
  adminPendingDisputeCount?: number
}) {
  const pathname = usePathname()

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/")

  const isGroupActive = (item: { url: string; items?: { url: string }[] }) =>
    isActive(item.url) || (item.items?.some((sub) => isActive(sub.url)) ?? false)

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) =>
            item.items && item.items.length > 0 ? (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive || isGroupActive(item)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isGroupActive(item)}
                    >
                      {item.icon && <item.icon />}
                      <span className="min-w-0 flex-1 truncate text-left">{item.title}</span>
                      {pendingApprovalCount > 0 && item.items?.some((s) => s.url.includes("pending-approval")) ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: "var(--color-primary)" }}
                          title={`${pendingApprovalCount} sản phẩm cần duyệt`}
                        />
                      ) : null}
                      {adminPendingDisputeCount > 0 && (item.url.includes("disputes") || item.items?.some(s => s.url.includes("disputes"))) ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: "var(--color-primary)" }}
                          title={`${adminPendingDisputeCount} tranh chấp cần xử lý`}
                        />
                      ) : null}
                      {sellerDisputeCount > 0 && (item.url.includes("disputes") || item.items?.some(s => s.url.includes("disputes"))) ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-orange-500"
                          title={`${sellerDisputeCount} khiếu nại cần xử lý`}
                        />
                      ) : null}
                      {sellerOrderCount > 0 && (item.url.includes("orders") || item.items?.some(s => s.url.includes("orders"))) ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-blue-500"
                          title={`${sellerOrderCount} đơn hàng cần xác nhận`}
                        />
                      ) : null}
                      {unreadChatCount > 0 && item.url.includes("chat") ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-red-500"
                          title={`${unreadChatCount} tin nhắn mới`}
                        />
                      ) : null}
                      {pendingWithdrawalCount > 0 && item.url.includes("wallet") ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                          title={`${pendingWithdrawalCount} yêu cầu rút tiền đang chờ`}
                        />
                      ) : null}
                      <IconChevronRight className="shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(subItem.url, subItem.url === item.url)}>
                            <Link
                              href={subItem.url}
                              className="!flex min-w-0 w-full max-w-full items-center gap-2"
                              title={pendingApprovalCount > 0 && subItem.url.includes("pending-approval")
                                ? `${pendingApprovalCount} sản phẩm cần duyệt`
                                : undefined}
                            >
                              {subItem.icon && <subItem.icon className="size-4 shrink-0" />}
                              <span className="min-w-0 flex-1 truncate">{subItem.title}</span>
                              {pendingApprovalCount > 0 && subItem.url.includes("pending-approval") ? (
                                <span
                                  className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none text-white tabular-nums"
                                  style={{ backgroundColor: "var(--color-primary)" }}
                                >
                                  {pendingApprovalCount > 99 ? "99+" : pendingApprovalCount}
                                </span>
                              ) : null}
                              {adminPendingDisputeCount > 0 && subItem.url.includes("disputes") ? (
                                <span
                                  className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none text-white tabular-nums"
                                  style={{ backgroundColor: "var(--color-primary)" }}
                                >
                                  {adminPendingDisputeCount > 99 ? "99+" : adminPendingDisputeCount}
                                </span>
                              ) : null}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url, true)}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {sellerDisputeCount > 0 && item.url.includes("disputes") ? (
                      <span
                        className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none text-white tabular-nums bg-orange-500"
                      >
                        {sellerDisputeCount > 99 ? "99+" : sellerDisputeCount}
                      </span>
                    ) : null}
                    {sellerOrderCount > 0 && item.url.includes("orders") ? (
                      <span
                        className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none text-white tabular-nums bg-blue-500"
                      >
                        {sellerOrderCount > 99 ? "99+" : sellerOrderCount}
                      </span>
                    ) : null}
                    {unreadChatCount > 0 && item.url.includes("chat") ? (
                      <span
                        className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none text-white tabular-nums bg-red-500"
                      >
                        {unreadChatCount > 99 ? "99+" : unreadChatCount}
                      </span>
                    ) : null}
                    {pendingWithdrawalCount > 0 && item.url.includes("wallet") ? (
                      <span
                        className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none text-white tabular-nums bg-emerald-500"
                      >
                        {pendingWithdrawalCount > 99 ? "99+" : pendingWithdrawalCount}
                      </span>
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
