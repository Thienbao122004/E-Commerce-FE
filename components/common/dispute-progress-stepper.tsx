"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { DisputeStatus, DisputeType } from "@/types/dispute"
import { OrderStatus } from "@/types/seller-dashboard"
import { formatDateTimeVN } from "@/lib/formatters"

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */
interface StepDef {
  key: string
  label: string
  icon: string
  /** Trạng thái mà bước này được xem là "current" */
  matchStatuses?: number[]
  /** Trạng thái đơn hàng mà bước này match (dùng cho return flow) */
  matchOrderStatuses?: number[]
}

type StepState = "completed" | "current" | "upcoming" | "rejected"

interface StepWithState extends StepDef {
  state: StepState
  timestamp?: string | null
  subtitle?: string | null
}

interface DisputeProgressStepperProps {
  disputeStatus: number
  disputeType: number
  orderStatus?: number
  createdAt: string
  sellerRespondedAt?: string | null
  sellerResponse?: string | null
  updatedAt: string
  resolvedAt?: string | null
  resolution?: string | null
}

/* ──────────────────────────────────────────────
   Step definitions
   ────────────────────────────────────────────── */
function buildSteps(disputeType: number): StepDef[] {
  const steps: StepDef[] = [
    {
      key: "created",
      label: "Yêu cầu đã gửi",
      icon: "edit_note",
      matchStatuses: [DisputeStatus.Pending],
    },
    {
      key: "seller_review",
      label: "Seller xem xét",
      icon: "storefront",
      matchStatuses: [DisputeStatus.WaitingSeller],
    },
  ]

  if (disputeType === DisputeType.Return) {
    steps.push(
      {
        key: "returning",
        label: "Đang trả hàng",
        icon: "local_shipping",
        matchStatuses: [DisputeStatus.WaitingCustomer],
        matchOrderStatuses: [OrderStatus.Returning],
      },
      {
        key: "returned",
        label: "Shop đã nhận hàng",
        icon: "inventory",
        matchOrderStatuses: [OrderStatus.Returned],
      },
    )
  }

  steps.push(
    {
      key: "admin_review",
      label: "Admin duyệt",
      icon: "admin_panel_settings",
      matchStatuses: [DisputeStatus.UnderReview, DisputeStatus.WaitingCustomer],
    },
    {
      key: "final",
      label: "Kết thúc",
      icon: "check_circle",
      matchStatuses: [
        DisputeStatus.Resolved,
        DisputeStatus.Refunded,
        DisputeStatus.Rejected,
        DisputeStatus.Cancelled,
      ],
    },
  )

  return steps
}

/* ──────────────────────────────────────────────
   Compute step states
   ────────────────────────────────────────────── */
