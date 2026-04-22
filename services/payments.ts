import { api } from '@/lib/api-client'
import type { CreatePaymentResponse } from '@/types/payment'

export type { CreatePaymentResponse } from '@/types/payment'

export const paymentsService = {
  createVNPayPayment: (orderId: string) =>
    api.post<CreatePaymentResponse>('/api/payments/vnpay/create', { orderId }),

  createVNPayBatchPayment: (orderIds: string[]) =>
    api.post<CreatePaymentResponse>('/api/payments/vnpay/create-batch', { orderIds }),

  createMoMoPayment: (orderId: string) =>
    api.post<CreatePaymentResponse>('/api/payments/momo/create', { orderId }),
}
