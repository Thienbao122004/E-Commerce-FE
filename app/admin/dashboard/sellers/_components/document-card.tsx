import {
  IconEye, IconFileText, IconPhoto, IconCreditCard,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import type { ShopDocument } from "@/types/seller"

const fmtDate = (t: string | null) =>
  t ? new Date(t).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"

const DocStatusColors: Record<number, string> = {
  0: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  1: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  2: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

const DocStatusLabels: Record<number, string> = {
  0: "Chờ duyệt",
  1: "Đã duyệt",
  2: "Từ chối",
}

const DocTypeLabels: Record<string, string> = {
  cccd_front: "CCCD mặt trước",
  cccd_back: "CCCD mặt sau",
  business_license: "Giấy phép kinh doanh",
  bank_account: "Tài khoản ngân hàng",
  portrait: "Ảnh chân dung",
  other: "Tài liệu khác",
}

const DocTypeIcons: Record<string, React.ReactNode> = {
  cccd_front: <IconCreditCard className="size-4" />,
  cccd_back: <IconCreditCard className="size-4" />,
  business_license: <IconFileText className="size-4" />,
  bank_account: <IconCreditCard className="size-4" />,
  portrait: <IconPhoto className="size-4" />,
  other: <IconFileText className="size-4" />,
}

export function DocumentCard({ doc, onPreview }: { doc: ShopDocument; onPreview: (url: string) => void }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(doc.fileUrl)
  const label = DocTypeLabels[doc.docType] ?? doc.docType
  const icon = DocTypeIcons[doc.docType] ?? <IconFileText className="size-4" />

  return (
    <div className="rounded-lg border overflow-hidden group hover:shadow-md transition-shadow">
      {isImage ? (
        <div
          className="relative h-40 bg-muted cursor-pointer overflow-hidden"
          onClick={() => onPreview(doc.fileUrl)}
        >
          <Image src={doc.fileUrl} alt={label} fill className="object-cover group-hover:scale-105 transition-transform duration-200" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <IconEye className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </div>
      ) : (
        <div
          className="relative h-40 bg-muted flex items-center justify-center cursor-pointer"
          onClick={() => window.open(doc.fileUrl, "_blank")}
        >
          <div className="text-center">
            <IconFileText className="size-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Xem tài liệu</p>
          </div>
        </div>
      )}

      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-sm font-medium truncate">{label}</span>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={`text-xs ${DocStatusColors[doc.status] ?? ""}`}>
            {DocStatusLabels[doc.status] ?? doc.statusName}
          </Badge>
          <span className="text-xs text-muted-foreground tabular-nums">{fmtDate(doc.submittedAt)}</span>
        </div>
        {doc.rejectionReason && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-1.5 rounded">
            {doc.rejectionReason}
          </p>
        )}
        {doc.reviewedByName && (
          <p className="text-xs text-muted-foreground">
            Duyệt bởi: {doc.reviewedByName} · {fmtDate(doc.reviewedAt ?? null)}
          </p>
        )}
      </div>
    </div>
  )
}
