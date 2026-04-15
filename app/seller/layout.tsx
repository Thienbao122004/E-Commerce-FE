'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { HeaderActionsProvider } from '@/hooks/use-header-actions'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { session, isLoading, role } = useAuth()

    useEffect(() => {
        if (!isLoading) {
            if (!session) {
                window.location.href = '/login'
            } else if (role !== 'seller') {
                window.location.href = '/'
            }
        }
    }, [isLoading, session, role])

    if (isLoading) return <LoadingScreen />
    
    if (!session || role !== 'seller') return null

    return (
        <HeaderActionsProvider>
            <SidebarProvider
                style={{
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties}
            >
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex flex-1 flex-col min-w-0">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </HeaderActionsProvider>
    )
}
