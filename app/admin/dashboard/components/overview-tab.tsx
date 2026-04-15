"use client"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardCharts } from "@/components/dashboard-charts"
import { DataTable } from "@/components/data-table"
import { useDashboard } from "@/hooks/use-dashboard"

export function OverviewTab() {
  const {
    stats, activities, shops, products,
    statsLoading, activitiesLoading, shopsLoading, productsLoading,
  } = useDashboard()

  return (
    <div className="flex flex-col gap-6">
      <ChartAreaInteractive stats={stats ?? undefined} />
      <DashboardCharts stats={stats ?? undefined} />
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
  )
}
