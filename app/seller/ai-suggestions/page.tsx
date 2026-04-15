"use client"

import { useEffect, useState } from "react"
import { IconBrain } from "@tabler/icons-react"
import { SuggestionStats } from "./_components/suggestion-stats"
import { SuggestionList } from "./_components/suggestion-list"
import { aiGetTagSuggestionLogs, type TagSuggestionLogResponse } from "@/services/ai-seller"

export default function AISuggestionsPage() {
  const [data, setData] = useState<TagSuggestionLogResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    aiGetTagSuggestionLogs(1, 100)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <SuggestionStats
        total={data?.total ?? 0}
        accepted={data?.accepted ?? 0}
        modified={data?.modified ?? 0}
        rejected={data?.rejected ?? 0}
        loading={loading}
      />
      <SuggestionList items={data?.items ?? []} loading={loading} error={error} />
    </div>
  )
}
