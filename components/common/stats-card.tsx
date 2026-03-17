"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export type StatsGridProps = {
  children: React.ReactNode
  cols?: 2 | 3 | 4
  gap?: "sm" | "md"
  className?: string
}

export function StatsGrid({ children, cols = 4, gap = "md", className }: StatsGridProps) {
  const colsClass: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  }
  return (
    <div className={cn("grid", colsClass[cols], gap === "sm" ? "gap-3" : "gap-4", className)}>
      {children}
    </div>
  )
}

export type StatsCardProps = {
  label: string
  value?: React.ReactNode
  icon?: React.ReactNode
  iconBg?: string
  iconColor?: string
  valueColor?: string
  subText?: React.ReactNode
  footer?: React.ReactNode
  loading?: boolean
  className?: string
  colSpan?: number
}

export function StatsCard({
  label,
  value,
  icon,
  iconBg = "bg-muted/60",
  iconColor = "text-muted-foreground",
  valueColor,
  subText,
  footer,
  loading = false,
  className,
  colSpan,
}: StatsCardProps) {
  const spanClass = colSpan ? `col-span-${colSpan}` : undefined

  if (loading) {
    return (
      <Card className={cn(spanClass, className)}>
        <CardContent className="p-4 flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("transition-shadow hover:shadow-md", spanClass, className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <p className="text-xs font-medium text-muted-foreground leading-snug">{label}</p>
          {icon && (
            <div className={cn("flex shrink-0 size-7 items-center justify-center rounded-lg", iconBg)}>
              <span className={cn("[&>svg]:size-3.5", iconColor)}>{icon}</span>
            </div>
          )}
        </div>

        <p className={cn("text-2xl font-bold tabular-nums leading-none", valueColor)}>
          {value ?? "—"}
        </p>

        {subText && (
          <div className="text-xs text-muted-foreground mt-1.5">{subText}</div>
        )}

        {footer && (
          <div className="mt-3 pt-3 border-t text-sm">{footer}</div>
        )}
      </CardContent>
    </Card>
  )
}
