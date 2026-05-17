import useSWR from "swr"
import { api } from "@/lib/api-client"

export function useSellerPendingWithdrawalCount(enabled: boolean = true) {
  const { data, error, mutate } = useSWR(
    enabled ? "/api/seller/withdrawals/count/pending" : null,
    async (url) => {
      const res = await api.get<{ count: number }>(url)
      return res.count
    },
    {
      refreshInterval: 60000, // 60 seconds
      revalidateOnFocus: true,
    }
  )

  return {
    count: data ?? 0,
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}
