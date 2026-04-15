import { supabase } from './supabase'

export interface SignUpData {
    email: string
    password: string
    fullName?: string
}

export interface SignInData {
    email: string
    password: string
}

function translateAuthError(error: any): string {
    const errorCode = error?.code || error?.message || ''
    const errorMessage = error?.message || ''

    const errorMap: Record<string, string> = {
        'invalid_credentials': 'Email hoặc mật khẩu không đúng',
        'Invalid login credentials': 'Email hoặc mật khẩu không đúng',
        'Email not confirmed': 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư của bạn',
        'User already registered': 'Email này đã được đăng ký',
        'User not found': 'Không tìm thấy tài khoản với email này',

        'Password should be at least 6 characters': 'Mật khẩu phải có ít nhất 6 ký tự',
        'Password is too weak': 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn',
        'New password should be different from the old password': 'Mật khẩu mới phải khác mật khẩu cũ',

        'Invalid email': 'Email không hợp lệ',
        'Email address is invalid': 'Địa chỉ email không hợp lệ',
        'Unable to validate email address': 'Không thể xác thực địa chỉ email',

        'Email rate limit exceeded': 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau',
        'Too many requests': 'Quá nhiều yêu cầu. Vui lòng thử lại sau',

        'Invalid token': 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại',
        'Token has expired': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại',
        'Refresh token not found': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại',

        'Failed to fetch': 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet',
        'Network request failed': 'Lỗi kết nối mạng. Vui lòng thử lại',

        'Signup requires a valid password': 'Vui lòng nhập mật khẩu hợp lệ',
        'Signups not allowed for this instance': 'Đăng ký tài khoản hiện không khả dụng',

        'Database error': 'Lỗi hệ thống. Vui lòng thử lại sau',
        'Internal server error': 'Lỗi máy chủ. Vui lòng thử lại sau',
    }

    if (errorMap[errorCode]) {
        return errorMap[errorCode]
    }

    if (errorMap[errorMessage]) {
        return errorMap[errorMessage]
    }

    for (const [key, value] of Object.entries(errorMap)) {
        if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
            return value
        }
    }

    return 'Đã xảy ra lỗi. Vui lòng thử lại sau'
}

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
        throw new Error(translateAuthError(error))
    }

    return data
}

export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            skipBrowserRedirect: true,
            queryParams: {
                prompt: 'select_account',
            },
        },
    })

    if (error) {
        throw new Error(translateAuthError(error))
    }

    if (!data.url) {
        throw new Error('Không thể lấy URL đăng nhập Google')
    }

    const popup = window.open(data.url, 'google-oauth', 'width=500,height=600,left=400,top=100')

    return new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
            try {
                if (popup?.closed) {
                    clearInterval(interval)
                    const { data: sessionData } = await supabase.auth.getSession()
                    if (sessionData.session) {
                        resolve()
                    } else {
                        reject(new Error('Đăng nhập Google đã bị hủy'))
                    }
                }
            } catch {
                clearInterval(interval)
                reject(new Error('Đã xảy ra lỗi khi đăng nhập Google'))
            }
        }, 500)
    })
}

export async function signIn({ email, password }: SignInData) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        throw new Error(translateAuthError(error))
    }

    return data
}

export async function signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
        throw new Error(translateAuthError(error))
    }
}

export async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
        throw new Error(translateAuthError(error))
    }
}

export async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    })

    if (error) {
        throw new Error(translateAuthError(error))
    }
}

export async function getSession() {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
        throw new Error(translateAuthError(error))
    }

    return data.session
}

export async function getUser() {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
        throw new Error(translateAuthError(error))
    }

    return data.user
}

export async function getAccessToken(): Promise<string | null> {
    const session = await getSession()
    return session?.access_token ?? null
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
}
