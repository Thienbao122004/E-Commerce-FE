'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ordersService, type OrderSummary } from '@/services/orders'

const STATUS_TABS = [
  { label: 'Tất cả', value: undefined },
  { label: 'Chờ thanh toán', value: 0 },
  { label: 'Chờ xác nhận', value: 1 },
  { label: 'Vận chuyển', value: 4 },
  { label: 'Hoàn thành', value: 6 },
  { label: 'Đã hủy', value: 7 },
  { label: 'Trả hàng/Hoàn tiền', value: 8 },
] as const

const STATUS_LABELS: Record<number, string> = {
  0: 'Chờ thanh toán',
  1: 'Chờ xác nhận',
  2: 'Đã xác nhận',
  3: 'Đang chuẩn bị',
  4: 'Đang giao hàng',
  5: 'Đã giao hàng',
  6: 'Hoàn thành',
  7: 'Đã hủy',
  8: 'Trả hàng/Hoàn tiền',
}

const STATUS_COLORS: Record<number, string> = {
  0: '#d97706',
  1: '#2563eb',
  2: '#1d4ed8',
  3: '#7c3aed',
  4: '#ea580c',
  5: '#16a34a',
  6: '#15803d',
  7: '#6b7280',
  8: '#dc2626',
}

export default function PurchasePage() {
  const [activeTab, setActiveTab] = useState<number | undefined>(undefined)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchOrders = useCallback(async (status?: number) => {
    setLoading(true)
    try {
      const res = await ordersService.getMyOrders(1, 50, status)
      setOrders(Array.isArray(res.orders) ? res.orders : [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders(activeTab)
  }, [activeTab, fetchOrders])

  const filtered = searchTerm
    ? orders.filter(
        (o) =>
          o.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.items.some((i) => i.productName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : orders

  return (
    <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#e5ded6' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: '#e5ded6' }}>
        <span className="material-symbols-outlined text-muted-foreground text-[20px]">search</span>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên Shop hoặc tên Sản phẩm"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--color-text-main)' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.value
          return (
            <button
              key={String(tab.value)}
              onClick={() => {
                setActiveTab(tab.value)
                setSearchTerm('')
              }}
              className="flex-shrink-0 px-4 py-3 text-sm transition-colors border-b-2"
              style={{
                borderBottomColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="size-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border py-20 text-center" style={{ borderColor: '#e5ded6' }}>
          <span className="material-symbols-outlined text-[64px] text-muted-foreground block">
            receipt_long
          </span>
          <p className="text-muted-foreground mt-3">Chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} onRefresh={() => fetchOrders(activeTab)} />
          ))}
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, onRefresh }: { order: OrderSummary; onRefresh: () => void }) {
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await ordersService.confirmOrder(order.id)
      onRefresh()
    } catch {
      // ignore
    } finally {
      setConfirming(false)
    }
  }

  const statusColor = STATUS_COLORS[order.status] ?? '#6b7280'
  const statusLabel = STATUS_LABELS[order.status] ?? order.statusName

  return (
    <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#e5ded6' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#e5ded6' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--color-primary)' }}>
            storefront
          </span>
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text-main)' }}>
            {order.shopName}
          </span>
        </div>
        <span className="text-sm font-semibold" style={{ color: statusColor }}>
          {statusLabel}
        </span>
      </div>

      <div className="px-4 divide-y" style={{ borderColor: '#e5ded6' }}>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 py-4">
            <div className="size-16 shrink-0 rounded border bg-gray-50 overflow-hidden" style={{ borderColor: '#e5ded6' }}>
              {item.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnailUrl} alt={item.productName} className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-muted-foreground text-[28px]">image</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2" style={{ color: 'var(--color-text-main)' }}>
                {item.productName}
              </p>
              {item.variantName && <p className="text-xs text-muted-foreground mt-0.5">Phân loại hàng: {item.variantName}</p>}
              <p className="text-xs text-muted-foreground mt-0.5">x{item.quantity}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm" style={{ color: 'var(--color-primary)' }}>
                {item.unitPrice.toLocaleString('vi-VN')}đ
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t flex flex-col gap-3" style={{ borderColor: '#e5ded6' }}>
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">Thành tiền:</span>
          <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {order.totalAmount.toLocaleString('vi-VN')}đ
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {(order.status === 4 || order.status === 5) && (
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="text-sm px-4 py-1.5 rounded text-white transition-opacity disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {confirming ? 'Đang xử lý...' : 'Đã nhận được hàng'}
              </button>
            )}
            <Link
              href={`/user/purchase/${order.id}`}
              className="text-sm px-4 py-1.5 rounded border hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#d1c9c0', color: 'var(--color-text-secondary)' }}
            >
              Xem Chi Tiết
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
