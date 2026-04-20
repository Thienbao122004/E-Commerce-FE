"use client"

import * as React from "react"
import {
  IconPackage,
  IconBuildingStore,
  IconActivity,
  IconShoppingCart,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type {
  DashboardStats,
  RecentActivity,
  TopProduct,
  TopShop,
} from "@/types/dashboard"
import {
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"
import { formatNumberVN as fmt, formatPriceVND as currency } from "@/lib/formatters"

type Props = {
  products: TopProduct[]
  shops: TopShop[]
  activities: RecentActivity[]
  stats: DashboardStats | null
  productsLoading: boolean
  shopsLoading: boolean
  activitiesLoading: boolean
  statsLoading: boolean
}

const timeAgo = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Vừa xong"
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  const days = Math.floor(hrs / 24)
  return `${days} ngày trước`
}

const productColumns: ColumnDef<TopProduct & { rank: number }>[] = [
  {
    accessorKey: "rank",
    header: "#",
    cell: ({ row }) => (
      <span className="text-muted-foreground font-medium">{row.original.rank}</span>
    ),
  },
  {
    accessorKey: "name",
    header: "Tên sản phẩm",
    cell: ({ row }) => (
      <span className="font-medium max-w-[200px] truncate block">
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: "shopName",
    header: "Cửa hàng",
    meta: {
      headerClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell",
    },
    cell: ({ row }) => (
      <Badge variant="outline" className="max-w-[140px] truncate text-muted-foreground sm:max-w-none">
        {row.original.shopName}
      </Badge>
    ),
  },
  {
    accessorKey: "totalSold",
    header: () => <div className="text-right">Đã bán</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">{fmt(row.original.totalSold)}</div>
    ),
  },
  {
    accessorKey: "revenue",
    header: () => <div className="text-right">Doanh thu</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium text-green-600 dark:text-green-400">
        {currency(row.original.revenue)}
      </div>
    ),
  },
]

const shopColumns: ColumnDef<TopShop & { rank: number }>[] = [
  {
    accessorKey: "rank",
    header: "#",
    cell: ({ row }) => (
      <span className="text-muted-foreground font-medium">{row.original.rank}</span>
    ),
  },
  {
    accessorKey: "name",
    header: "Tên cửa hàng",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "totalOrders",
    header: () => <div className="text-right">Tổng đơn hoàn thành</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">{fmt(row.original.totalOrders)}</div>
    ),
  },
  {
    accessorKey: "totalRevenue",
    header: () => <div className="text-right">Tổng doanh thu</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium text-green-600 dark:text-green-400">
        {currency(row.original.totalRevenue)}
      </div>
    ),
  },
]

const activityColumns: ColumnDef<RecentActivity>[] = [
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={
          row.original.type === "Order"
            ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
        }
      >
        {row.original.type === "Order" ? "Đơn hàng" : "Cửa hàng"}
      </Badge>
    ),
  },
  {
    accessorKey: "description",
    header: "Mô tả",
    cell: ({ row }) => (
      <span className="max-w-[200px] truncate block sm:max-w-[280px] md:max-w-[320px]">
        {row.original.description}
      </span>
    ),
  },
  {
    accessorKey: "timestamp",
    header: () => <div className="text-right">Thời gian</div>,
    cell: ({ row }) => (
      <div className="text-muted-foreground text-right text-sm">
        {timeAgo(row.original.timestamp)}
      </div>
    ),
  },
]

type OrderOverviewRow = { label: string; value: number; color: string }

const orderOverviewColumns: ColumnDef<OrderOverviewRow>[] = [
  {
    accessorKey: "label",
    header: "Trạng thái",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 rounded-full"
          style={{ background: row.original.color }}
        />
        <span className="font-medium">{row.original.label}</span>
      </div>
    ),
  },
  {
    accessorKey: "value",
    header: () => <div className="text-right">Số lượng</div>,
    cell: ({ row }) => (
      <div className="text-right font-semibold tabular-nums">
        {fmt(row.original.value)}
      </div>
    ),
  },
]

// ---------- Skeleton rows ----------
function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}>
              <span className="bg-muted inline-block h-4 w-20 animate-pulse rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ---------- Generic paginated table ----------
