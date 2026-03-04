"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
  fetchMyProducts,
  fetchMyProductById,
  createMyProduct,
  updateMyProduct,
  deleteMyProduct,
  updateMyInventory,
} from "@/services/seller-dashboard"
import type {
  SellerProduct,
  CreateSellerProductPayload,
  UpdateSellerProductPayload,
  UpdateInventoryPayload,
} from "@/types/seller-dashboard"

type Params = {
  page: number
  pageSize: number
  status: number | undefined
  search: string
}

export function useSellerProducts(initialParams?: Partial<Params>) {
  const [products, setProducts] = useState<SellerProduct[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [params, setParams] = useState<Params>({
    page: 1,
    pageSize: 20,
    status: undefined,
    search: "",
    ...initialParams,
  })

  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchMyProducts(params.page, params.pageSize, params.status)
      if (!mountedRef.current) return
      if (res.success && res.data) {
        let filtered = res.data
        if (params.search) {
          const q = params.search.toLowerCase()
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.categoryName?.toLowerCase().includes(q)
          )
        }
        setProducts(filtered)
        setTotalCount(filtered.length)
      } else {
        setProducts([])
        setTotalCount(0)
      }
    } catch (err) {
      if (mountedRef.current) {
        const msg = err instanceof Error ? err.message : "Lỗi tải sản phẩm"
        if (!msg.includes("No access token")) toast.error(msg)
        setProducts([])
        setTotalCount(0)
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [params])

  useEffect(() => {
    mountedRef.current = true
    load()
    return () => {
      mountedRef.current = false
    }
  }, [load])

  const create = useCallback(async (dto: CreateSellerProductPayload) => {
    setActionLoading(true)
    try {
      const res = await createMyProduct(dto)
      if (res.success) {
        toast.success(res.message ?? "Tạo sản phẩm thành công")
        await load()
        return true
      } else {
        toast.error(res.message ?? "Lỗi tạo sản phẩm")
        return false
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tạo sản phẩm")
      return false
    } finally {
      setActionLoading(false)
    }
  }, [load])

  const update = useCallback(async (productId: string, dto: UpdateSellerProductPayload) => {
    setActionLoading(true)
    try {
      const res = await updateMyProduct(productId, dto)
      if (res.success) {
        toast.success(res.message ?? "Cập nhật sản phẩm thành công")
        await load()
        return true
      } else {
        toast.error(res.message ?? "Lỗi cập nhật sản phẩm")
        return false
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi cập nhật sản phẩm")
      return false
    } finally {
      setActionLoading(false)
    }
  }, [load])

  const remove = useCallback(async (productId: string) => {
    setActionLoading(true)
    try {
      const res = await deleteMyProduct(productId)
      if (res.success) {
        toast.success(res.message ?? "Xóa sản phẩm thành công")
        await load()
        return true
      } else {
        toast.error(res.message ?? "Lỗi xóa sản phẩm")
        return false
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi xóa sản phẩm")
      return false
    } finally {
      setActionLoading(false)
    }
  }, [load])

  const updateInventory = useCallback(async (productId: string, dto: UpdateInventoryPayload) => {
    setActionLoading(true)
    try {
      const res = await updateMyInventory(productId, dto)
      if (res.success) {
        toast.success(res.message ?? "Cập nhật kho thành công")
        await load()
        return true
      } else {
        toast.error(res.message ?? "Lỗi cập nhật kho")
        return false
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi cập nhật kho")
      return false
    } finally {
      setActionLoading(false)
    }
  }, [load])

  const setPage = useCallback((page: number) => {
    setParams((p) => ({ ...p, page }))
  }, [])

  const setStatus = useCallback((status: number | undefined) => {
    setParams((p) => ({ ...p, status, page: 1 }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setParams((p) => ({ ...p, search, page: 1 }))
  }, [])

  const totalPages = Math.max(1, Math.ceil(totalCount / params.pageSize))

  return {
    products,
    totalCount,
    loading,
    actionLoading,
    params,
    totalPages,
    setPage,
    setStatus,
    setSearch,
    create,
    update,
    remove,
    updateInventory,
    reload: load,
  }
}
