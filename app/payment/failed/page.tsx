'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, Home, ShoppingBag } from 'lucide-react'

function PaymentFailedContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') ?? 'Thanh toán không thành công.'
  const orderCode = searchParams.get('orderCode')

  return (
    <div
      className="min-h-screen grid place-items-center px-4 py-10"
      style={{ background: 'linear-gradient(180deg, #f8f7f6 0%, #fff8f2 100%)' }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-white" style={{ borderColor: '#e5ded6' }}>
        <div className="grid gap-4 border-b px-8 py-8" style={{ borderColor: '#f1e9e0' }}>
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-[rgba(220,38,38,0.12)]">
              <AlertCircle size={24} color="#b91c1c" />
            </div>
            <div className="grid gap-1">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-main)' }}>
                Thanh toán thất bại
              </h1>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>

          {orderCode ? (
            <div className="rounded-xl bg-[rgba(236,127,19,0.06)] p-4">
              <span className="text-xs text-muted-foreground">Mã đơn hàng</span>
              <p className="mt-1 text-lg font-medium break-all">{orderCode}</p>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 px-8 py-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/user/purchase"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <ShoppingBag size={16} />
              <span>Đơn hàng của tôi</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium"
              style={{ borderColor: '#d1c9c0', color: 'var(--color-text-main)' }}
            >
              <Home size={16} />
              <span>{'V\u1ec1 trang ch\u1ee7'}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaymentFailedFallback() {
  return (
    <div
      className="min-h-screen grid place-items-center px-4 py-10"
      style={{ background: 'linear-gradient(180deg, #f8f7f6 0%, #fff8f2 100%)' }}
    >
      <p className="text-sm text-muted-foreground">Đang tải...</p>
    </div>
  )
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<PaymentFailedFallback />}>
      <PaymentFailedContent />
    </Suspense>
  )
}
