"use client"

import { SellerStatsCards } from "./_components/seller-stats-cards"
import { SellerRevenueChart } from "./_components/seller-revenue-chart"
import { SellerTopProducts } from "./_components/seller-top-products"
import { SellerRecentOrders } from "./_components/seller-recent-orders"
import { SellerDashboardTable } from "./_components/seller-dashboard-table"
import { useSellerDashboard } from "@/hooks/use-seller-dashboard"

export default function SellerDashboardPage() {
  const {
    wallet,
    products,
    orders,
    stats,
    walletLoading,
    productsLoading,
    ordersLoading,
  } = useSellerDashboard()

  const loading = walletLoading || productsLoading || ordersLoading

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SellerStatsCards
          stats={stats}
          wallet={wallet}
          orders={orders}
          loading={loading}
        />

        <SellerRevenueChart
          wallet={wallet}
          products={products}
          loading={loading}
        />

        <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
          <SellerTopProducts products={products} loading={productsLoading} />
          <SellerRecentOrders orders={orders} loading={ordersLoading} />
        </div>

        <SellerDashboardTable
          products={products}
          orders={orders}
          productsLoading={productsLoading}
          ordersLoading={ordersLoading}
        />
      </div>
    </div>
  )
}
