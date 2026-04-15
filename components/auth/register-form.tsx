'use client'

import { useState } from 'react'
import { signUp } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function RegisterForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await signUp({ email, password, fullName })
      setSuccess(true)
      // Note: If email confirmation is required, user will receive an email
      // Otherwise, they can login immediately
    } catch (err: any) {
      setError(err.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-[440px] flex flex-col gap-6">
        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
            <h3 className="font-bold text-lg">Đăng ký thành công!</h3>
          </div>
          <p className="text-sm">Vui lòng kiểm tra email để xác nhận tài khoản của bạn.</p>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-sm shadow-primary/30 transition-all duration-200 flex items-center justify-center gap-2 group"
        >
          Đăng nhập ngay
          <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[440px] flex flex-col gap-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-main dark:text-gray-200" htmlFor="fullName">
            Họ và tên
          </label>
          <div className="relative group">
            <input
              className="w-full h-12 px-4 rounded-lg border border-[#e7dbcf] dark:border-[#4a3b2f] bg-white dark:bg-surface-dark text-text-main dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              id="fullName"
              name="fullName"
              placeholder="Nguyễn Văn A"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-main dark:text-gray-200" htmlFor="email">
            Email
          </label>
          <div className="relative group">
            <input
              className="w-full h-12 px-4 rounded-lg border border-[#e7dbcf] dark:border-[#4a3b2f] bg-white dark:bg-surface-dark text-text-main dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              id="email"
              name="email"
              placeholder="Nhập vào địa chỉ email của bạn"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-main dark:text-gray-200" htmlFor="password">
            Mật khẩu
          </label>
          <div className="relative group">
            <input
              className="w-full h-12 px-4 rounded-lg border border-[#e7dbcf] dark:border-[#4a3b2f] bg-white dark:bg-surface-dark text-text-main dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              id="password"
              name="password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary dark:text-gray-500">
            Tối thiểu 6 ký tự
          </p>
        </div>

        <button
          className="w-full h-12 mt-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-sm shadow-primary/30 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </form>

      <div className="text-center mt-2">
        <p className="text-text-main dark:text-gray-300">
          Bạn đã có tài khoản?
          <Link className="font-semibold text-primary hover:text-primary-hover hover:underline ml-1" href="/login">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
