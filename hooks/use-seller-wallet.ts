"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { fetchMyWallet, fetchMyWithdrawals, createWithdrawal } from "@/services/seller-dashboard"
import type {
  SellerWallet,
  WithdrawalRecord,
  CreateWithdrawalPayload,
} from "@/types/seller-dashboard"

export interface SellerWalletData {
  wallet: SellerWallet | null
  withdrawals: WithdrawalRecord[]
  totalWithdrawals: number
  page: number
  pageSize: number
  loading: boolean
  loadingWithdrawals: boolean
  submitting: boolean
  setPage: (p: number) => void
  reload: () => void
  submit: (dto: CreateWithdrawalPayload) => Promise<boolean>
}

export function useSellerWallet(): SellerWalletData {
  const [wallet, setWallet] = useState<SellerWallet | null>(null)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([])
  const [totalWithdrawals, setTotalWithdrawals] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [loading, setLoading] = useState(true)
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const mounted = useRef(true)

  const loadWallet = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchMyWallet()
      if (mounted.current && res.success && res.data) {
        setWallet(res.data)
      }
    } catch {
      if (mounted.current) toast.error("Lỗi tải thông tin ví")
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  const loadWithdrawals = useCallback(async (p: number) => {
    setLoadingWithdrawals(true)
    try {
      const res = await fetchMyWithdrawals(p, pageSize)
      if (mounted.current && res.success) {
        setWithdrawals(res.data ?? [])
        setTotalWithdrawals(res.totalCount ?? 0)
      }
    } catch {
      if (mounted.current) toast.error("Lỗi tải lịch sử rút tiền")
    } finally {
      if (mounted.current) setLoadingWithdrawals(false)
    }
  }, [])

  const reload = useCallback(() => {
    loadWallet()
    loadWithdrawals(page)
  }, [loadWallet, loadWithdrawals, page])

  const submit = useCallback(async (dto: CreateWithdrawalPayload): Promise<boolean> => {
    setSubmitting(true)
    try {
      const res = await createWithdrawal(dto)
      if (res.success) {
        toast.success(res.message || "Yêu cầu rút tiền đã được gửi!")
        await loadWallet()
        await loadWithdrawals(1)
        setPage(1)
        return true
      } else {
        toast.error(res.message || "Gửi yêu cầu thất bại")
        return false
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi gửi yêu cầu rút tiền")
      return false
    } finally {
      if (mounted.current) setSubmitting(false)
    }
  }, [loadWallet, loadWithdrawals])

  useEffect(() => {
    mounted.current = true
    loadWallet()
    loadWithdrawals(1)
    return () => { mounted.current = false }
  }, [loadWallet, loadWithdrawals])

  useEffect(() => {
    loadWithdrawals(page)
  }, [page, loadWithdrawals])

  return {
    wallet,
    withdrawals,
    totalWithdrawals,
    page,
    pageSize,
    loading,
    loadingWithdrawals,
    submitting,
    setPage,
    reload,
    submit,
  }
}
