type JoinTimeTextCase = "lower" | "title"

type JoinTimeOptions = {
  unknownLabel?: string
  justJoinedLabel?: string
  todayLabel?: string
  textCase?: JoinTimeTextCase
}

export function formatPriceVND(price: number, maximumFractionDigits = 0): string {
  return formatCurrencyVN(price, "VND", maximumFractionDigits)
}

export function formatCurrencyVN(amount: number, currency = "VND", maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(amount)
}

export function formatNumberVN(value: number, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat("vi-VN", options).format(value)
}

export function formatDateTimeVN(dateInput?: string | Date | null, fallback = "Đang cập nhật"): string {
  if (!dateInput) return fallback

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  if (Number.isNaN(date.getTime())) return fallback

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDateVN(dateInput?: string | Date | null, fallback = "Đang cập nhật"): string {
  if (!dateInput) return fallback

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  if (Number.isNaN(date.getTime())) return fallback

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function formatMonthYearVN(dateInput?: string | Date | null, fallback = "--"): string {
  if (!dateInput) return fallback

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  if (Number.isNaN(date.getTime())) return fallback

  return date.toLocaleDateString("vi-VN", {
    month: "short",
    year: "numeric",
  })
}

export function formatTimeVN(dateInput?: string | Date | null, fallback = "--:--"): string {
  if (!dateInput) return fallback

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  if (Number.isNaN(date.getTime())) return fallback

  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}

export function formatConversationTimeVN(dateInput?: string | Date | null, fallback = ""): string {
  if (!dateInput) return fallback

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  if (Number.isNaN(date.getTime())) return fallback

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return formatTimeVN(date)
  if (diffDays === 1) return "Hôm qua"
  if (diffDays < 7) return `${diffDays} ngày trước`

  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
}

export function formatRelativeTimeVN(dateInput?: string | Date | null, fallback = ""): string {
  if (!dateInput) return fallback

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  if (Number.isNaN(date.getTime())) return fallback

  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))

  if (diffMins < 1) return "Vừa xong"
  if (diffMins < 60) return `${diffMins} phút trước`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} ngày trước`

  return date.toLocaleDateString("vi-VN")
}

export function isoDateToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isoDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

export function formatCompactNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`
  return String(n)
}

export function formatSoldCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function formatJoinTime(dateStr?: string | null, options: JoinTimeOptions = {}): string {
  const {
    unknownLabel = "Đang cập nhật",
    justJoinedLabel = "Vừa tham gia",
    todayLabel = "Hôm nay",
    textCase = "lower",
  } = options

  if (!dateStr) return unknownLabel

  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return unknownLabel

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 0) return justJoinedLabel

  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  if (days < 1) return todayLabel

  const words =
    textCase === "title"
      ? { day: "Ngày Trước", week: "Tuần Trước", month: "Tháng Trước", year: "Năm Trước" }
      : { day: "ngày trước", week: "tuần trước", month: "tháng trước", year: "năm trước" }

  if (days < 7) return `${days} ${words.day}`

  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} ${words.week}`

  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  if (years > 0) return `${years} ${words.year}`

  const months = Math.floor(diff / (30 * 24 * 60 * 60 * 1000))
  if (months > 0) return `${months} ${words.month}`

  return justJoinedLabel
}
