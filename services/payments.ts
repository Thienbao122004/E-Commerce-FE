import { api } from '@/lib/api-client'
import type { CreatePaymentResponse } from '@/types/payment'

export type { CreatePaymentResponse } from '@/types/payment'

/** Base API (có hoặc không có /api) — dùng để gửi MoMo redirect/ipn trỏ về đúng BE khi dev. */
function momoCallbackUrlOverrides() {
  const raw = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
  if (!raw) return {}
  const withApi = raw.endsWith('/api') ? raw : `${raw}/api`
  return {
    moMoReturnUrlOverride: `${withApi}/payments/momo/return`,
    moMoNotifyUrlOverride: `${withApi}/payments/momo/ipn`,
  }
}

export const paymentsService = {
  createVNPayPayment: (orderId: string) =>
    api.post<CreatePaymentResponse>('/api/payments/vnpay/create', { orderId }),

  createVNPayBatchPayment: (orderIds: string[]) =>
    api.post<CreatePaymentResponse>('/api/payments/vnpay/create-batch', { orderIds }),

  createMoMoPayment: (orderId: string) =>
    api.post<CreatePaymentResponse>('/api/payments/momo/create', {
      orderId,
      ...momoCallbackUrlOverrides(),
    }),

  createMoMoBatchPayment: (orderIds: string[]) =>
    api.post<CreatePaymentResponse>('/api/payments/momo/create-batch', {
      orderIds,
      ...momoCallbackUrlOverrides(),
    }),
}
