'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { cartService, type Cart } from '@/services/cart'
import { useAuth } from '@/contexts/auth-context'
import { formatPriceVND as formatPrice } from '@/lib/formatters'

const CART_UPDATED_EVENT = 'cart:updated'

export function CartDropdown() {
  const { session } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchCart = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const data = await cartService.getMyCart()
      setCart(data)
    } catch { /* ignore */ } finally {
      setLoading(false)
      setFetched(true)
    }
  }, [session])

  // Fetch once on mount (for badge count)
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // Refresh cart when other pages update it (add/remove/update)
  useEffect(() => {
    const onCartUpdated = () => {
      fetchCart()
    }
    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated)
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated)
  }, [fetchCart])

  const handleMouseEnter = () => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current)
    setClosing(false)
    setOpen(true)
    if (!fetched) fetchCart()
  }

  const handleMouseLeave = () => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current)
    setClosing(true)
    animTimerRef.current = setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 150)
  }

  const items = cart?.items ?? []
  // Chỉ hiển thị sản phẩm khác nhau (group theo productId) để giống Shopee
  const uniqueItems = (() => {
    const seen = new Set<string>()
    const result: typeof items = []
    for (const it of items) {
      if (seen.has(it.productId)) continue
      seen.add(it.productId)
      result.push(it)
    }
    return result
  })()
  const previewItems = uniqueItems.slice(0, 5)
  const totalItems = uniqueItems.length

  return (
    <>
      <style>{`
        @keyframes notif-enter {
          from { opacity: 0; transform: scale(0.95) translateY(-6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes notif-leave {
          from { opacity: 1; transform: scale(1)    translateY(0); }
          to   { opacity: 0; transform: scale(0.95) translateY(-6px); }
        }
        .notif-enter { animation: notif-enter 150ms ease forwards; transform-origin: top right; }
        .notif-leave { animation: notif-leave 150ms ease forwards; transform-origin: top right; }
      `}</style>
      <div
        ref={containerRef}
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
      {/* Cart icon + badge */}
      <Link
        href="/user/cart"
        className="flex items-center justify-center size-10 rounded-full transition-colors hover:bg-[#f0ebe4] relative"
        style={{ color: 'var(--color-text-main)' }}
      >
        <span className="material-symbols-outlined">shopping_cart</span>
        {totalItems > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-white text-[10px] font-bold leading-none"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </Link>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute right-0 top-full mt-1 w-[380px] bg-white rounded-lg shadow-xl border z-50 before:absolute before:-top-4 before:right-0 before:w-full before:h-4 before:bg-transparent ${closing ? 'notif-leave' : 'notif-enter'}`}
          style={{ borderColor: '#e5ded6' }}
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b" style={{ borderColor: '#e5ded6' }}>
            <p className="text-sm text-muted-foreground">Sản Phẩm Mới Thêm</p>
          </div>

          {/* Items */}
          {loading && !fetched ? (
            <div className="flex justify-center py-8">
              <div
                className="size-5 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
              />
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center">
              <span className="material-symbols-outlined text-[40px] text-muted-foreground block">
                shopping_cart
              </span>
              <p className="text-sm text-muted-foreground mt-2">Chưa có sản phẩm</p>
            </div>
          ) : (
            <>
              <div className="max-h-[300px] overflow-y-auto">
                {previewItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.productSlug ? `/products/${item.productSlug}` : `/user/cart`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#faf8f6] transition-colors"
                  >
                    <div
                      className="size-10 shrink-0 rounded border bg-gray-50 overflow-hidden"
                      style={{ borderColor: '#e5ded6' }}
                    >
                      {item.productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-muted-foreground text-[16px]">
                            image
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm truncate"
                        style={{ color: 'var(--color-text-main)' }}
                      >
                        {item.productName}
                      </p>
                    </div>
                    <span
                      className="text-sm font-semibold shrink-0"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {formatPrice(item.unitPrice)}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between px-4 py-2.5 border-t"
                style={{ borderColor: '#e5ded6' }}
              >
                <p className="text-xs text-muted-foreground">
                  {uniqueItems.length > 5
                    ? `+${uniqueItems.length - 5} sản phẩm khác`
                    : `${uniqueItems.length} sản phẩm`}
                </p>
                <Link
                  href="/user/cart"
                  className="px-4 py-1.5 rounded text-white text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Xem Giỏ Hàng
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </>
  )
}
