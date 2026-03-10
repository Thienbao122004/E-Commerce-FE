'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast.error('Vui lòng nhập mật khẩu mới')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        toast.error(error.message || 'Đổi mật khẩu thất bại')
        return
      }

      toast.success('Đổi mật khẩu thành công')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message ?? 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: '#e5ded6' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>
          Đổi Mật Khẩu
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác
        </p>
      </div>
      <Separator />

      <div className="px-6 py-6">
        <div className="space-y-5 max-w-lg">
          {/* Current Password */}
          <div className="flex items-center">
            <Label htmlFor="currentPw" className="w-[160px] shrink-0 text-right pr-4 text-muted-foreground text-sm">
              Mật khẩu hiện tại
            </Label>
            <div className="flex-1 relative">
              <Input
                id="currentPw"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showCurrent ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="flex items-center">
            <Label htmlFor="newPw" className="w-[160px] shrink-0 text-right pr-4 text-muted-foreground text-sm">
              Mật khẩu mới
            </Label>
            <div className="flex-1 relative">
              <Input
                id="newPw"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showNew ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex items-center">
            <Label htmlFor="confirmPw" className="w-[160px] shrink-0 text-right pr-4 text-muted-foreground text-sm">
              Xác nhận mật khẩu
            </Label>
            <div className="flex-1 relative">
              <Input
                id="confirmPw"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showConfirm ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center pt-2">
            <div className="w-[160px] shrink-0" />
            <Button
              onClick={handleChangePassword}
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
                'Xác nhận'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
