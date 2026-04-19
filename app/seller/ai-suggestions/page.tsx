"use client"

import { useEffect, useState } from "react"
import { IconBrain } from "@tabler/icons-react"
import { SuggestionStats } from "./_components/suggestion-stats"
import { SuggestionList } from "./_components/suggestion-list"
import { MaterialSuggestionList } from "./_components/material-suggestion-list"
import {
  aiGetTagSuggestionLogs,
  aiGetMaterialSuggestionLogs,
  type TagSuggestionLogResponse,
  type MaterialSuggestionLogResponse,
} from "@/services/ai-seller"

export default function AISuggestionsPage() {
  const [tagData, setTagData] = useState<TagSuggestionLogResponse | null>(null)
  const [matData, setMatData] = useState<MaterialSuggestionLogResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([aiGetTagSuggestionLogs(1, 100), aiGetMaterialSuggestionLogs(1, 100)])
      .then(([tags, mats]) => {
        if (!cancelled) {
          setTagData(tags)
          setMatData(mats)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <IconBrain className="size-4" />
          Gợi ý tag
        </h2>
        <SuggestionStats
          total={tagData?.total ?? 0}
          accepted={tagData?.accepted ?? 0}
          modified={tagData?.modified ?? 0}
          rejected={tagData?.rejected ?? 0}
          loading={loading}
        />
        <SuggestionList items={tagData?.items ?? []} loading={loading} error={error} />
      </section>

      <section className="space-y-3 pt-4 border-t border-border">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Gợi ý chất liệu
        </h2>
        <SuggestionStats
          total={matData?.total ?? 0}
          accepted={matData?.accepted ?? 0}
          modified={matData?.modified ?? 0}
          rejected={matData?.rejected ?? 0}
          loading={loading}
        />
        <MaterialSuggestionList items={matData?.items ?? []} loading={loading} error={error} />
      </section>
    </div>
  )
}
