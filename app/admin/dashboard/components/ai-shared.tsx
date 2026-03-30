"use client"

import * as React from "react"

export const fmtVND = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v)

export const fmtDateTime = (s: string) =>
  new Date(s).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

export function today() {
  return new Date().toISOString().slice(0, 10)
}

export function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const METRIC_OPTIONS = [
  { value: "revenue", label: "Doanh thu" },
  { value: "orders", label: "Đơn hàng" },
  { value: "sellers", label: "Người bán" },
  { value: "products", label: "Sản phẩm" },
  { value: "customers", label: "Khách hàng" },
]

export function AiText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <p className={`text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed ${className}`}>
      {text}
    </p>
  )
}

export function BulletList({
  items,
  icon,
  color = "text-muted-foreground",
}: {
  items: string[]
  icon: React.ReactNode
  color?: string
}) {
  if (!items.length)
    return <p className="text-sm text-muted-foreground italic">Không có dữ liệu</p>
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className={`mt-0.5 shrink-0 ${color}`}>{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export const severityColor: Record<string, string> = {
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}
