'use client'

import { useState, useEffect } from 'react'
import { updatePassword } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function ResetPasswordForm() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [sessionReady, setSessionReady] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event) => {
                if (event === 'PASSWORD_RECOVERY') {
                    setSessionReady(true)
                }
            }
        )

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setSessionReady(true)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự')
            return
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp')
            return
        }

        setLoading(true)
        try {
            await updatePassword(password)
            setSuccess(true)
            await supabase.auth.signOut()
            setTimeout(() => router.push('/login'), 3000)
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
                            check_circle
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-text-main dark:text-white">
                        Đặt lại mật khẩu thành công!
                    </h2>
                    <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed">
                        Mật khẩu của bạn đã được thay đổi. Bạn sẽ được chuyển đến trang đăng nhập trong vài giây...
                    </p>
                </div>

                <Link
                    href="/login"
                    className="w-full h-12 mt-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-sm shadow-primary/30 transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                    <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
                        arrow_back
                    </span>
                    Đăng nhập ngay
                </Link>
            </div>
        )
    }

    if (!sessionReady) {
        return (
            <div className="w-full max-w-[440px] flex flex-col gap-6">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-3xl animate-spin">
                            progress_activity
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-text-main dark:text-white">
                        Đang xác thực...
                    </h2>
                    <p className="text-text-secondary dark:text-gray-400 text-sm">
                        Nếu bạn không được chuyển hướng, vui lòng thử lại bằng cách nhấp vào liên kết trong email.
                    </p>
                </div>
                <Link
                    href="/forgot-password"
                    className="text-center text-sm font-medium text-primary hover:text-primary-hover hover:underline transition-colors"
                >
                    Gửi lại email đặt lại mật khẩu
                </Link>
            </div>
        )
    }

    return (
        <div className="w-full max-w-[440px] flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-text-main dark:text-white">
                    Đặt lại mật khẩu
                </h2>
                <p className="text-text-secondary dark:text-gray-400 text-sm">
                    Nhập mật khẩu mới cho tài khoản của bạn.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-text-main dark:text-gray-200" htmlFor="password">
                        Mật khẩu mới
                    </label>
                    <div className="relative group">
                        <input
                            className="w-full h-12 px-4 pr-12 rounded-lg border border-[#e7dbcf] dark:border-[#4a3b2f] bg-white dark:bg-surface-dark text-text-main dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-text-main dark:text-gray-200" htmlFor="confirm-password">
                        Xác nhận mật khẩu mới
                    </label>
                    <div className="relative group">
                        <input
                            className="w-full h-12 px-4 pr-12 rounded-lg border border-[#e7dbcf] dark:border-[#4a3b2f] bg-white dark:bg-surface-dark text-text-main dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                            id="confirm-password"
                            name="confirm-password"
                            placeholder="••••••••"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {showConfirmPassword ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                </div>

                <button
                    className="w-full h-12 mt-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-sm shadow-primary/30 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                    </span>
                </button>
            </form>
        </div>
    )
}
