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
