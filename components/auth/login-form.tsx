'use client'

import { useState } from 'react'
import { signIn } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await signIn({ email, password })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
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
          <label className="text-sm font-semibold text-text-main dark:text-gray-200" htmlFor="email">
            Email
          </label>
          <div className="relative group">
            <input
              className="w-full h-12 px-4 rounded-lg border border-[#e7dbcf] dark:border-[#4a3b2f] bg-white dark:bg-surface-dark text-text-main dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              id="email"
              name="email"
              placeholder="name@example.com"
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
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-text-main dark:text-gray-200" htmlFor="password">
              Mật khẩu
            </label>
            <a tabIndex={-1} className="text-sm font-medium text-primary hover:text-primary-hover hover:underline transition-colors" href="#">
              Quên mật khẩu?
            </a>
          </div>
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
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
          </div>
        </div>

        <button
          className="w-full h-12 mt-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-sm shadow-primary/30 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </form>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-[#e7dbcf] dark:border-[#4a3b2f]"></div>
        <span className="flex-shrink mx-4 text-sm text-text-secondary dark:text-gray-500">
          Hoặc đăng nhập với
        </span>
        <div className="flex-grow border-t border-[#e7dbcf] dark:border-[#4a3b2f]"></div>
      </div>

      <button
        className="w-full h-12 bg-white dark:bg-surface-dark border border-[#e7dbcf] dark:border-[#4a3b2f] hover:bg-gray-50 dark:hover:bg-[#36291e] text-text-main dark:text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-3"
        type="button"
      >
        <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span>Đăng nhập với Google</span>
      </button>

      <div className="text-center mt-2">
        <p className="text-text-main dark:text-gray-300">
          Bạn chưa có tài khoản?
          <a className="font-semibold text-primary hover:text-primary-hover hover:underline ml-1" href="/register">
            Đăng ký
          </a>
        </p>
      </div>
    </div>
  )
}
