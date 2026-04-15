'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const accountLinks = [
  { href: '/user/profile', label: 'Hồ Sơ', icon: 'person' },
  { href: '/user/profile/addresses', label: 'Địa Chỉ', icon: 'location_on' },
  { href: '/user/profile/change-password', label: 'Đổi Mật Khẩu', icon: 'lock' },
  { href: '/user/profile/wallet', label: 'Ví Của Tôi', icon: 'account_balance_wallet' },
  { href: '/user/register-seller', label: 'Đăng Ký Seller', icon: 'storefront' },
]

const orderLinks = [
  { href: '/user/purchase', label: 'Đơn Mua', icon: 'receipt_long' },
]

const allLinks = [...accountLinks, ...orderLinks]

export function ProfileSidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()
  const { user, profile, avatarUrl } = useAuth()
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [avatarUrl])

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Người dùng'
  const initials = displayName
    ? displayName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()
    : 'U'

  /* ── Mobile: tab bar ngang cuộn ─────────────────────── */
  if (mobile) {
    return (
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {/* User info strip */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          {avatarUrl && !imgError ? (
            <img src={avatarUrl} alt={displayName}
              className="size-9 rounded-full object-cover shrink-0 ring-1 ring-border"
              onError={() => setImgError(true)} />
          ) : (
            <span className="size-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {initials}
            </span>
          )}
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-main)' }}>
            {displayName}
          </p>
        </div>
        {/* Scrollable tab row */}
        <nav className="flex overflow-x-auto gap-1 px-2 py-1.5 scrollbar-none">
          {allLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                  active
                    ? 'text-white'
                    : 'text-muted-foreground hover:bg-muted/60'
                )}
                style={active ? { backgroundColor: 'var(--color-primary)' } : undefined}
              >
                <span className="material-symbols-outlined text-[15px]">{link.icon}</span>
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    )
  }

  /* ── Desktop: sidebar dọc ──────────────────────────── */
  return (
    <aside className="w-[220px] shrink-0">
      {/* User Info */}
      <div className="flex items-center gap-3 pb-5">
        {avatarUrl && !imgError ? (
          <img src={avatarUrl} alt={displayName}
            className="size-12 rounded-full object-cover shrink-0 ring-2 ring-border"
            onError={() => setImgError(true)} />
        ) : (
          <span className="size-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            {initials}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-main)' }}>
            {displayName}
          </p>
          <Link href="/user/profile"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Sửa Hồ Sơ
          </Link>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Tài Khoản */}
      <div className="mb-2">
        <div className="flex items-center gap-2 px-2 py-2">
          <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--color-primary)' }}>person</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-main)' }}>Tài Khoản</span>
        </div>
        <nav className="flex flex-col">
          {accountLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className={cn(
                'flex items-center gap-2 pl-9 pr-2 py-2 text-sm rounded-md transition-colors',
                pathname === link.href ? 'font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              style={pathname === link.href ? { color: 'var(--color-primary)' } : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Đơn Mua */}
      {orderLinks.map((link) => (
        <Link key={link.href} href={link.href}
          className={cn(
            'flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors',
            pathname === link.href ? 'font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
          style={pathname === link.href ? { color: 'var(--color-primary)' } : undefined}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--color-primary)' }}>{link.icon}</span>
          {link.label}
        </Link>
      ))}
    </aside>
  )
}
