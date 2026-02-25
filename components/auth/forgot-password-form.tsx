'use client'

import { useState } from 'react'
import { resetPassword } from '@/lib/auth'
import Link from 'next/link'

export function ForgotPasswordForm() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await resetPassword(email)
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="w-full max-w-[440px] flex flex-col gap-6">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">
                            mark_email_read
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-text-main dark:text-white">
                        Kiểm tra email của bạn
                    </h2>
                    <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed">
                        Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{' '}
                        <span className="font-semibold text-text-main dark:text-white">{email}</span>.
                        Vui lòng kiểm tra hộp thư (và thư mục spam) của bạn.
                    </p>
                </div>

                <Link
                    href="/login"
                    className="w-full h-12 mt-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-sm shadow-primary/30 transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                    <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
                        arrow_back
                    </span>
                    Quay lại đăng nhập
                </Link>
            </div>
        )
    }

    return (
        <div className="w-full max-w-[440px] flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-text-main dark:text-white">
                    Quên mật khẩu?
                </h2>
                <p className="text-text-secondary dark:text-gray-400 text-sm">
                    Nhập email đã đăng ký và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn.
                </p>
            </div>

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

                <button
                    className="w-full h-12 mt-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-sm shadow-primary/30 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Đang gửi...' : 'Gửi hướng dẫn đặt lại'}
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                    </span>
                </button>
            </form>

            <div className="text-center mt-2">
                <p className="text-text-main dark:text-gray-300">
                    Bạn đã nhớ mật khẩu?
                    <Link className="font-semibold text-primary hover:text-primary-hover hover:underline ml-1" href="/login">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    )
}
