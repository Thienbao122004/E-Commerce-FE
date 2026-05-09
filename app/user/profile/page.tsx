/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { profileService } from '@/services/profile'
import { supabase } from '@/lib/supabase'
import type { UserProfileResponse } from '@/types/profile'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { toast } from 'sonner'
import { isVietnamPhoneLocal, normalizeVietnamPhone } from '@/lib/phone-vn'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`
}

export default function ProfilePage() {
  const { user, refreshProfile, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Email change
  const isOAuth = user?.app_metadata?.provider !== 'email'
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailStep, setEmailStep] = useState<'input' | 'otp'>('input')
  const [newEmail, setNewEmail] = useState('')
  const [otpValue, setOtpValue] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    const loadAvatar = async () => {
      if (!user) return
      // Custom uploaded avatar → signed URL (works with private bucket)
      const storagePath = user.user_metadata?.avatar_storage_path as string | undefined
      if (storagePath) {
        const { data } = await supabase.storage
          .from('image')
          .createSignedUrl(storagePath, 3600)
        if (data?.signedUrl) {
          setAvatarUrl(data.signedUrl)
          return
        }
      }
      // Fallback: OAuth avatar (Google login)
      setAvatarUrl(user.user_metadata?.avatar_url as string | undefined)
    }
    loadAvatar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const res = await profileService.getProfile()
      if (res.success && res.data) {
        setProfile(res.data)
        setFullName(res.data.fullName ?? '')
        setPhone(normalizeVietnamPhone(res.data.phone) || '')
      }
    } catch {
      toast.error('Không thể tải thông tin hồ sơ')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (avatarFile && user) {
        const ext = avatarFile.type === 'image/png' ? 'png' : 'jpg'
        const storagePath = `avatars/${user.id}/avatar-${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('image')
          .upload(storagePath, avatarFile, { upsert: true, cacheControl: '0' })
        if (uploadError) throw uploadError

        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_storage_path: storagePath },
        })
        if (updateError) throw updateError

        // Báo BE xóa cache snapshot Supabase để các nơi khác (review, chat,
        // ...) lấy đúng avatar mới thay vì path cũ.
        try {
          await profileService.refreshAuthCache()
        } catch {
          // không cần fail toàn bộ flow nếu refresh cache lỗi; cache sẽ tự
          // expire sau 1 phút.
        }

        setAvatarFile(null)
      }

      const phoneNorm = normalizeVietnamPhone(phone)
      if (phone.trim() && !isVietnamPhoneLocal(phoneNorm)) {
        toast.error('Số điện thoại không hợp lệ (dùng đầu 0, 10–11 số)')
        return
      }

      const res = await profileService.updateProfile({
        fullName: fullName || null,
        phone: phoneNorm || null,
      })
      if (res.success) {
        await refreshProfile()
        toast.success('Cập nhật hồ sơ thành công')
      } else {
        toast.error(res.message ?? 'Cập nhật thất bại')
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const compressImageToLimit = (file: File, maxBytes = 1024 * 1024): Promise<File> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        const canvas = document.createElement('canvas')

        // Giảm kích thước ảnh nếu quá lớn (tối đa 1600px cạnh dài)
        const MAX_SIDE = 1600
        let { width, height } = img
        if (width > MAX_SIDE || height > MAX_SIDE) {
          if (width >= height) {
            height = Math.round((height * MAX_SIDE) / width)
            width = MAX_SIDE
          } else {
            width = Math.round((width * MAX_SIDE) / height)
            height = MAX_SIDE
          }
        }
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        // Giảm quality dần cho đến khi < maxBytes
        const tryQuality = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Không thể nén ảnh'))
              if (blob.size <= maxBytes || quality <= 0.1) {
                resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
              } else {
                tryQuality(Math.max(quality - 0.1, 0.1))
              }
            },
            'image/jpeg',
            quality,
          )
        }
        tryQuality(0.9)
      }
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Không thể đọc ảnh')) }
      img.src = objectUrl
    })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    e.target.value = ''

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Chỉ hỗ trợ định dạng JPEG, PNG')
      return
    }

    const MAX = 1024 * 1024
    let finalFile = file

    if (file.size > MAX) {
      try {
        finalFile = await compressImageToLimit(file, MAX)
      } catch {
        toast.error('Không thể xử lý ảnh, vui lòng chọn ảnh khác')
        return
      }
    }

    setAvatarFile(finalFile)
    setAvatarUrl(URL.createObjectURL(finalFile))
    toast.success('Đã chọn ảnh. Bấm "Lưu" để hoàn tất cập nhật.')
  }

  const openEmailDialog = () => {
    setNewEmail('')
    setOtpValue('')
    setEmailStep('input')
    setEmailDialogOpen(true)
  }

  const handleSendOtp = async () => {
    if (!newEmail.trim()) return
    try {
      setSendingOtp(true)
      const res = await profileService.requestEmailChange(newEmail.trim())
      if (res.success) {
        setEmailStep('otp')
        toast.success('Đã gửi mã OTP đến email mới')
      } else {
        toast.error(res.message ?? 'Không thể gửi mã OTP')
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi mã OTP')
    } finally {
      setSendingOtp(false)
    }
  }

  const copyUserCode = () => {
    const code = profile?.userCode
    if (!code) return
    void navigator.clipboard.writeText(code)
    toast.success('Đã sao chép mã người dùng')
  }

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) return
    try {
      setVerifyingOtp(true)
      const res = await profileService.confirmEmailChange(newEmail.trim(), otpValue)
      if (res.success) {
        setEmailDialogOpen(false)
        toast.success('Email đã được cập nhật thành công. Vui lòng đăng nhập lại.')
        loadProfile()
      } else {
        toast.error(res.message ?? 'Mã OTP không đúng')
      }
    } catch (err: any) {
      toast.error(err.message || 'Mã OTP không hợp lệ')
    } finally {
      setVerifyingOtp(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-[5px] shadow-sm border p-6" style={{ borderColor: '#e5ded6' }}>
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-72 bg-gray-200 rounded" />
          <Separator />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-6">
                <div className="h-4 w-28 bg-gray-200 rounded shrink-0" />
                <div className="h-9 flex-1 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Shop đã được duyệt nhưng JWT role vẫn là customer → cần re-login
  const needsRelogin =
    profile?.shop &&
    (profile.shop as any).verificationStatus === 1 &&
    profile.role === 'customer'

  return (
    <>
      {needsRelogin && (
        <div
          className="mb-4 flex items-start gap-3 rounded-lg border px-4 py-3"
          style={{ borderColor: '#f59e0b', backgroundColor: '#fffbeb' }}
        >
          <span className="material-symbols-outlined mt-0.5 text-[20px]" style={{ color: '#f59e0b' }}>
            info
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
              Shop của bạn đã được duyệt!
            </p>
            <p className="text-sm mt-0.5" style={{ color: '#92400e' }}>
              Vui lòng đăng xuất và đăng nhập lại để hệ thống cập nhật quyền Seller.
            </p>
          </div>
          <Button
            size="sm"
            onClick={signOut}
            className="shrink-0 text-white"
            style={{ backgroundColor: '#f59e0b' }}
          >
            Đăng xuất ngay
          </Button>
        </div>
      )}

      <div className="bg-white rounded-[5px] shadow-sm border" style={{ borderColor: '#e5ded6' }}>
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>
            Hồ Sơ Của Tôi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý thông tin hồ sơ để bảo mật tài khoản
          </p>
        </div>
        <Separator />

        <div className="flex flex-col md:flex-row">
          <div className="flex-1 px-6 py-6">
            <div className="space-y-5 max-w-lg">
              <div className="flex items-center">
                <Label className="w-[140px] shrink-0 text-right pr-4 text-muted-foreground text-sm">
                  Mã người dùng
                </Label>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <p
                    className="text-sm font-mono tracking-wide truncate"
                    style={{ color: 'var(--color-text-main)' }}
                    title={profile?.userCode ?? undefined}
                  >
                    {profile?.userCode ?? '—'}
                  </p>
                  {profile?.userCode ? (
                    <button
                      type="button"
                      onClick={copyUserCode}
                      className="shrink-0 flex items-center justify-center size-8 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      aria-label="Sao chép mã người dùng"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center">
                <Label
                  htmlFor="fullName"
                  className="w-[140px] shrink-0 text-right pr-4 text-muted-foreground text-sm"
                >
                  Tên
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  className="flex-1"
                />
              </div>

              <div className="flex items-center">
                <Label className="w-[140px] shrink-0 text-right pr-4 text-muted-foreground text-sm">
                  Email
                </Label>
                <div className="flex items-center gap-2 flex-1">
                  <p className="text-sm" style={{ color: 'var(--color-text-main)' }}>
                    {profile?.email ? maskEmail(profile.email) : '—'}
                  </p>
                  {!isOAuth && (
                    <button
                      onClick={openEmailDialog}
                      className="text-xs underline hover:no-underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      Thay đổi
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <Label
                  htmlFor="phone"
                  className="w-[140px] shrink-0 text-right pr-4 text-muted-foreground text-sm"
                >
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901 234 567"
                  className="flex-1"
                />
              </div>

              {/* Save button */}
              <div className="flex items-center pt-2">
                <div className="w-[140px] shrink-0" />
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Đang lưu...
                    </span>
                  ) : (
                    'Lưu'
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div
            className="w-full md:w-[280px] border-t md:border-t-0 md:border-l flex flex-col items-center justify-start py-8 px-6"
            style={{ borderColor: '#e5ded6' }}
          >
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="size-24 rounded-full object-cover ring-2 ring-border"
                  onError={() => setAvatarUrl(undefined)}
                />
              ) : (
                <span
                  className="size-24 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <span className="material-symbols-outlined">person</span>
                </span>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <span className="size-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="mt-4 px-6 py-2 border rounded-md text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: '#d1d5db', color: 'var(--color-text-main)' }}
            >
              {uploadingAvatar ? 'Đang tải...' : 'Chọn Ảnh'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <div className="mt-3 text-center">
              <p className="text-xs text-muted-foreground">Ảnh lớn hơn 1 MB sẽ được nén tự động</p>
              <p className="text-xs text-muted-foreground">Định dạng: JPEG, PNG</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Change Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thay đổi Email</DialogTitle>
            <DialogDescription>
              {emailStep === 'input'
                ? 'Nhập email mới. Mã OTP 6 số sẽ được gửi đến email này.'
                : `Nhập mã OTP đã gửi đến ${newEmail}`}
            </DialogDescription>
          </DialogHeader>

          {emailStep === 'input' ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email mới</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="example@email.com"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                />
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={sendingOtp || !newEmail.trim()}
                className="w-full"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {sendingOtp ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Đang gửi...
                  </span>
                ) : (
                  'Gửi mã OTP'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otpValue.length !== 6}
                className="w-full"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {verifyingOtp ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Đang xác nhận...
                  </span>
                ) : (
                  'Xác nhận'
                )}
              </Button>
              <div className="text-center">
                <button
                  onClick={() => { setEmailStep('input'); setOtpValue('') }}
                  className="text-xs underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Gửi lại mã
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
