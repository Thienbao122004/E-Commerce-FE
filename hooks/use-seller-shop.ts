"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { fetchMyShop, updateMyShop } from "@/services/seller-dashboard"
import type {
  SellerShopInfo,
  UpdateShopPayload,
} from "@/types/seller-dashboard"

export interface SellerShopData {
  shop: SellerShopInfo | null
  loading: boolean
  saving: boolean
  reload: () => void
  save: (dto: UpdateShopPayload) => Promise<boolean>
}

export function useSellerShop(): SellerShopData {
  const [shop, setShop] = useState<SellerShopInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchMyShop()
      if (!mountedRef.current) return
      if (res.success && res.data) {
        setShop(res.data)
      } else if (res.message) {
        toast.error(res.message)
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        const msg =
          err instanceof Error ? err.message : "Lỗi tải thông tin shop"
        toast.error(msg)
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  const save = useCallback(
    async (dto: UpdateShopPayload): Promise<boolean> => {
      setSaving(true)
      try {
        const res = await updateMyShop(dto)
        if (res.success) {
          toast.success(res.message || "Cập nhật thành công!")
          // Reload shop data
          await load()
          return true
        } else {
          toast.error(res.message || "Cập nhật thất bại")
          return false
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Lỗi cập nhật thông tin shop"
        toast.error(msg)
        return false
      } finally {
        if (mountedRef.current) setSaving(false)
      }
    },
    [load]
  )

  useEffect(() => {
    mountedRef.current = true
    load()
    return () => {
      mountedRef.current = false
    }
  }, [load])

  return {
    shop,
    loading,
    saving,
    reload: load,
    save,
  }
}
