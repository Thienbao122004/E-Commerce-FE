'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { SearchBox } from './search-box'

const HeaderUser = dynamic(
  () => import('@/components/layout/header-user').then((m) => m.HeaderUser),
  { ssr: false, loading: () => <div className="size-10 shrink-0" /> }
)

const CartDropdown = dynamic(
  () => import('@/components/layout/cart-dropdown').then((m) => m.CartDropdown),
  { ssr: false, loading: () => <div className="size-10 shrink-0" /> }
)

const NotificationDropdown = dynamic(
  () => import('@/components/layout/notification-dropdown').then((m) => m.NotificationDropdown),
  { ssr: false, loading: () => <div className="size-10 shrink-0" /> }
)

export function MainStorefrontHeader() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(248,247,246,0.96)', borderColor: '#e5ded6' }}
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/favicon.ico" alt="EcomViet" className="size-9 object-contain" style={{ mixBlendMode: "multiply" }} />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight hidden sm:block" style={{ color: 'var(--color-text-main)' }}>
            EcomViet
          </h1>
        </Link>

        {/* Bọc SearchBox trong Suspense vì nó dùng useSearchParams */}
        <Suspense fallback={<div className="flex-1 max-w-2xl h-11 bg-gray-100 rounded-xl mx-4 animate-pulse" />}>
          <SearchBox />
        </Suspense>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <HeaderUser />
          <NotificationDropdown />
          <CartDropdown />
        </div>
      </div>
    </header>
  )
}
