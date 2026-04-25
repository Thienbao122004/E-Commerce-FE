"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconPackage, IconShoppingCart, IconTrendingUp } from "@tabler/icons-react"
import { OrderStatus, OrderStatusLabels, ProductStatus } from "@/types/seller-dashboard"
import type { SellerOrder, SellerProduct } from "@/types/seller-dashboard"
import FilterBar from "@/components/common/filter-bar"
import type { FilterConfig } from "@/components/common/filter-bar"
import TablePagination from "@/components/common/table-pagination"
import { SortableTableHead, getNextSort } from "@/components/common/table-sorting"
import type { SortConfig } from "@/components/common/table-sorting"
import { useTableData } from "@/hooks/use-table-data"
import { formatPriceVND as currency } from "@/lib/formatters"

const PAGE_SIZE = 10

const orderStatusColors: Record<number, string> = {
  [OrderStatus.PendingPayment]: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  [OrderStatus.PendingConfirmation]: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  [OrderStatus.Confirmed]: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  [OrderStatus.Processing]: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  [OrderStatus.Shipping]: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  [OrderStatus.Delivered]: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  [OrderStatus.Completed]: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  [OrderStatus.Cancelled]: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  [OrderStatus.Refunded]: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function ProductsTab({ products, loading }: { products: SellerProduct[]; loading: boolean }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sort, setSort] = useState<SortConfig | null>(null)
  const [page, setPage] = useState(1)

  const sortAccessor = (row: SellerProduct, key: string): string | number => {
    switch (key) {
      case "name": return row.name ?? ""
      case "basePrice": return row.basePrice
      case "totalStock": return row.totalStock ?? 0
      default: return ""
    }
  }

  const { filtered } = useTableData<SellerProduct>({
    data: products,
    search,
    searchKeys: ["name", "categoryName"],
    filters: statusFilter === "all" ? [] : [
      { key: "status", value: statusFilter, match: (row) => (row as SellerProduct).status },
    ],
    sort,
    sortAccessor,
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const filters: FilterConfig[] = [
    {
      key: "status",
      label: "Trạng thái",
      value: statusFilter,
      onChange: (v) => { setStatusFilter(v); setPage(1) },
      width: "w-[160px]",
      options: [
        { value: "all", label: "Tất cả trạng thái" },
        { value: String(ProductStatus.Active), label: "Đang bán" },
        { value: String(ProductStatus.Draft), label: "Nháp" },
        { value: String(ProductStatus.Hidden), label: "Đã ẩn" },
        { value: String(ProductStatus.PendingApproval), label: "Chờ duyệt" },
        { value: String(ProductStatus.OutOfStock), label: "Hết hàng" },
        { value: String(ProductStatus.Removed), label: "Đã gỡ" },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      <FilterBar
        searchPlaceholder="Tìm theo tên sản phẩm..."
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onSearch={() => {}}
        filters={filters}
      />

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-10 text-center">STT</TableHead>
              <TableHead className="w-[50px]">Ảnh</TableHead>
              <SortableTableHead sortKey="name" currentSort={sort} onSort={(k) => { setSort(getNextSort(sort, k)); setPage(1) }}>Tên sản phẩm</SortableTableHead>
              <SortableTableHead sortKey="basePrice" currentSort={sort} onSort={(k) => { setSort(getNextSort(sort, k)); setPage(1) }}>Giá</SortableTableHead>
              <SortableTableHead sortKey="totalStock" currentSort={sort} onSort={(k) => { setSort(getNextSort(sort, k)); setPage(1) }}>Tồn kho</SortableTableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton cols={7} />
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                  Không có sản phẩm nào
                </TableCell>
              </TableRow>
            ) : (
              paged.map((p, i) => (
                <TableRow key={p.id} className="hover:bg-muted/30">
                  <TableCell className="text-center text-sm text-muted-foreground tabular-nums">
                    {(page - 1) * PAGE_SIZE + i + 1}
                  </TableCell>
                  <TableCell>
                    <div className="size-9 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {p.images?.[0]?.imageUrl ? (
                        <img src={p.images[0].imageUrl} alt={p.name} className="size-full object-cover" />
                      ) : (
                        <IconPackage className="size-4 text-muted-foreground/50" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm max-w-[180px]">
                    <p className="truncate">{p.name}</p>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums font-medium">{currency(p.basePrice)}</TableCell>
                  <TableCell className={`text-sm tabular-nums ${(p.totalStock ?? 0) === 0 ? "text-red-500 font-semibold" : (p.totalStock ?? 0) <= 10 ? "text-orange-500 font-semibold" : ""}`}>
                    {p.totalStock ?? 0}
                  </TableCell>
                  <TableCell>
                    {p.categoryName ? (
                      <span className="text-xs rounded-md bg-muted px-1.5 py-0.5">{p.categoryName}</span>
                    ) : (
                      <span className="text-muted-foreground/50 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${
                        p.status === ProductStatus.Active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : p.status === ProductStatus.PendingApproval
                            ? "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200"
                            : p.status === ProductStatus.OutOfStock
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200"
                              : p.status === ProductStatus.Removed
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                                : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.status === ProductStatus.Active
                        ? "Đang bán"
                        : p.status === ProductStatus.Draft
                          ? "Nháp"
                          : p.status === ProductStatus.PendingApproval
                            ? "Chờ duyệt"
                            : p.status === ProductStatus.Hidden
                              ? "Đã ẩn"
                              : p.status === ProductStatus.OutOfStock
                                ? "Hết hàng"
                                : p.status === ProductStatus.Removed
                                  ? "Đã gỡ"
                                  : "—"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && (
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          onPageChange={setPage}
          itemLabel="sản phẩm"
        />
      )}
    </div>
  )
}

function OrdersTab({ orders, loading }: { orders: SellerOrder[]; loading: boolean }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sort, setSort] = useState<SortConfig | null>(null)
  const [page, setPage] = useState(1)

  const sortAccessor = (row: SellerOrder, key: string): string | number => {
    switch (key) {
      case "customerName": return row.customerName ?? ""
      case "totalAmount": return row.totalAmount
      case "createdAt": return row.createdAt ?? ""
      default: return ""
    }
  }

  const { filtered } = useTableData<SellerOrder>({
    data: orders,
    search,
    searchKeys: ["customerName"],
    filters: statusFilter === "all" ? [] : [
      { key: "status", value: statusFilter, match: (row) => (row as SellerOrder).status },
    ],
    sort,
    sortAccessor,
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const filters: FilterConfig[] = [
    {
      key: "status",
      label: "Trạng thái",
      value: statusFilter,
      onChange: (v) => { setStatusFilter(v); setPage(1) },
      width: "w-[180px]",
      options: [
        { value: "all", label: "Tất cả trạng thái" },
        { value: String(OrderStatus.PendingPayment), label: "Chờ thanh toán" },
        { value: String(OrderStatus.PendingConfirmation), label: "Chờ xác nhận" },
        { value: String(OrderStatus.Confirmed), label: "Đã xác nhận" },
        { value: String(OrderStatus.Processing), label: "Đang chuẩn bị" },
        { value: String(OrderStatus.Shipping), label: "Đang giao hàng" },
        { value: String(OrderStatus.Delivered), label: "Đã giao hàng" },
        { value: String(OrderStatus.Completed), label: "Hoàn thành" },
        { value: String(OrderStatus.Cancelled), label: "Đã hủy" },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      <FilterBar
        searchPlaceholder="Tìm theo tên khách hàng..."
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onSearch={() => {}}
        filters={filters}
      />

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-10 text-center">STT</TableHead>
              <TableHead>Mã đơn</TableHead>
              <SortableTableHead sortKey="customerName" currentSort={sort} onSort={(k) => { setSort(getNextSort(sort, k)); setPage(1) }}>Khách hàng</SortableTableHead>
              <SortableTableHead sortKey="totalAmount" currentSort={sort} onSort={(k) => { setSort(getNextSort(sort, k)); setPage(1) }}>Tổng tiền</SortableTableHead>
              <SortableTableHead sortKey="createdAt" currentSort={sort} onSort={(k) => { setSort(getNextSort(sort, k)); setPage(1) }}>Ngày đặt</SortableTableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton cols={6} />
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                  Không có đơn hàng nào
                </TableCell>
              </TableRow>
            ) : (
              paged.map((o, i) => (
                <TableRow key={o.id} className="hover:bg-muted/30">
                  <TableCell className="text-center text-sm text-muted-foreground tabular-nums">
                    {(page - 1) * PAGE_SIZE + i + 1}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-primary">#{o.orderCode}</TableCell>
                  <TableCell className="text-sm font-medium">{o.customerName ?? "—"}</TableCell>
                  <TableCell className="text-sm tabular-nums font-semibold">{currency(o.totalAmount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {new Date(o.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] ${orderStatusColors[o.status] ?? ""}`}>
                      {OrderStatusLabels[o.status] ?? "—"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && (
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          onPageChange={setPage}
          itemLabel="đơn hàng"
        />
      )}
    </div>
  )
}

function OverviewTab({ orders, loading }: { orders: SellerOrder[]; loading: boolean }) {
  const rows = useMemo(() => [
    { label: "Tổng đơn hàng", value: orders.length, color: "bg-primary/10 text-primary" },
    { label: "Chờ thanh toán", value: orders.filter((o) => o.status === OrderStatus.PendingPayment).length, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    { label: "Chờ xác nhận", value: orders.filter((o) => o.status === OrderStatus.PendingConfirmation).length, color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" },
    { label: "Đang xử lý", value: orders.filter((o) => o.status === OrderStatus.Confirmed || o.status === OrderStatus.Processing || o.status === OrderStatus.Shipping).length, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Đã giao thành công", value: orders.filter((o) => o.status === OrderStatus.Delivered || o.status === OrderStatus.Completed).length, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    { label: "Đã hủy", value: orders.filter((o) => o.status === OrderStatus.Cancelled).length, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    { label: "Đã hoàn tiền", value: orders.filter((o) => o.status === OrderStatus.Refunded).length, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    {
      label: "Doanh thu (đã giao)",
      value: orders.filter((o) => o.status === OrderStatus.Completed).reduce((s, o) => s + o.totalAmount, 0),
      isCurrency: true,
      color: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
    },
  ], [orders])

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Chỉ số</TableHead>
            <TableHead className="text-right">Giá trị</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableSkeleton cols={2} />
          ) : rows.map((row) => (
            <TableRow key={row.label} className="hover:bg-muted/30">
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full inline-block ${row.color.split(" ")[0]}`} />
                  <span className="text-sm">{row.label}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums text-sm">
                {"isCurrency" in row && row.isCurrency ? currency(row.value) : row.value.toLocaleString("vi-VN")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

type Props = {
  products: SellerProduct[]
  orders: SellerOrder[]
  productsLoading: boolean
  ordersLoading: boolean
}

export function SellerDashboardTable({ products, orders, productsLoading, ordersLoading }: Props) {
  return (
    <Tabs defaultValue="products" className="w-full flex-col gap-4">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <TabsList>
          <TabsTrigger value="products" className="gap-1.5">
            <IconPackage className="size-4" />
            <span className="hidden sm:inline">Sản phẩm</span>
            <span className="sm:hidden">SP</span>
            {!productsLoading && <Badge variant="secondary" className="text-[10px]">{products.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <IconShoppingCart className="size-4" />
            <span className="hidden sm:inline">Đơn hàng</span>
            <span className="sm:hidden">Đơn</span>
            {!ordersLoading && <Badge variant="secondary" className="text-[10px]">{orders.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5">
            <IconTrendingUp className="size-4" />
            <span className="hidden sm:inline">Tổng quan đơn</span>
            <span className="sm:hidden">Tổng quan</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="products" className="px-4 lg:px-6">
        <ProductsTab products={products} loading={productsLoading} />
      </TabsContent>

      <TabsContent value="orders" className="px-4 lg:px-6">
        <OrdersTab orders={orders} loading={ordersLoading} />
      </TabsContent>

      <TabsContent value="overview" className="px-4 lg:px-6">
        <OverviewTab orders={orders} loading={ordersLoading} />
      </TabsContent>
    </Tabs>
  )
}
