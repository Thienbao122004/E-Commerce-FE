import useSWR from "swr"
import { api } from "@/lib/api-client"
import { DisputeStatus } from "@/types/dispute"

export function useSellerPendingDisputeCount(enabled: boolean = true) {
  const { data, error, mutate } = useSWR(
    enabled ? "/api/seller/disputes/count/pending" : null,
    async (url) => {
      const res = await api.get<{ count: number }>(url)
      return res.count
    },
    {
      refreshInterval: 30000, // 30 seconds
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