function computeStepStates(
  steps: StepDef[],
  props: DisputeProgressStepperProps,
): StepWithState[] {
  const {
    disputeStatus,
    disputeType,
    orderStatus,
    createdAt,
    sellerRespondedAt,
    sellerResponse,
    updatedAt,
    resolvedAt,
    resolution,
  } = props

  const isFinal = ([
    DisputeStatus.Resolved,
    DisputeStatus.Refunded,
    DisputeStatus.Rejected,
    DisputeStatus.Cancelled,
  ] as readonly number[]).includes(disputeStatus)

  const isRejected = disputeStatus === DisputeStatus.Rejected
  const isCancelled = disputeStatus === DisputeStatus.Cancelled

  // Find the current step index
  let currentIdx = -1
  if (isFinal) {
    currentIdx = steps.length - 1
  } else if (disputeStatus === DisputeStatus.UnderReview) {
    currentIdx = steps.findIndex((s) => s.key === "admin_review")
  } else if (disputeType === DisputeType.Return && orderStatus === OrderStatus.Returned) {
    currentIdx = steps.findIndex((s) => s.key === "returned")
  } else if (disputeType === DisputeType.Return && orderStatus === OrderStatus.Returning) {
    currentIdx = steps.findIndex((s) => s.key === "returning")
  } else {
    // Fallback: match by disputeStatus
    for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i]
      if (step.matchStatuses?.includes(disputeStatus)) {
        currentIdx = i
        break
      }
    }
  }

  return steps.map((step, idx): StepWithState => {
    let state: StepState = "upcoming"
    let timestamp: string | null = null
    let subtitle: string | null = null

    if (idx < currentIdx) {
      state = "completed"
    } else if (idx === currentIdx) {
      state = isFinal && idx === steps.length - 1
        ? (isRejected || isCancelled ? "rejected" : "completed")
        : "current"
    }

    // Assign timestamps & subtitles
    switch (step.key) {
      case "created":
        timestamp = createdAt
        subtitle = "Khách hàng đã gửi yêu cầu"
        break
      case "seller_review":
        if (state === "completed" || state === "current") {
          timestamp = sellerRespondedAt ?? updatedAt
          subtitle = sellerResponse
            ? `Seller đã phản hồi`
            : "Đang chờ seller phản hồi"
        }
        break
      case "returning":
        if (state === "completed" || state === "current") {
          timestamp = updatedAt
          subtitle = "Khách đang gửi hàng trả về"
        }
        break
      case "returned":
        if (state === "completed" || state === "current") {
          timestamp = updatedAt
          subtitle = "Shop đã xác nhận nhận hàng trả"
        }
        break
      case "admin_review":
        if (state === "completed" || state === "current") {
          timestamp = updatedAt
          subtitle = "Admin đang xem xét & duyệt"
        }
        break
      case "final":
        if (state === "completed" || state === "rejected") {
          timestamp = resolvedAt ?? updatedAt
          if (disputeStatus === DisputeStatus.Refunded) {
            subtitle = "Đã hoàn tiền cho khách hàng"
            // override icon
          } else if (disputeStatus === DisputeStatus.Resolved) {
            subtitle = resolution ?? "Đã giải quyết"
          } else if (disputeStatus === DisputeStatus.Rejected) {
            subtitle = "Khiếu nại bị từ chối"
          } else if (disputeStatus === DisputeStatus.Cancelled) {
            subtitle = "Khách đã hủy khiếu nại"
          }
        }
        break
    }

    return { ...step, state, timestamp, subtitle }
  })
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */

export function DisputeProgressStepper(props: DisputeProgressStepperProps) {
  const stepDefs = buildSteps(props.disputeType)
  const steps = computeStepStates(stepDefs, props)

  return (
    <div className="relative pl-1">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1
        const isDone = step.state === "completed"
        const isCurrent = step.state === "current"
        const isRejected = step.state === "rejected"

        // Colors
        const dotBg = isDone
          ? "bg-emerald-500"
          : isCurrent
            ? "bg-orange-500 shadow-lg shadow-orange-200"
            : isRejected
              ? "bg-red-500"
              : "bg-gray-200"

        const dotBorder = isDone
          ? "border-emerald-500"
          : isCurrent
            ? "border-orange-500"
            : isRejected
              ? "border-red-500"
              : "border-gray-200"

        const textColor = isDone
          ? "text-emerald-700"
          : isCurrent
            ? "text-orange-700"
            : isRejected
              ? "text-red-700"
              : "text-gray-400"

        const iconToShow = isDone
          ? "check"
          : isRejected
            ? "close"
            : step.icon

        return (
          <div key={step.key} className="relative flex gap-4">
            {/* Vertical line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-[15px] top-[34px] w-0.5 transition-all duration-500",
                  isDone ? "bg-emerald-300" : "bg-gray-200",
                )}
                style={{ height: "calc(100% - 18px)" }}
              />
            )}

            {/* Dot */}
            <div className="relative z-10 shrink-0 pt-0.5">
              <div
                className={cn(
                  "size-[30px] rounded-full border-2 flex items-center justify-center transition-all duration-500",
                  dotBg,
                  dotBorder,
                  (isDone || isCurrent || isRejected) && "text-white",
                  isCurrent && "animate-pulse",
                )}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {iconToShow}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className={cn("pb-6 min-w-0 flex-1", isLast && "pb-0")}>
              <p className={cn("text-sm font-bold leading-snug", textColor)}>
                {step.label}
              </p>
              {step.subtitle && (isDone || isCurrent || isRejected) && (
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {step.subtitle}
                </p>
              )}
              {step.timestamp && (isDone || isCurrent || isRejected) && (
                <p className="text-[11px] text-gray-400 mt-1 tabular-nums">
                  {formatDateTimeVN(step.timestamp)}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
