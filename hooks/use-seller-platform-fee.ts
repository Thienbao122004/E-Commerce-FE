"use client"

import * as React from "react"
import { fetchSellerPlatformFee } from "@/services/seller-platform-fee"

/**
 * Tỷ lệ phí sàn hiện tại (seller đã đăng nhập). Gọi một lần mỗi lần mount nếu enabled.
 */
export function useSellerPlatformFee(enabled: boolean = true) {
  const [commissionPercent, setCommissionPercent] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(enabled)

  React.useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetchSellerPlatformFee()
        if (!cancelled && res?.success && res.data && typeof res.data.commissionPercent === "number") {
          setCommissionPercent(res.data.commissionPercent)
        } else if (!cancelled) {
          setCommissionPercent(null)
        }
      } catch {
        if (!cancelled) setCommissionPercent(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { commissionPercent, loading }
}
