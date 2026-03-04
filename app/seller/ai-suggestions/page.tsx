"use client"

import { IconBrain } from "@tabler/icons-react"
import { SuggestionStats } from "./_components/suggestion-stats"
import { SuggestionList } from "./_components/suggestion-list"

const MOCK_COUNTS = { total: 6, accepted: 3, modified: 2, rejected: 1 }

export default function AISuggestionsPage() {
  return (
    <div className="flex flex-1 flex-col gap-5 p-4 lg:p-6">
      <div>
        <div className="flex items-center gap-2">
          <IconBrain className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-bold tracking-tight">AI Gợi ý danh mục & Tags</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Lịch sử phân tích và gợi ý từ AI trong quá trình tạo sản phẩm.
        </p>
      </div>

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
