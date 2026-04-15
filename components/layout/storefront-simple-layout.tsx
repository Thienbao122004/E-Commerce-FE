"use client"

import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { MainStorefrontHeader } from "@/components/layout/main-storefront-header"

type Props = {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function StorefrontSimpleLayout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8f7f6" }}>
      <MainStorefrontHeader />
      <main className="flex-1 w-full max-w-[900px] mx-auto px-4 md:px-10 py-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-main, #1a1a1a)" }}>
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm md:text-base text-muted-foreground">{subtitle}</p>
        ) : null}
        <div className="mt-8 space-y-6 text-sm md:text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
          {children}
        </div>
      </main>
      <Separator className="bg-gray-200" />
      <footer className="py-8 px-4 md:px-10">
        <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row flex-wrap gap-4 sm:justify-between sm:items-center text-xs md:text-sm text-gray-500">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/help" className="hover:text-[var(--color-primary)] transition-colors">
              Trợ giúp
            </Link>
            <Link href="/contact" className="hover:text-[var(--color-primary)] transition-colors">
              Liên hệ
            </Link>
            <Link href="/privacy" className="hover:text-[var(--color-primary)] transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="/terms" className="hover:text-[var(--color-primary)] transition-colors">
              Điều khoản dịch vụ
            </Link>
          </div>
          <Link href="/" className="text-gray-600 hover:text-[var(--color-primary)] transition-colors shrink-0">
            ← Về trang chủ
          </Link>
        </div>
      </footer>
    </div>
  )
}
