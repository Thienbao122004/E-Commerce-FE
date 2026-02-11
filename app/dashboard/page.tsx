"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useDashboard } from "@/hooks/use-dashboard"

export default function Page() {
  const {
    stats,
    activities,
    shops,
    products,
    statsLoading,
    activitiesLoading,
    shopsLoading,
    productsLoading,
  } = useDashboard()

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards stats={stats ?? undefined} loading={statsLoading} />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive stats={stats ?? undefined} />
              </div>
              <DataTable
                products={products}
                shops={shops}
                activities={activities}
                stats={stats}
                productsLoading={productsLoading}
                shopsLoading={shopsLoading}
                activitiesLoading={activitiesLoading}
                statsLoading={statsLoading}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
