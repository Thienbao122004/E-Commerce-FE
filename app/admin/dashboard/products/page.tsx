"use client"

import * as React from "react"
import Link from "next/link"

import {
  IconSearch,
  IconEye,
  IconEyeOff,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh,
  IconExternalLink,
  IconFilter,
} from "@tabler/icons-react"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useProducts } from "@/hooks/use-products"
import {
  ProductStatus,
  ProductStatusLabels,
  ProductStatusColors,
} from "@/lib/types/product"
import type { ProductModeration } from "@/lib/types/product"


const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v)

const formatDate = (ts: string) =>
  new Date(ts).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })


const statusTabs = [
  { label: "Tất cả", value: null },
  { label: "Đang bán", value: ProductStatus.Active },
  { label: "Nháp", value: ProductStatus.Draft },
  { label: "Đã ẩn", value: ProductStatus.Hidden },
  { label: "Hết hàng", value: ProductStatus.OutOfStock },
  { label: "Đã gỡ", value: ProductStatus.Removed },
]


function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  loading,
  onConfirm,
  requireReason,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description: string
  loading: boolean
  onConfirm: (reason: string) => void
  requireReason: boolean
}) {
  const [reason, setReason] = React.useState("")

  React.useEffect(() => {
    if (open) setReason("")
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {requireReason && (
          <Textarea
            placeholder="Nhập lý do..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[80px]"
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={loading || (requireReason && !reason.trim())}
          >
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-24" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}


export default function ProductsPage() {
  const {
    products,
    totalCount,
    loading,
    actionLoading,
    params,
    totalPages,
    setPage,
    setStatus,
    setSearch,
    hideProduct,
    unhideProduct,
    removeProduct,
    reload,
  } = useProducts()

  const [searchInput, setSearchInput] = React.useState("")
  const [dialogState, setDialogState] = React.useState<{
    type: "hide" | "remove" | "unhide" | null
    product: ProductModeration | null
  }>({ type: null, product: null })

  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null)

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setSearch(val)
    }, 400)
  }

  const handleAction = async (reason: string) => {
    if (!dialogState.product || !dialogState.type) return
    let ok = false
    if (dialogState.type === "hide") {
      ok = await hideProduct(dialogState.product.id, reason)
    } else if (dialogState.type === "unhide") {
      ok = await unhideProduct(dialogState.product.id)
    } else if (dialogState.type === "remove") {
      ok = await removeProduct(dialogState.product.id, reason)
    }
    if (ok) setDialogState({ type: null, product: null })
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">

          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <IconFilter className="size-4 text-muted-foreground" />
              <Select
                value={params.status === null ? "all" : String(params.status)}
                onValueChange={(v) => setStatus(v === "all" ? null : Number(v))}
              >
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {statusTabs.map((tab) => (
                    <SelectItem key={tab.value ?? "all"} value={tab.value === null ? "all" : String(tab.value)}>
                      {tab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>


          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead className="w-[60px]">Ảnh</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Cửa hàng</TableHead>
                  <TableHead className="text-right">Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton />
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <p className="text-muted-foreground">Không tìm thấy sản phẩm nào.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product, idx) => (
                    <TableRow key={product.id}>
                      <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(params.page - 1) * 20 + idx + 1}</TableCell>
                      <TableCell>
                        {product.imageUrls[0] ? (
                          <img
                            src={product.imageUrls[0]}
                            alt={product.name}
                            className="size-10 rounded border object-cover"
                          />
                        ) : (
                          <div className="bg-muted flex size-10 items-center justify-center rounded border text-xs text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/dashboard/products/${product.id}`}
                          className="font-medium hover:underline line-clamp-1 max-w-[250px]"
                        >
                          {product.name}
                        </Link>
                        {product.categoryName && (
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {product.categoryName}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{product.shopName}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {currency(product.basePrice)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={ProductStatusColors[product.status] ?? ""}
                        >
                          {ProductStatusLabels[product.status] ?? product.statusName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm tabular-nums">
                        {formatDate(product.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            asChild
                          >
                            <Link href={`/admin/dashboard/products/${product.id}`}>
                              <IconExternalLink className="size-4" />
                            </Link>
                          </Button>

                          {product.status === ProductStatus.Hidden ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-green-600 hover:text-green-700"
                              onClick={() =>
                                setDialogState({ type: "unhide", product })
                              }
                              disabled={actionLoading}
                              title="Hiển thị lại"
                            >
                              <IconEye className="size-4" />
                            </Button>
                          ) : product.status !== ProductStatus.Removed ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-yellow-600 hover:text-yellow-700"
                              onClick={() =>
                                setDialogState({ type: "hide", product })
                              }
                              disabled={actionLoading}
                              title="Ẩn sản phẩm"
                            >
                              <IconEyeOff className="size-4" />
                            </Button>
                          ) : null}

                          {product.status !== ProductStatus.Removed && product.status !== ProductStatus.Draft && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-red-600 hover:text-red-700"
                              onClick={() =>
                                setDialogState({ type: "remove", product })
                              }
                              disabled={actionLoading}
                              title="Gỡ sản phẩm"
                            >
                              <IconTrash className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>


          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Trang {params.page} / {totalPages} · {totalCount} sản phẩm
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setPage(params.page - 1)}
                  disabled={params.page <= 1}
                >
                  <IconChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setPage(params.page + 1)}
                  disabled={params.page >= totalPages}
                >
                  <IconChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>


      < ActionDialog
        open={dialogState.type === "hide"}
        onOpenChange={(v) => !v && setDialogState({ type: null, product: null })
        }
        title="Ẩn sản phẩm"
        description={`Bạn có chắc muốn ẩn "${dialogState.product?.name ?? ""}"? Sản phẩm sẽ không còn hiển thị cho người mua.`}
        loading={actionLoading}
        onConfirm={handleAction}
        requireReason
      />
      <ActionDialog
        open={dialogState.type === "unhide"}
        onOpenChange={(v) => !v && setDialogState({ type: null, product: null })}
        title="Hiển thị lại sản phẩm"
        description={`Bạn có chắc muốn hiển thị lại "${dialogState.product?.name ?? ""}"?`}
        loading={actionLoading}
        onConfirm={handleAction}
        requireReason={false}
      />
      <ActionDialog
        open={dialogState.type === "remove"}
        onOpenChange={(v) => !v && setDialogState({ type: null, product: null })}
        title="Gỡ sản phẩm vĩnh viễn"
        description={`Thao tác này sẽ gỡ "${dialogState.product?.name ?? ""}" (shop: ${dialogState.product?.shopName ?? ""}) khỏi nền tảng. Hành động này không thể hoàn tác.`}
        loading={actionLoading}
        onConfirm={handleAction}
        requireReason
      />
    </>
  )
}
