'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ProfileSidebar } from '@/app/user/profile/_components/profile-sidebar'
import Link from 'next/link'
import dynamic from 'next/dynamic'

import { MainStorefrontHeader } from '@/components/layout/main-storefront-header'

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
      <MainStorefrontHeader />

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
