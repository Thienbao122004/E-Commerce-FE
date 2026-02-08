import { supabase } from './supabase'

/**
 * Authentication helper functions using Supabase client
 */

export interface SignUpData {
    email: string
    password: string
    fullName?: string
}

export interface SignInData {
    email: string
    password: string
}

/**
 * Sign up a new user with Supabase Auth
 */
export async function signUp({ email, password, fullName }: SignUpData) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    })

    if (error) {
        throw error
    }

    return data
}

/**
 * Sign in an existing user
 */
export async function signIn({ email, password }: SignInData) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        throw error
    }

    return data
}

/**
 * Sign out the current user
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
        throw error
    }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
        throw error
    }
}

/**
 * Update user password (must be signed in)
 */
export async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    })

    if (error) {
        throw error
    }
}

/**
 * Get current session
 */
export async function getSession() {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
        throw error
    }

    return data.session
}

/**
 * Get current user
 */
export async function getUser() {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
        throw error
    }

    return data.user
}

/**
 * Get access token from current session
 */
export async function getAccessToken(): Promise<string | null> {
    const session = await getSession()
    return session?.access_token ?? null
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
}
