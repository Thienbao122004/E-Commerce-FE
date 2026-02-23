'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { LoadingScreen } from '@/components/ui/loading-screen'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { session, isLoading } = useAuth()

    useEffect(() => {
        if (!isLoading && !session) {
            window.location.href = '/login'
        }
    }, [isLoading, session])

    if (isLoading) return <LoadingScreen />

    if (!session) return null

    return <>{children}</>
}
