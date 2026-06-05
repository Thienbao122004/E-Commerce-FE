"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { ProductDetailView } from "../_components/product-detail-view"
import {
  fetchProductById,
  hideProduct,
  unhideProduct,
  removeProduct,
  approveProduct,
  rejectProduct,
} from "@/services/products"
import type { ProductModeration } from "@/types/product"

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = React.useState<ProductModeration | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchProductById(params.id)
      if (res.success && res.product) {
        setProduct(res.product)
      } else {
        toast.error(res.message ?? "Không tìm thấy sản phẩm")
        router.push("/admin/dashboard/products")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải sản phẩm")
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  React.useEffect(() => {
    load()
  }, [load])

  if (loading && !product) {
    return (
      <div className="flex flex-col gap-3 p-4 lg:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <ProductDetailView
      product={product}
      detailLoading={loading}
      actionLoading={actionLoading}
      onBack={() => router.push("/admin/dashboard/products")}
      onHide={async (id, reason) => {
        setActionLoading(true)
        try {
          const res = await hideProduct(id, reason)
          if (res.success) {
            toast.success(res.message ?? "Đã ẩn sản phẩm")
            await load()
            return true
          } else {
            toast.error(res.message ?? "Thao tác thất bại")
            return false
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra")
          return false
        } finally {
          setActionLoading(false)
        }
      }}
      onUnhide={async (id) => {
        setActionLoading(true)
        try {
          const res = await unhideProduct(id)
          if (res.success) {
            toast.success(res.message ?? "Đã hiển thị lại sản phẩm")
            await load()
            return true
          } else {
            toast.error(res.message ?? "Thao tác thất bại")
            return false
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra")
          return false
        } finally {
          setActionLoading(false)
        }
      }}
      onRemove={async (id, reason) => {
        setActionLoading(true)
        try {
          const res = await removeProduct(id, reason)
          if (res.success) {
            toast.success(res.message ?? "Đã gỡ sản phẩm")
            router.push("/admin/dashboard/products")
            return true
          } else {
            toast.error(res.message ?? "Thao tác thất bại")
            return false
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra")
          return false
        } finally {
          setActionLoading(false)
        }
      }}
      onApprove={async (id) => {
        setActionLoading(true)
        try {
          const res = await approveProduct(id)
          if (res.success) {
            toast.success(res.message ?? "Đã duyệt sản phẩm")
            router.push("/admin/dashboard/products")
            return { success: true, product: res.product }
          } else {
            toast.error(res.message ?? "Duyệt thất bại")
            return { success: false }
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra")
          return { success: false }
        } finally {
          setActionLoading(false)
        }
      }}
      onReject={async (id, reason) => {
        setActionLoading(true)
        try {
          const res = await rejectProduct(id, reason)
          if (res.success) {
            toast.success(res.message ?? "Từ chối duyệt thành công")
            router.push("/admin/dashboard/products")
            return { success: true, product: res.product }
          } else {
            toast.error(res.message ?? "Từ chối thất bại")
            return { success: false }
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra")
          return { success: false }
        } finally {
          setActionLoading(false)
        }
      }}
      onProductUpdated={(p) => setProduct(p)}
    />
  )
}
