'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, ArrowLeft, ReceiptText, RotateCcw } from 'lucide-react'

export default function PaymentFailedPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || 'Thanh toán thất bại. Vui lòng thử lại.'

  return (
    <div
      className="min-h-screen grid place-items-center px-4 py-10"
      style={{ background: 'linear-gradient(180deg, #f8f7f6 0%, #fff6f6 100%)' }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-white" style={{ borderColor: '#e5ded6' }}>
        <div className="grid gap-4 border-b px-8 py-8" style={{ borderColor: '#f1e9e0' }}>
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-[rgba(220,38,38,0.12)]">
              <AlertTriangle size={24} color="#dc2626" />
            </div>
            <div className="grid gap-1">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-main)' }}>
                Thanh toán chưa thành công
              </h1>
              <p className="text-sm text-muted-foreground">
                Giao dịch chưa hoàn tất. Bạn có thể thử lại hoặc kiểm tra đơn mua.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border bg-[rgba(220,38,38,0.04)] p-4" style={{ borderColor: '#f2d3d3' }}>
            <ReceiptText size={16} className="shrink-0" color="#dc2626" />
            <p className="text-sm text-[#7f1d1d]">{message}</p>
          </div>
        </div>

        <div className="grid gap-4 px-8 py-6">
          <div className="grid gap-2 rounded-xl border p-4" style={{ borderColor: '#efe8de' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-main)' }}>
              Gợi ý xử lý
            </h2>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <p>Kiểm tra số dư hoặc hạn mức phương thức thanh toán.</p>
              <p>Thử lại giao dịch hoặc chọn phương thức khác trong checkout.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/user/purchase"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <RotateCcw size={16} />
              <span>Về đơn mua</span>
            </Link>
            <Link
              href="/user/cart"
              className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium"
              style={{ borderColor: '#d1c9c0', color: 'var(--color-text-main)' }}
            >
              <ArrowLeft size={16} />
              <span>Quay lại giỏ hàng</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
