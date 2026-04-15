'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { BadgeCheck, CircleDollarSign, ReceiptText, ShoppingBag } from 'lucide-react'
import { formatPriceVND } from '@/lib/formatters'
import { clearPendingPaymentSession } from '@/lib/pending-payment-session'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderCode = searchParams.get('orderCode')
  const amount = searchParams.get('amount')
  const amountValue = Number(amount ?? 0)
  const amountLabel = formatPriceVND(Number.isNaN(amountValue) ? 0 : amountValue)

  useEffect(() => {
    clearPendingPaymentSession()
  }, [])

  return (
    <div
      className="min-h-screen grid place-items-center px-4 py-10"
      style={{ background: 'linear-gradient(180deg, #f8f7f6 0%, #fff8f2 100%)' }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-white" style={{ borderColor: '#e5ded6' }}>
        <div className="grid gap-4 border-b px-8 py-8" style={{ borderColor: '#f1e9e0' }}>
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-[rgba(22,163,74,0.14)]">
              <BadgeCheck size={24} color="#15803d" />
            </div>
            <div className="grid gap-1">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-main)' }}>
                Thanh toán thành công
              </h1>
              <p className="text-sm text-muted-foreground">
                Hệ thống đã ghi nhận giao dịch của bạn và đang xử lý đơn hàng.
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-xl bg-[rgba(236,127,19,0.06)] p-4 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <ReceiptText size={16} className="shrink-0" style={{ color: 'var(--color-primary)' }} />
              <div className="grid gap-1">
                <span className="text-xs text-muted-foreground">Mã đơn hàng</span>
                <span className="text-lg font-medium break-all">{orderCode ?? '—'}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CircleDollarSign size={16} className="shrink-0" style={{ color: 'var(--color-primary)' }} />
              <div className="grid gap-1">
                <span className="text-xs text-muted-foreground">Số tiền thanh toán</span>
                <span className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
                  {amountLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-8 py-6">
          <div className="grid gap-2 rounded-xl border p-4" style={{ borderColor: '#efe8de' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-main)' }}>
              Tiếp theo bạn có thể
            </h2>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <p>Theo dõi trạng thái vận chuyển trong mục đơn mua.</p>
              <p>Tiếp tục mua sắm thêm nhiều sản phẩm khác.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/user/purchase"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <ShoppingBag size={16} />
              <span>Xem đơn hàng</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium"
              style={{ borderColor: '#d1c9c0', color: 'var(--color-text-main)' }}
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center">Đang tải...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
