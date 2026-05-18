import useSWR from "swr"
import { api } from "@/lib/api-client"

export function useSellerUnreadChatCount(enabled: boolean = true) {
  const { data, error, mutate } = useSWR(
    enabled ? "/api/conversations/unread-count" : null,
    async (url) => {
      const res = await api.get<{ count: number }>(url)
      return res.count
    },
    {
      refreshInterval: 15000, // 15 seconds (chat needs more frequent updates)
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
