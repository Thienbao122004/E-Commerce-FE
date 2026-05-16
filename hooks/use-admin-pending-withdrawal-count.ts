"use client"

import { useCallback, useEffect, useState } from "react"

import { fetchWithdrawals, fetchCustomerWithdrawals } from "@/services/withdrawals"
import { WithdrawStatus } from "@/types/withdraw"

const POLL_MS = 2 * 60_000

export const ADMIN_PENDING_WITHDRAWAL_REFRESH_EVENT = "admin:pending-withdrawal-count-refresh"

export function dispatchAdminPendingWithdrawalRefresh() {
  window.dispatchEvent(new CustomEvent(ADMIN_PENDING_WITHDRAWAL_REFRESH_EVENT))
}

export function useAdminPendingWithdrawalCount(enabled: boolean) {
  const [sellerCount, setSellerCount] = useState(0)
  const [customerCount, setCustomerCount] = useState(0)

  const load = useCallback(async () => {
    if (!enabled) return
    try {
      const [sellerRes, customerRes] = await Promise.all([
        fetchWithdrawals(1, 1, WithdrawStatus.Pending),
        fetchCustomerWithdrawals(1, 1, WithdrawStatus.Pending)
      ])
      
      if (sellerRes.success) setSellerCount(sellerRes.totalCount)
      if (customerRes.success) setCustomerCount(customerRes.totalCount)
    } catch (e) {
      console.error("Error fetching admin pending withdrawal count", e)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    const run = () => { void load() }
    const t0 = setTimeout(run, 0)
    const t = setInterval(run, POLL_MS)

    window.addEventListener(ADMIN_PENDING_WITHDRAWAL_REFRESH_EVENT, run)

    return () => {
      clearTimeout(t0)
      clearInterval(t)
      window.removeEventListener(ADMIN_PENDING_WITHDRAWAL_REFRESH_EVENT, run)
    }
  }, [enabled, load])

  return { 
    sellerCount: enabled ? sellerCount : 0, 
    customerCount: enabled ? customerCount : 0,
    refresh: load 
  }
}
