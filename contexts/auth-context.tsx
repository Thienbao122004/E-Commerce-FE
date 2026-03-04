'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type UserRole = 'customer' | 'seller' | 'admin'

export interface UserProfile {
    id: string
    role: UserRole
    full_name: string | null
    phone: string | null
    status: number
    created_at: string
    updated_at: string
    suspension_reason: string | null
    suspended_at: string | null
    suspended_by: string | null
}

interface AuthContextValue {
    session: Session | null
    user: User | null
    profile: UserProfile | null
    role: UserRole | null
    isLoading: boolean
    isAdmin: boolean
    isSeller: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isProfileLoading, setIsProfileLoading] = useState(true)

    const fetchProfile = async (userId: string, userMeta?: Record<string, any>) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (error || !data) {
            if (error && error.code !== 'PGRST116') {
                console.warn('Could not fetch user profile (check RLS policy):', error.code)
            }
            const fallbackRole = (userMeta?.role ?? userMeta?.user_role ?? 'customer') as UserRole
            return {
                id: userId,
                role: fallbackRole,
                full_name: userMeta?.full_name ?? null,
                phone: null,
                status: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                suspension_reason: null,
                suspended_at: null,
                suspended_by: null,
            } as UserProfile
        }

        return data as UserProfile
    }

    useEffect(() => {
        let mounted = true
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!mounted) return
                setSession(session)
                setUser(session?.user ?? null)
            } catch (error) {

            } finally {
                if (mounted) setIsLoading(false)
            }
        }

        initializeAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (!mounted) return
                if (event === 'INITIAL_SESSION') return

                setSession(session)
                setUser(session?.user ?? null)

                // xóa khi lên production
                if (session?.access_token) {
                    sessionStorage.setItem('debug_token', session.access_token)
                }

                if (event === 'SIGNED_OUT') {
                    setProfile(null)
                    sessionStorage.removeItem('debug_token')
                }

                if (mounted) setIsLoading(false)
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    useEffect(() => {
        let mounted = true
        const loadProfile = async () => {
            if (!user) {
                if (mounted) {
                    setProfile(null)
                    setIsProfileLoading(false)
                }
                return
            }
            try {
                if (mounted) setIsProfileLoading(true)
                const profileData = await fetchProfile(user.id, user.app_metadata)
                if (mounted) setProfile(profileData)
            } catch (error) {

            } finally {
                if (mounted) setIsProfileLoading(false)
            }
        }

        loadProfile()

        return () => {
            mounted = false
        }
    }, [user?.id])

    const signOut = async () => {
        try {
            await supabase.auth.signOut()
        } catch (error) {

        } finally {
            setProfile(null)
            setSession(null)
            setUser(null)
        }
    }

    const role = profile?.role ?? null

    const stillLoading = isLoading || isProfileLoading || (!!user && !profile)

    const value: AuthContextValue = {
        session,
        user,
        profile,
        role,
        isLoading: stillLoading,
        isAdmin: role === 'admin',
        isSeller: role === 'seller',
        signOut,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
