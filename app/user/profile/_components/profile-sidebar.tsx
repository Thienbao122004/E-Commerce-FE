'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const accountLinks = [
  { href: '/user/profile', label: 'Hồ Sơ', icon: 'person' },
  { href: '/user/profile/addresses', label: 'Địa Chỉ', icon: 'location_on' },
  { href: '/user/profile/change-password', label: 'Đổi Mật Khẩu', icon: 'lock' },
]

const orderLinks = [
  { href: '/user/purchase', label: 'Đơn Mua', icon: 'receipt_long' },
]

export function ProfileSidebar() {
  const pathname = usePathname()
  const { user, profile, avatarUrl } = useAuth()

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Người dùng'
  const initials = displayName
    ? displayName
        .split(' ')
        .map((w) => w[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <aside className="w-[220px] shrink-0">
      {/* User Info */}
      <div className="flex items-center gap-3 pb-5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="size-12 rounded-full object-cover shrink-0 ring-2 ring-border"
          />
        ) : (
          <span
            className="size-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {initials}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-main)' }}>
            {displayName}
          </p>
          <Link
            href="/user/profile"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Sửa Hồ Sơ
          </Link>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Tài Khoản Của Tôi */}
      <div className="mb-2">
        <div className="flex items-center gap-2 px-2 py-2">
          <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--color-primary)' }}>
            person
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-main)' }}>
            Tài Khoản Của Tôi
          </span>
        </div>
        <nav className="flex flex-col">
          {accountLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-2 pl-9 pr-2 py-2 text-sm rounded-md transition-colors',
                pathname === link.href
                  ? 'font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              style={pathname === link.href ? { color: 'var(--color-primary)' } : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Đơn Mua */}
      {orderLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors',
            pathname === link.href
              ? 'font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
          style={pathname === link.href ? { color: 'var(--color-primary)' } : undefined}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--color-primary)' }}>
            {link.icon}
          </span>
          {link.label}
        </Link>
      ))}
    </aside>
  )
}
