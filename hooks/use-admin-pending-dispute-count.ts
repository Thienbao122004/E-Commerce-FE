"use client"

import { useCallback, useEffect, useState } from "react"

import { fetchDisputes } from "@/services/disputes"
import { DisputeStatus } from "@/types/dispute"

const POLL_MS = 2 * 60_000

export const ADMIN_PENDING_DISPUTE_REFRESH_EVENT = "admin:pending-dispute-count-refresh"

export function dispatchAdminPendingDisputeRefresh() {
  window.dispatchEvent(new CustomEvent(ADMIN_PENDING_DISPUTE_REFRESH_EVENT))
}

export function useAdminPendingDisputeCount(enabled: boolean) {
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    if (!enabled) return
    try {
      // Admin cần xử lý khiếu nại ở trạng thái Pending hoặc UnderReview
      const [pendingRes, underReviewRes] = await Promise.all([
        fetchDisputes(1, 1, DisputeStatus.Pending),
        fetchDisputes(1, 1, DisputeStatus.UnderReview)
      ])
      
      let total = 0
      if (pendingRes.success) total += pendingRes.totalCount
      if (underReviewRes.success) total += underReviewRes.totalCount
      
      setCount(total)
    } catch (e) {
      console.error("Error fetching admin pending dispute count", e)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    const run = () => { void load() }
    const t0 = setTimeout(run, 0)
    const t = setInterval(run, POLL_MS)

    window.addEventListener(ADMIN_PENDING_DISPUTE_REFRESH_EVENT, run)

    return () => {
      clearTimeout(t0)
      clearInterval(t)
      window.removeEventListener(ADMIN_PENDING_DISPUTE_REFRESH_EVENT, run)
    }
  }, [enabled, load])

  return { count: enabled ? count : 0, refresh: load }
}
