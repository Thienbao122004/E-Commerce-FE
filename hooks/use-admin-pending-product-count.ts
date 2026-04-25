"use client"

import { useCallback, useEffect, useState } from "react"

import { fetchProducts } from "@/services/products"
import { ProductStatus } from "@/types/product"

const POLL_MS = 2 * 60_000

export function useAdminPendingProductCount(enabled: boolean) {
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    if (!enabled) return
    const res = await fetchProducts({ page: 1, pageSize: 1, status: ProductStatus.PendingApproval })
    if (res.success) setCount(res.totalCount)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    const run = () => { void load() }
    const t0 = setTimeout(run, 0)
    const t = setInterval(run, POLL_MS)
    return () => {
      clearTimeout(t0)
      clearInterval(t)
    }
  }, [enabled, load])

  return { count: enabled ? count : 0, refresh: load }
}
