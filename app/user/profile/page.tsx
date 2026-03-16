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

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
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
        setPhone(res.data.phone ?? '')
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
      const res = await profileService.updateProfile({
        fullName: fullName || null,
        phone: phone || null,
      })
      if (res.success) {
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

  // --- Avatar upload ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    // Reset input so same file can be re-selected
    e.target.value = ''

    if (file.size > 1024 * 1024) {
      toast.error('File quá lớn. Dung lượng tối đa 1 MB')
      return
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Chỉ hỗ trợ định dạng JPEG, PNG')
      return
    }

    try {
      setUploadingAvatar(true)
      const ext = file.type === 'image/png' ? 'png' : 'jpg'
      const storagePath = `avatars/${user.id}/avatar-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('image')
        .upload(storagePath, file, { upsert: true, cacheControl: '0' })
      if (uploadError) throw uploadError

      // Save storage path to user metadata (not public URL)
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_storage_path: storagePath },
      })
      if (updateError) throw updateError

      // Immediate preview from file blob
      setAvatarUrl(URL.createObjectURL(file))
      toast.success('Cập nhật ảnh đại diện thành công')
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải ảnh lên')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // --- Email change ---
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

  const username = user?.email?.split('@')[0] ?? ''
  const initials =
    (fullName || username)
      .split(' ')
      .map((w) => w[0])
      .slice(-2)
      .join('')
      .toUpperCase() || 'U'

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

  return (
    <>
      <div className="bg-white rounded-[5px] shadow-sm border" style={{ borderColor: '#e5ded6' }}>
        {/* Header */}
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
          {/* Form Section */}
          <div className="flex-1 px-6 py-6">
            <div className="space-y-5 max-w-lg">
              {/* Username (readonly) */}
              <div className="flex items-center">
                <Label className="w-[140px] shrink-0 text-right pr-4 text-muted-foreground text-sm">
                  Tên đăng nhập
                </Label>
                <p className="text-sm" style={{ color: 'var(--color-text-main)' }}>
                  {username}
                </p>
              </div>

              {/* Full Name */}
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

              {/* Email */}
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

              {/* Phone */}
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
                  placeholder="Nhập số điện thoại"
                  className="flex-1"
                />
              </div>

              {/* Shop */}
              {profile?.shop && (
                <div className="flex items-center">
                  <Label className="w-[140px] shrink-0 text-right pr-4 text-muted-foreground text-sm">
                    Shop
                  </Label>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: 'rgba(236,127,19,0.1)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      <span className="material-symbols-outlined text-[14px]">storefront</span>
                      {profile.shop.shopName}
                    </span>
                  </div>
                </div>
              )}

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

          {/* Avatar Section */}
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
                />
              ) : (
                <span
                  className="size-24 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {initials}
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
              <p className="text-xs text-muted-foreground">Dung lượng file tối đa 1 MB</p>
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
