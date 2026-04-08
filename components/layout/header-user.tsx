"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

export function HeaderUser() {
  const { session, user, profile, avatarUrl, isLoading, signOut } = useAuth()
  const router = useRouter()
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [avatarUrl])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1">
        <div className="size-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
        <div className="h-3 w-20 rounded bg-gray-200 animate-pulse hidden sm:block" />
      </div>
    )
  }

  if (session) {
    const displayName = profile?.full_name || user?.email?.split("@")[0] || ""
    const initials = displayName
      ? displayName.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase()
      : "U"

    const handleSignOut = async () => {
      await signOut()
      router.push("/login")
      router.refresh()
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 px-2 py-1 rounded-full transition-colors hover:bg-[#f0ebe4] max-w-[180px] focus:outline-none"
          >
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="size-8 rounded-full object-cover shrink-0 ring-2 ring-[#f0ebe4]"
                onError={() => setImgError(true)}
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
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href="/user/profile">Hồ sơ của tôi</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/user/purchase">Đơn mua</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
