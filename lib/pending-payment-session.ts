'use client'

export const CHECKOUT_PENDING_PAYMENT_KEY = 'checkout:pending-payment'
export const PENDING_PAYMENT_TTL_MS = 100 * 60 * 1000

export type PendingPaymentMethod = 'vnpay' | 'momo'

export interface PendingPaymentSession {
  orderIds: string[]
  paymentMethod: PendingPaymentMethod
  primaryOrderId?: string
  paymentUrl?: string
  paymentId?: string
  createdAt: string
  expiresAt: string
}

type PendingPaymentSessionInput = Omit<
  PendingPaymentSession,
  'createdAt' | 'expiresAt'
> & {
  createdAt?: string
  expiresAt?: string
}

function toMs(value?: string): number | null {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

function normalizeSession(input: PendingPaymentSessionInput): PendingPaymentSession {
  const createdAtMs = toMs(input.createdAt) ?? Date.now()
  const expiresAtMs = toMs(input.expiresAt) ?? createdAtMs + PENDING_PAYMENT_TTL_MS

  return {
    ...input,
    createdAt: new Date(createdAtMs).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
  }
}

export function readPendingPaymentSession(): PendingPaymentSession | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(CHECKOUT_PENDING_PAYMENT_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as PendingPaymentSessionInput
    if (!Array.isArray(parsed.orderIds) || parsed.orderIds.length === 0 || !parsed.paymentMethod) {
      sessionStorage.removeItem(CHECKOUT_PENDING_PAYMENT_KEY)
      return null
    }

    const normalized = normalizeSession(parsed)
    const expiresAtMs = Date.parse(normalized.expiresAt)

    if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) {
      sessionStorage.removeItem(CHECKOUT_PENDING_PAYMENT_KEY)
      return null
    }

    return normalized
  } catch {
    sessionStorage.removeItem(CHECKOUT_PENDING_PAYMENT_KEY)
    return null
  }
}

export function writePendingPaymentSession(input: PendingPaymentSessionInput): PendingPaymentSession {
  const normalized = normalizeSession(input)
  sessionStorage.setItem(CHECKOUT_PENDING_PAYMENT_KEY, JSON.stringify(normalized))
  return normalized
}

export function clearPendingPaymentSession() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(CHECKOUT_PENDING_PAYMENT_KEY)
}
