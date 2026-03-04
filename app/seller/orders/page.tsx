"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconRefresh, IconSearch } from "@tabler/icons-react"
import { useSellerOrders } from "@/hooks/use-seller-orders"
import { OrderStatus } from "@/types/seller-dashboard"
import { OrderStats } from "./_components/order-stats"
import { OrderTable } from "./_components/order-table"
import { OrderStatusDialog } from "./_components/order-status-dialog"

const STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Chờ xác nhận", value: String(OrderStatus.Pending) },
  { label: "Đã xác nhận", value: String(OrderStatus.Confirmed) },
  { label: "Đang giao", value: String(OrderStatus.Shipping) },
  { label: "Đã giao", value: String(OrderStatus.Delivered) },
  { label: "Đã hủy", value: String(OrderStatus.Cancelled) },
]

export default function SellerOrdersPage() {
  const {
    orders,
    totalCount,
    loading,
    actionLoading,
    params,
    totalPages,
    setPage,
    setPageSize,
    setStatus,
    setSearch,
    updateStatus,
    reload,
  } = useSellerOrders()

  const [searchInput, setSearchInput] = useState("")
  const [statusDialog, setStatusDialog] = useState<{ orderId: string; currentStatus: number } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(val), 400)
  }

  const handleStatusUpdate = async (newStatus: number, note: string) => {
    if (!statusDialog) return
    const ok = await updateStatus(statusDialog.orderId, { status: newStatus, note: note || undefined })
    if (ok) setStatusDialog(null)
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 lg:gap-6 lg:p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý đơn hàng</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi và quản lý đơn hàng của cửa hàng
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
          <IconRefresh className={`mr-1.5 size-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <OrderStats orders={orders} totalCount={totalCount} loading={loading} />

      {/* Orders Table Section */}
      <Card>
        <CardContent className="p-4 lg:p-5">
          {/* Filters */}
          <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo Mã ĐH hoặc Tên khách..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={params.status !== undefined ? String(params.status) : "all"}
              onValueChange={(val) => setStatus(val === "all" ? undefined : Number(val))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table + Pagination */}
          <OrderTable
            orders={orders}
            loading={loading}
            totalCount={totalCount}
            totalPages={totalPages}
            page={params.page}
            pageSize={params.pageSize}
            onOpenStatusDialog={(orderId, currentStatus) => setStatusDialog({ orderId, currentStatus })}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* Status Dialog */}
      {statusDialog && (
        <OrderStatusDialog
          open={!!statusDialog}
          onOpenChange={(v) => { if (!v) setStatusDialog(null) }}
          orderId={statusDialog.orderId}
          currentStatus={statusDialog.currentStatus}
          loading={actionLoading}
          onConfirm={handleStatusUpdate}
        />
      )}
    </div>
  )
}
