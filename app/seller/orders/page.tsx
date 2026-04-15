"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { IconRefresh } from "@tabler/icons-react"
import { useSellerOrders } from "@/hooks/use-seller-orders"
import { OrderStatus } from "@/types/seller-dashboard"
import type { SellerOrder } from "@/types/seller-dashboard"
import { OrderStats } from "./_components/order-stats"
import { OrderTable } from "./_components/order-table"
import FilterBar from "@/components/common/filter-bar"
import type { FilterConfig } from "@/components/common/filter-bar"
import { useDebounce } from "@/hooks/use-debounce"
import { useTableData } from "@/hooks/use-table-data"
import { getNextSort } from "@/components/common/table-sorting"
import type { SortConfig } from "@/components/common/table-sorting"
import { SetHeaderActions } from "@/hooks/use-header-actions"

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
  const [sort, setSort] = useState<SortConfig | null>(null)

  const debouncedSearch = useDebounce(searchInput)
  useEffect(() => { setSearch(debouncedSearch) }, [debouncedSearch, setSearch])

  const sortAccessor = (row: SellerOrder, key: string): string | number => {
    switch (key) {
      case "customerName": return row.customerName ?? ""
      case "createdAt": return row.createdAt ?? ""
      case "totalAmount": return row.totalAmount
      case "status": return row.status
      default: return ""
    }
  }

  const { filtered: sortedOrders } = useTableData<SellerOrder>({
    data: orders,
    sort,
    sortAccessor,
  })

  const filters: FilterConfig[] = [
    {
      key: "status",
      label: "Trạng thái",
      value: params.status !== undefined ? String(params.status) : "all",
      onChange: (v) => setStatus(v === "all" ? undefined : Number(v)),
      width: "w-[180px]",
      options: [
        { value: "all", label: "Tất cả trạng thái" },
        { value: String(OrderStatus.PendingPayment), label: "Chờ thanh toán" },
        { value: String(OrderStatus.Confirmed), label: "Đã xác nhận" },
        { value: String(OrderStatus.Processing), label: "Đang chuẩn bị" },
        { value: String(OrderStatus.Shipping), label: "Đang giao hàng" },
        { value: String(OrderStatus.Delivered), label: "Đã giao hàng" },
        { value: String(OrderStatus.Completed), label: "Hoàn thành" },
        { value: String(OrderStatus.Cancelled), label: "Đã hủy" },
      ],
    },
  ]

  const handleInlineStatusUpdate = async (orderId: string, newStatus: number) => {
    await updateStatus(orderId, { status: newStatus })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 min-w-0">
      <SetHeaderActions>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
          <IconRefresh className="mr-1.5 size-4" />Làm mới
        </Button>
      </SetHeaderActions>

      <OrderStats orders={orders} totalCount={totalCount} loading={loading} />

      <FilterBar
        searchPlaceholder="Tìm theo mã đơn hoặc tên khách hàng..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearch={() => setSearch(searchInput)}
        filters={filters}
      />

      <OrderTable
        orders={sortedOrders}
        loading={loading}
        totalCount={totalCount}
        totalPages={totalPages}
        page={params.page}
        pageSize={params.pageSize}
        sort={sort}
        onSort={(key) => setSort(getNextSort(sort, key))}
        actionLoading={actionLoading}
        onUpdateStatus={handleInlineStatusUpdate}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
