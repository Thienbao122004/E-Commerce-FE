"use client"

import * as React from "react"
import { IconGitCompare } from "@tabler/icons-react"

import type { ProductApprovedSnapshot, ProductModeration } from "@/types/product"
import { formatPriceVND } from "@/lib/formatters"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

function arrEq(a: string[] | undefined, b: string[] | undefined) {
  const x = a ?? []
  const y = b ?? []
  if (x.length !== y.length) return false
  return x.every((v, i) => v === y[i])
}

function formatVariants(
  list: { variantName: string; sku?: string | null; price?: number | null; stock: number; attributes?: string | null }[] | undefined
) {
  if (!list?.length) return "—"
  return list
    .map(
      (v) =>
        `${v.variantName}${v.sku ? ` (${v.sku})` : ""}: ${
          v.price != null && v.price > 0 ? formatPriceVND(v.price) : "Theo giá gốc"
        } — tồn ${v.stock}${v.attributes ? ` — ${v.attributes}` : ""}`
    )
    .join("\n")
}

type Row = { label: string; old: string; next: string; changed: boolean }

function buildRows(
  prev: ProductApprovedSnapshot,
  cur: ProductModeration
): Row[] {
  const curTagNames = cur.tagNames ?? []
  const curMatNames = cur.materialNames ?? []
  const pTags = prev.tagNames ?? []
  const pMats = prev.materialNames ?? []

  const pDesc = (prev.description ?? "").trim()
  const cDesc = (cur.description ?? "").trim()
  const pV = prev.variants ?? []
  const cV = cur.variants ?? []

  const pImg = prev.imageUrls?.join("\n") ?? ""
  const cImg = (cur.imageUrls ?? []).join("\n")

  const pVar = formatVariants(pV)
  const cVar = formatVariants(cV)
  const variantsChanged = pVar !== cVar

  const baseP = prev.baseInventoryQuantity
  const baseC = cur.baseInventoryQuantity

  return [
    {
      label: "Tên",
      old: prev.name,
      next: cur.name,
      changed: prev.name !== cur.name,
    },
    {
      label: "Mô tả",
      old: pDesc || "—",
      next: cDesc || "—",
      changed: pDesc !== cDesc,
    },
    {
      label: "Giá cơ bản",
      old: formatPriceVND(prev.basePrice),
      next: formatPriceVND(cur.basePrice),
      changed: Number(prev.basePrice) !== Number(cur.basePrice),
    },
    {
      label: "Danh mục",
      old: prev.categoryName ?? "—",
      next: cur.categoryName ?? "—",
      changed: (prev.categoryId ?? null) !== (cur.categoryId ?? null) || (prev.categoryName ?? "") !== (cur.categoryName ?? ""),
    },
    {
      label: "Ảnh (URL, theo thứ tự)",
      old: pImg || "—",
      next: cImg || "—",
      changed: pImg !== cImg,
    },
    {
      label: "Tags",
      old: pTags.length ? pTags.join(", ") : "—",
      next: curTagNames.length ? curTagNames.join(", ") : "—",
      changed: !arrEq(pTags, curTagNames),
    },
    {
      label: "Chất liệu",
      old: pMats.length ? pMats.join(", ") : "—",
      next: curMatNames.length ? curMatNames.join(", ") : "—",
      changed: !arrEq(pMats, curMatNames),
    },
    {
      label: "Tồn (SP gốc, không biến thể)",
      old: baseP == null ? "—" : String(baseP),
      next: baseC == null ? "—" : String(baseC),
      changed: baseP !== baseC,
    },
    {
      label: "Biến thể / phiên bản",
      old: pVar,
      next: cVar,
      changed: variantsChanged,
    },
  ]
}

export function ProductModerationDiff({ product, snapshot }: { product: ProductModeration; snapshot: ProductApprovedSnapshot }) {
  const rows = React.useMemo(() => buildRows(snapshot, product), [snapshot, product])
  const hasAny = rows.some((r) => r.changed)
  const [open, setOpen] = React.useState(true)

  if (!rows.length) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-dashed border-[var(--color-primary)]/35 bg-[var(--color-primary)]/5">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-primary)]/15 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <IconGitCompare className="size-4 text-[var(--color-primary)]" />
          So sánh: bản đã duyệt trước ↔ bản seller đang yêu cầu
        </div>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs">
            {open ? "Thu gọn" : "Mở rộng"}
          </Button>
        </CollapsibleTrigger>
      </div>
      {snapshot.capturedAtUtc && (
        <p className="px-3 pt-2 text-xs text-muted-foreground">
          Ảnh chụp bản cũ (UTC): {snapshot.capturedAtUtc}
        </p>
      )}
      {!hasAny && (
        <p className="p-3 text-sm text-muted-foreground">
          Chưa phát hiện thay đổi theo dữ liệu so sánh (hoặc chưa duyệt lần nào nên bản cũ trùng cấu trúc với bản mới).
        </p>
      )}
      <CollapsibleContent>
        <div className="overflow-x-auto p-2">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="p-2 font-medium w-[12%]">Trường</th>
                <th className="p-2 font-medium w-[44%]">Bản đã duyệt (cũ)</th>
                <th className="p-2 font-medium w-[44%]">Bản đang xin duyệt (mới)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.label}
                  className={
                    r.changed
                      ? "bg-red-500/[0.08] dark:bg-red-500/15"
                      : "bg-transparent"
                  }
                >
                  <td
                    className={`p-2 align-top font-medium border-t border-border/60 ${
                      r.changed
                        ? "text-red-800/90 dark:text-red-200/90"
                        : "text-muted-foreground"
                    }`}
                  >
                    {r.label}
                  </td>
                  <td
                    className={`p-2 align-top whitespace-pre-wrap break-words border-t border-border/60 ${
                      r.changed ? "text-muted-foreground" : ""
                    }`}
                  >
                    {r.old}
                  </td>
                  <td
                    className={`p-2 align-top whitespace-pre-wrap break-words border-t border-border/60 ${
                      r.changed
                        ? "font-medium text-red-600 dark:text-red-400"
                        : ""
                    }`}
                  >
                    {r.next}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function tryParseProductSnapshotJson(json: string | null | undefined): ProductApprovedSnapshot | null {
  if (!json?.trim()) return null
  try {
    return JSON.parse(json) as ProductApprovedSnapshot
  } catch {
    return null
  }
}
