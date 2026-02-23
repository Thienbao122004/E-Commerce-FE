'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
    useEffect(() => {
        const handleCallback = async () => {
            const params = new URLSearchParams(window.location.search)
            const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'))

            const code = params.get('code')
            const error = params.get('error') || hashParams.get('error')

            if (error) {
                if (window.opener) {
                    window.opener.postMessage({ type: 'supabase:auth:error', error }, window.location.origin)
                    window.close()
                }
                return
            }

            if (code) {
                await supabase.auth.exchangeCodeForSession(code)
            }

            // Notify the parent window and close this popup
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage({ type: 'supabase:auth:success' }, window.location.origin)
                window.close()
            } else {
                // Fallback: if not in popup, redirect normally
                window.location.href = '/dashboard'
            }
        }

        handleCallback()
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Đang xử lý đăng nhập...</p>
        </div>
    )
}
