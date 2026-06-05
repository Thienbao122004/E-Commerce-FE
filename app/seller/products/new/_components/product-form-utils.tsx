"use client"

import * as React from "react"
import type { TagSuggestion, MaterialSuggestion } from "@/services/ai-seller"

// ── Confidence helpers ──────────────────────────────────────────────────────

export function confidenceToPercent(score: number | undefined | null): number {
  if (score == null || !Number.isFinite(score)) return 0
  if (score > 1) return Math.min(100, Math.round(score))
  return Math.round(score * 100)
}

export function confidenceText(score?: number) {
  if (score == null) return "--"
  return `${Math.round(score * 100)}%`
}

export function ConfidenceDot({ score }: { score: number }) {
  const pct = confidenceToPercent(score)
  const color =
    pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-muted-foreground/40"
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block size-1.5 rounded-full ${color}`} />
      <span className="text-[10px] tabular-nums text-muted-foreground">{pct}%</span>
    </span>
  )
}

// ── Section label ────────────────────────────────────────────────────────────

export function SectionLabel({
  icon: Icon,
  children,
  badge,
}: {
  icon?: React.ElementType
  children: React.ReactNode
  badge?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3 text-muted-foreground" />}
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {children}
        </span>
      </div>
      {badge}
    </div>
  )
}

// ── Tag helpers ──────────────────────────────────────────────────────────────

export function parseTagIdFromSuggestion(
  tag: TagSuggestion & { tag_id?: unknown }
): number | null {
  const raw: unknown =
    (tag as TagSuggestion & { tag_id?: unknown }).tagId ?? tag.tag_id
  if (typeof raw === "number" && Number.isFinite(raw)) return raw
  if (typeof raw === "string" && /^\d+$/.test(raw.trim())) return parseInt(raw.trim(), 10)
  return null
}

export function tagConfidenceForCommit(s: TagSuggestion): number {
  const ext = s as TagSuggestion & { confidenceScore?: number }
  const raw = ext.confidenceScore ?? ext.confidence
  if (raw == null || !Number.isFinite(raw)) return 0
  return raw
}

// ── Material helpers ─────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isPersistableMaterialId(id: string): boolean {
  return UUID_RE.test(id)
}

export function materialConfidenceForCommit(m: MaterialSuggestion): number {
  const ext = m as MaterialSuggestion & { confidenceScore?: number }
  const raw = ext.confidenceScore ?? ext.confidence
  if (raw == null || !Number.isFinite(raw)) return 0
  return raw
}

export function buildSuggestedMaterialsForCommit(matSuggestions: MaterialSuggestion[]) {
  return matSuggestions
    .filter(
      (m) =>
        isPersistableMaterialId(m.materialId) ||
        (m.materialName?.trim()?.length ?? 0) > 0
    )
    .map((m) => ({
      materialId: isPersistableMaterialId(m.materialId) ? m.materialId : null,
      materialName: (m.materialName ?? "").trim() || "—",
      confidenceScore: materialConfidenceForCommit(m),
    }))
}

export function materialSelectionKey(m: MaterialSuggestion, idx: number): string {
  const id = m.materialId
  if (typeof id === "string" && id.trim().length > 0) return id.trim()
  const n = m.materialName?.trim()
  if (n) return `__name__:${n.toLowerCase()}`
  return `__idx__:${idx}`
}

export function isPlatformMatSelected(
  mat: { id: string; name: string },
  selMatIds: string[],
  matSuggestions: MaterialSuggestion[]
): boolean {
  if (selMatIds.includes(mat.id)) return true
  const nameLower = mat.name.trim().toLowerCase()
  if (nameLower && selMatIds.includes(`__name__:${nameLower}`)) return true
  for (let idx = 0; idx < matSuggestions.length; idx++) {
    const m = matSuggestions[idx]
    if (!selMatIds.includes(materialSelectionKey(m, idx))) continue
    const mid = m.materialId?.trim()
    if (mid && mid === mat.id) return true
    if (nameLower && (m.materialName?.trim().toLowerCase() ?? "") === nameLower) return true
  }
  return false
}
