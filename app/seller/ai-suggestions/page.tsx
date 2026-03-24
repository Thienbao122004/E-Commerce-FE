"use client"

import { IconBrain } from "@tabler/icons-react"
import { SuggestionStats } from "./_components/suggestion-stats"
import { SuggestionList } from "./_components/suggestion-list"

const MOCK_COUNTS = { total: 6, accepted: 3, modified: 2, rejected: 1 }

export default function AISuggestionsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <SuggestionStats
        total={MOCK_COUNTS.total}
        accepted={MOCK_COUNTS.accepted}
        modified={MOCK_COUNTS.modified}
        rejected={MOCK_COUNTS.rejected}
      />
      <SuggestionList />
    </div>
  )
}
