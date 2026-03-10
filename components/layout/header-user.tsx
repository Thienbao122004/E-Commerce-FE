"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export function HeaderUser() {
  const { session, user, profile, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1">
        <div className="size-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
        <div className="h-3 w-20 rounded bg-gray-200 animate-pulse hidden sm:block" />
      </div>
    )
  }

  if (session) {
    const displayName = profile?.full_name ?? user?.email?.split("@")[0] ?? ""
    const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
    const initials = displayName
      ? displayName.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase()
      : "U"

    return (
      <Link
        href="/profile"
        className="flex items-center gap-2 px-2 py-1 rounded-full transition-colors hover:bg-[#f0ebe4] max-w-[160px]"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="size-8 rounded-full object-cover shrink-0 ring-2 ring-[#f0ebe4]"
          />
        ) : (
          <span
            className="size-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {initials}
          </span>
        )}
        {displayName && (
          <span
            className="text-sm font-semibold truncate hidden sm:block"
            style={{ color: "var(--color-text-main)" }}
          >
            {displayName}
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link
      href="/login"
      className="flex items-center justify-center size-10 rounded-full transition-colors hover:bg-[#f0ebe4]"
      style={{ color: "var(--color-text-main)" }}
    >
      <span className="material-symbols-outlined">person</span>
    </Link>
  )
}
