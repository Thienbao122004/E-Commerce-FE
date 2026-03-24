'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ProfileSidebar } from '@/app/user/profile/_components/profile-sidebar'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const HeaderUser = dynamic(
  () => import('@/components/layout/header-user').then((m) => m.HeaderUser),
  { ssr: false, loading: () => <div className="size-10 shrink-0" /> }
)

const CartDropdown = dynamic(
  () => import('@/components/layout/cart-dropdown').then((m) => m.CartDropdown),
  { ssr: false, loading: () => <div className="size-10 shrink-0" /> }
)

const FULL_WIDTH_PATHS = ['/user/cart', '/user/ai-chat', '/user/checkout']

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { session, isLoading, role } = useAuth()
  const pathname = usePathname()
  const isFullWidth = FULL_WIDTH_PATHS.some((p) => pathname.startsWith(p))

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        window.location.href = '/login'
      } else if (role === 'admin') {
        window.location.href = '/admin/dashboard'
      } else if (role === 'seller') {
        window.location.href = '/seller/dashboard'
      }
    }
  }, [isLoading, session, role])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background-light)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background-light)', color: 'var(--color-text-main)' }}>
      <header
        className="sticky top-0 z-50 w-full border-b backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(248,247,246,0.96)', borderColor: '#e5ded6' }}
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--color-primary)' }}>
              local_florist
            </span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)' }}>
              EcomViet
            </h1>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div
              className="flex w-full items-center rounded-lg overflow-hidden border border-transparent"
              style={{ backgroundColor: '#f0ebe4' }}
            >
              <div className="flex items-center pl-3" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm, shop, thương hiệu..."
                className="w-full bg-transparent border-none py-2.5 px-3 text-sm focus:ring-0 focus:outline-none placeholder:text-gray-400"
                style={{ color: 'var(--color-text-main)' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <Link
              href="/user/ai-chat"
              className="flex items-center justify-center size-10 rounded-full transition-colors hover:bg-[#f0ebe4]"
              style={{ color: 'var(--color-text-main)' }}
              title="Chat với AI mua sắm"
            >
              <span className="material-symbols-outlined">smart_toy</span>
            </Link>
            <HeaderUser />
            <CartDropdown />
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 md:px-10 py-6">
        {isFullWidth ? (
          <div className="w-full">{children}</div>
        ) : (
          <div className="flex gap-6">
            <ProfileSidebar />
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        )}
      </main>
    </div>
  )
}
