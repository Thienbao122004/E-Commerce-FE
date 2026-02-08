import { getAccessToken } from './auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5001/api'

interface RequestOptions extends RequestInit {
    requiresAuth?: boolean
}

export async function apiClient<T = any>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { requiresAuth = true, headers = {}, ...restOptions } = options

    const convertHeaders = (h: HeadersInit | undefined): Record<string, string> => {
        if (!h) return {}

        if (h instanceof Headers) {
            const obj: Record<string, string> = {}
            h.forEach((value, key) => {
                obj[key] = value
            })
            return obj
        }

        if (Array.isArray(h)) {
            const obj: Record<string, string> = {}
            h.forEach(([key, value]) => {
                obj[key] = value
            })
            return obj
        }

        return h as Record<string, string>
    }

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...convertHeaders(headers),
    }

    if (requiresAuth) {
        const token = await getAccessToken()

        if (!token) {
            throw new Error('No access token available. Please sign in.')
        }

        requestHeaders['Authorization'] = `Bearer ${token}`
    }

    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message)
    }

    return response.json()
}

export const api = {
    get: <T = any>(endpoint: string, options?: RequestOptions) =>
        apiClient<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        }),

    put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        }),

    patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        }),

    delete: <T = any>(endpoint: string, options?: RequestOptions) =>
        apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
}