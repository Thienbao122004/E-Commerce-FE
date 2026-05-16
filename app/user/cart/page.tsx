'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cartService, type Cart, type CartItem } from '@/services/cart'
import { toast } from 'sonner'
import { formatPriceVND as formatPrice } from '@/lib/formatters'

const CART_UPDATED_EVENT = 'cart:updated'
const CHECKOUT_SELECTED_IDS_KEY = 'checkout:selected-item-ids'

function getSafeQuantityInput(value: string, stockAvailable: number): string {
  const digitsOnly = value.replace(/\D/g, '')
  if (!digitsOnly) return '1'

  const parsed = Number(digitsOnly)
  if (Number.isNaN(parsed) || parsed < 1) return '1'

  if (stockAvailable > 0) {
    return String(Math.min(parsed, stockAvailable))
  }

  return String(parsed)
}

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({})

  const fetchCart = useCallback(async () => {
    try {
      const data = await cartService.getMyCart()
      setCart(data)
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCart() }, [fetchCart])

  const items = cart?.items ?? []

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id); else s.add(id)
      return s
    })

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)))
    }
  }

  const updateItemQuantity = async (item: CartItem, newQty: number) => {
    const maxStock = item.stockAvailable > 0 ? item.stockAvailable : Number.MAX_SAFE_INTEGER
    const safeQty = Math.min(Math.max(1, newQty), maxStock)

    if (item.stockAvailable > 0 && newQty > item.stockAvailable) {
      toast.error(`Số lượng tối đa cho sản phẩm này là ${item.stockAvailable}`)
    }

    if (safeQty === item.quantity) {
      setQuantityDrafts((prev) => {
        const next = { ...prev }
        delete next[item.id]
        return next
      })
      return
    }

    setUpdatingIds((p) => new Set(p).add(item.id))
    try {
      await cartService.updateItem(item.id, { quantity: safeQty })
      setCart((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id
              ? { ...i, quantity: safeQty, lineTotal: i.unitPrice * safeQty }
              : i
          ),
          subtotal: prev.items.reduce(
            (sum, i) => sum + (i.id === item.id ? i.unitPrice * safeQty : i.lineTotal),
            0
          ),
          totalItems: prev.items.reduce(
            (sum, i) => sum + (i.id === item.id ? safeQty : i.quantity),
            0
          ),
        }
      })
      setQuantityDrafts((prev) => {
        const next = { ...prev }
        delete next[item.id]
        return next
      })
      window.dispatchEvent(new Event(CART_UPDATED_EVENT))
    } catch {
      toast.error('Cập nhật thất bại')
    } finally {
      setUpdatingIds((p) => { const s = new Set(p); s.delete(item.id); return s })
    }
  }

  const updateQuantity = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta
    await updateItemQuantity(item, newQty)
  }

  const removeItem = async (itemId: string) => {
    setUpdatingIds((p) => new Set(p).add(itemId))
    try {
      await cartService.removeItem(itemId)
      setCart((prev) => {
        if (!prev) return prev
        const newItems = prev.items.filter((i) => i.id !== itemId)
        return {
          ...prev,
          items: newItems,
          subtotal: newItems.reduce((s, i) => s + i.lineTotal, 0),
          totalItems: newItems.reduce((s, i) => s + i.quantity, 0),
        }
      })
      setSelectedIds((prev) => { const s = new Set(prev); s.delete(itemId); return s })
      setQuantityDrafts((prev) => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
      window.dispatchEvent(new Event(CART_UPDATED_EVENT))
      toast.success('Đã xóa khỏi giỏ hàng')
    } catch {
      toast.error('Xóa thất bại')
    } finally {
      setUpdatingIds((p) => { const s = new Set(p); s.delete(itemId); return s })
    }
  }

  const removeSelected = async () => {
    const ids = Array.from(selectedIds)
    for (const id of ids) {
      await removeItem(id)
    }
  }

  const selectedTotal = items
    .filter((i) => selectedIds.has(i.id))
    .reduce((sum, i) => sum + i.lineTotal, 0)

  const selectedCount = items
    .filter((i) => selectedIds.has(i.id))
    .reduce((sum, i) => sum + i.quantity, 0)

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div
          className="size-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!cart || items.length === 0) {
    return (
      <div className="bg-white rounded-lg border py-20 text-center" style={{ borderColor: '#e5ded6' }}>
        <span className="material-symbols-outlined text-[64px] text-muted-foreground block">
          shopping_cart
        </span>
        <p className="text-muted-foreground mt-3">Giỏ hàng của bạn đang trống</p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-2 rounded text-white text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Mua sắm ngay
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="hidden md:grid items-center gap-4 px-5 py-3 rounded-t-lg text-sm text-muted-foreground"
        style={{
          gridTemplateColumns: '40px 1fr 140px 140px 140px 140px 80px',
          backgroundColor: '#faf8f6',
          border: '1px solid #e5ded6',
        }}
      >
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={selectedIds.size === items.length && items.length > 0}
            onChange={toggleSelectAll}
            className="size-4 accent-[var(--color-primary)] cursor-pointer"
          />
        </div>
        <span>Sản Phẩm</span>
        <span className="text-center">Đơn Giá</span>
        <span className="text-center">Số Lượng</span>
        <span className="text-center">Số Tiền</span>
        <span className="text-center">Thao Tác</span>
        <span />
      </div>

      {/* Items */}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg border overflow-hidden transition-shadow hover:shadow-sm"
            style={{ borderColor: '#e5ded6' }}
          >
            {/* ── Desktop layout ── */}
            <div
              className="hidden md:grid items-center gap-4 px-5 py-4"
              style={{ gridTemplateColumns: '40px 1fr 140px 140px 140px 80px' }}
            >
              <div className="flex justify-center">
                <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)}
                  className="size-4 accent-[var(--color-primary)] cursor-pointer" />
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-16 shrink-0 rounded border bg-gray-50 overflow-hidden" style={{ borderColor: '#e5ded6' }}>
                  {item.productImage
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.productImage} alt={item.productName} className="size-full object-cover" />
                    : <div className="size-full flex items-center justify-center"><span className="material-symbols-outlined text-muted-foreground text-[28px]">image</span></div>
                  }
                </div>
                <div className="min-w-0">
                  <Link href={`/products/${item.productId}`} className="text-sm font-medium line-clamp-2 hover:text-[var(--color-primary)] transition-colors" style={{ color: 'var(--color-text-main)' }}>{item.productName}</Link>
                  {item.variantName && <p className="text-xs text-muted-foreground mt-0.5">Phân loại: {item.variantName}</p>}
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                    Còn {item.stockAvailable} sản phẩm
                  </p>
                </div>
              </div>
              <div className="text-center text-sm" style={{ color: 'var(--color-text-main)' }}>{formatPrice(item.unitPrice)}</div>
              <div className="flex items-center justify-center">
                <div className="flex items-center border rounded" style={{ borderColor: '#d1c9c0' }}>
                  <button onClick={() => updateQuantity(item, -1)} disabled={item.quantity <= 1 || updatingIds.has(item.id)} className="w-8 h-8 flex items-center justify-center text-sm hover:bg-gray-50 disabled:opacity-40">−</button>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={quantityDrafts[item.id] ?? String(item.quantity)}
                    onChange={(e) => setQuantityDrafts((prev) => ({ ...prev, [item.id]: getSafeQuantityInput(e.target.value, item.stockAvailable) }))}
                    onBlur={() => { const d = getSafeQuantityInput(quantityDrafts[item.id] ?? String(item.quantity), item.stockAvailable); setQuantityDrafts((p) => ({ ...p, [item.id]: d })); void updateItemQuantity(item, Number(d)) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                    disabled={updatingIds.has(item.id)} className="w-12 h-8 text-center text-sm border-x bg-transparent focus:outline-none disabled:opacity-60" style={{ borderColor: '#d1c9c0', color: 'var(--color-text-main)' }} />
                  <button onClick={() => updateQuantity(item, 1)} disabled={updatingIds.has(item.id) || (item.stockAvailable > 0 && item.quantity >= item.stockAvailable)} className="w-8 h-8 flex items-center justify-center text-sm hover:bg-gray-50 disabled:opacity-40">+</button>
                </div>
              </div>
              <div className="text-center text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>{formatPrice(item.lineTotal)}</div>
              <div className="text-center">
                <button onClick={() => removeItem(item.id)} disabled={updatingIds.has(item.id)} className="text-sm hover:text-[var(--color-primary)] transition-colors disabled:opacity-40" style={{ color: 'var(--color-text-secondary)' }}>Xóa</button>
              </div>
            </div>

            {/* ── Mobile layout (card) ── */}
            <div className="md:hidden flex gap-3 px-3 py-3">
              <div className="flex flex-col items-center gap-2 pt-0.5">
                <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="size-4 accent-[var(--color-primary)] cursor-pointer" />
                <div className="size-20 rounded border bg-gray-50 overflow-hidden shrink-0" style={{ borderColor: '#e5ded6' }}>
                  {item.productImage
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.productImage} alt={item.productName} className="size-full object-cover" />
                    : <div className="size-full flex items-center justify-center"><span className="material-symbols-outlined text-muted-foreground text-[24px]">image</span></div>
                  }
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <Link href={`/products/${item.productId}`} className="text-sm font-medium line-clamp-2 leading-snug hover:text-[var(--color-primary)]" style={{ color: 'var(--color-text-main)' }}>{item.productName}</Link>
                {item.variantName && <p className="text-xs text-muted-foreground">Phân loại: {item.variantName}</p>}
                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                  Còn {item.stockAvailable}
                </p>
                <p className="text-xs text-muted-foreground">Đơn giá: {formatPrice(item.unitPrice)}</p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center border rounded" style={{ borderColor: '#d1c9c0' }}>
                    <button onClick={() => updateQuantity(item, -1)} disabled={item.quantity <= 1 || updatingIds.has(item.id)} className="w-8 h-8 flex items-center justify-center text-sm hover:bg-gray-50 disabled:opacity-40">−</button>
                    <input type="text" inputMode="numeric" pattern="[0-9]*" value={quantityDrafts[item.id] ?? String(item.quantity)}
                      onChange={(e) => setQuantityDrafts((prev) => ({ ...prev, [item.id]: getSafeQuantityInput(e.target.value, item.stockAvailable) }))}
                      onBlur={() => { const d = getSafeQuantityInput(quantityDrafts[item.id] ?? String(item.quantity), item.stockAvailable); setQuantityDrafts((p) => ({ ...p, [item.id]: d })); void updateItemQuantity(item, Number(d)) }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                      disabled={updatingIds.has(item.id)} className="w-10 h-8 text-center text-sm border-x bg-transparent focus:outline-none disabled:opacity-60" style={{ borderColor: '#d1c9c0', color: 'var(--color-text-main)' }} />
                    <button onClick={() => updateQuantity(item, 1)} disabled={updatingIds.has(item.id) || (item.stockAvailable > 0 && item.quantity >= item.stockAvailable)} className="w-8 h-8 flex items-center justify-center text-sm hover:bg-gray-50 disabled:opacity-40">+</button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>{formatPrice(item.lineTotal)}</span>
                    <button onClick={() => removeItem(item.id)} disabled={updatingIds.has(item.id)} className="text-xs hover:text-red-500 transition-colors disabled:opacity-40" style={{ color: 'var(--color-text-secondary)' }}>Xóa</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer cố định */}
      <div
        className="sticky bottom-0 bg-white rounded-lg border flex items-center justify-between px-5 py-4 gap-4"
        style={{ borderColor: '#e5ded6' }}
      >
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.size === items.length && items.length > 0}
              onChange={toggleSelectAll}
              className="size-4 accent-[var(--color-primary)]"
            />
            <span className="text-sm" style={{ color: 'var(--color-text-main)' }}>
              Chọn Tất Cả ({items.length})
            </span>
          </label>
          {selectedIds.size > 0 && (
            <button
              onClick={removeSelected}
              className="text-sm hover:text-[var(--color-primary)] transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Xóa
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-sm text-muted-foreground">
              Tổng cộng ({selectedCount} sản phẩm):
            </span>
            <span className="text-xl font-bold ml-2" style={{ color: 'var(--color-primary)' }}>
              {formatPrice(selectedTotal)}
            </span>
          </div>
          <button
            onClick={() => {
              if (!cart?.id || selectedIds.size === 0) return
              try {
                sessionStorage.setItem(CHECKOUT_SELECTED_IDS_KEY, JSON.stringify(Array.from(selectedIds)))
              } catch {
                // Ignore storage errors, checkout page sẽ fallback về toàn bộ giỏ hàng.
              }
              router.push('/user/checkout')
            }}
            disabled={selectedIds.size === 0}
            className="px-8 py-2.5 rounded text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Mua Hàng
          </button>
        </div>
      </div>
    </div>
  )
}
