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
            const errorDescription = params.get('error_description') || hashParams.get('error_description')

            if (error) {
                if (window.opener) {
                    window.opener.postMessage({ type: 'supabase:auth:error', error, errorDescription }, window.location.origin)
                    window.close()
                }
                return
            }

            let sessionRetrieved = false

            if (code) {
                // supabase-js automatically exchanges the code in the background when it detects it in the URL.
                // We just need to wait for the session to be available.
                for (let i = 0; i < 20; i++) {
                    const { data } = await supabase.auth.getSession()
                    if (data.session) {
                        sessionRetrieved = true
                        break
                    }
                    await new Promise(resolve => setTimeout(resolve, 500))
                }
            }

            if (window.opener && !window.opener.closed) {
                window.opener.postMessage({ type: 'supabase:auth:success' }, window.location.origin)
                window.close()
            } else {
                window.location.href = '/login'
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