function PaginatedTable<T>({
  data,
  columns,
  loading,
  tableClassName,
}: {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  loading: boolean
  /** e.g. min-w-[560px] để cuộn ngang gọn trên mobile */
  tableClassName?: string
}) {
  const table = useReactTable({
    data,
    columns: columns as ColumnDef<T>[],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
        <Table className={tableClassName ?? "min-w-[560px]"}>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    colSpan={h.colSpan}
                    className={
                      (h.column.columnDef.meta as { headerClassName?: string } | undefined)
                        ?.headerClassName
                    }
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <SkeletonRows cols={columns.length} />
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        (cell.column.columnDef.meta as { cellClassName?: string } | undefined)
                          ?.cellClassName
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không có dữ liệu.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!loading && data.length > 10 && (
        <div className="flex flex-col-reverse gap-2 px-0 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-2">
          <span className="text-muted-foreground text-center text-sm sm:text-right">
            Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Trang trước"
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Trang sau"
            >
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function DataTable({
  products,
  shops,
  activities,
  stats,
  productsLoading,
  shopsLoading,
  activitiesLoading,
  statsLoading,
}: Props) {
  const rankedProducts = React.useMemo(
    () => products.map((p, i) => ({ ...p, rank: i + 1 })),
    [products]
  )

  const rankedShops = React.useMemo(
    () => shops.map((s, i) => ({ ...s, rank: i + 1 })),
    [shops]
  )

  const orderOverview: OrderOverviewRow[] = React.useMemo(() => {
    if (!stats) return []
    const o = stats.orders
    return [
      { label: "Tổng đơn hàng", value: o.total, color: "#6366f1" },
      { label: "Chờ (TT/XN)", value: o.pending, color: "#f59e0b" },
      { label: "Đang xử lý", value: o.processing, color: "#3b82f6" },
      { label: "Đã xác nhận", value: o.confirmed ?? 0, color: "#0ea5e9" },
      { label: "Đã giao", value: o.delivered ?? 0, color: "#14b8a6" },
      { label: "Hoàn thành", value: o.completed, color: "#22c55e" },
      { label: "Đã hủy", value: o.cancelled, color: "#ef4444" },
      { label: "Hoàn tiền", value: o.refunded ?? 0, color: "#78716c" },
      { label: "Đơn hôm nay", value: o.todayOrders, color: "#8b5cf6" },
      { label: "Đơn tháng này", value: o.thisMonthOrders, color: "#06b6d4" },
    ]
  }, [stats])

  return (
    <Tabs defaultValue="products" className="w-full min-w-0 flex-col justify-start gap-6">
      <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-start sm:justify-between lg:px-6">
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 flex h-auto w-full min-w-0 shrink flex-wrap justify-start gap-1 p-1 sm:w-auto">
          <TabsTrigger value="products" className="gap-1.5">
            <IconPackage className="size-4" />
            <span className="hidden sm:inline">Sản phẩm bán chạy</span>
            <span className="sm:hidden">SP bán chạy</span>
            {!productsLoading && (
              <Badge variant="secondary">{products.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="shops" className="gap-1.5">
            <IconBuildingStore className="size-4" />
            <span className="hidden sm:inline">Shop nổi bật</span>
            <span className="sm:hidden">Top Shop</span>
            {!shopsLoading && (
              <Badge variant="secondary">{shops.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activities" className="gap-1.5">
            <IconActivity className="size-4" />
            <span className="hidden sm:inline">Hoạt động gần đây</span>
            <span className="sm:hidden">Hoạt động</span>
            {!activitiesLoading && (
              <Badge variant="secondary">{activities.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <IconShoppingCart className="size-4" />
            <span className="hidden sm:inline">Tổng quan đơn hàng</span>
            <span className="sm:hidden">Đơn hàng</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="products" className="mt-0 min-w-0 px-4 lg:px-6">
        <PaginatedTable
          data={rankedProducts}
          columns={productColumns}
          loading={productsLoading}
          tableClassName="min-w-[520px]"
        />
      </TabsContent>

      <TabsContent value="shops" className="mt-0 min-w-0 px-4 lg:px-6">
        <PaginatedTable
          data={rankedShops}
          columns={shopColumns}
          loading={shopsLoading}
          tableClassName="min-w-[520px]"
        />
      </TabsContent>

      <TabsContent value="activities" className="mt-0 min-w-0 px-4 lg:px-6">
        <PaginatedTable
          data={activities}
          columns={activityColumns}
          loading={activitiesLoading}
          tableClassName="min-w-[520px]"
        />
      </TabsContent>

      <TabsContent value="orders" className="mt-0 min-w-0 px-4 lg:px-6">
        <PaginatedTable
          data={orderOverview}
          columns={orderOverviewColumns}
          loading={statsLoading}
          tableClassName="min-w-[280px]"
        />
      </TabsContent>
    </Tabs>
  )
}
