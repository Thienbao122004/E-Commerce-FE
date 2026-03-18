import { api } from '@/lib/api-client'

export interface CreatePaymentResponse {
  success: boolean
  message?: string
  paymentUrl?: string
  paymentId?: string
}

export const paymentsService = {
  createVNPayPayment: (orderId: string) =>
    api.post<CreatePaymentResponse>('/api/payments/vnpay/create', { orderId }),
}
