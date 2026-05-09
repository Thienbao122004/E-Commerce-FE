"use client"

import { useCallback, useEffect, useState } from "react"

import { fetchProducts } from "@/services/products"
import { ProductStatus } from "@/types/product"

const POLL_MS = 2 * 60_000

/** Tên custom event để báo hiệu cần refresh badge "Chờ duyệt" ở sidebar. */
export const PENDING_COUNT_REFRESH_EVENT = "admin:pending-product-count-refresh"

/** Gọi hàm này sau mỗi hành động approve / reject để sidebar cập nhật ngay. */
export function dispatchPendingCountRefresh() {
  window.dispatchEvent(new CustomEvent(PENDING_COUNT_REFRESH_EVENT))
}

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

    // Lắng nghe event từ trang pending-approval sau approve / reject.
    window.addEventListener(PENDING_COUNT_REFRESH_EVENT, run)

    return () => {
      clearTimeout(t0)
      clearInterval(t)
      window.removeEventListener(PENDING_COUNT_REFRESH_EVENT, run)
    }
  }, [enabled, load])

  return { count: enabled ? count : 0, refresh: load }
}
