/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { profileService } from "@/services/profile"
import { supabase } from "@/lib/supabase"
import type { UserProfileResponse } from "@/types/profile"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { toast } from "sonner"
import { isVietnamPhoneLocal, normalizeVietnamPhone } from "@/lib/phone-vn"
import {
  IconUser,
  IconCopy,
  IconLock,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react"

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!domain) return email
  const visible = local.slice(0, 2)
  return `${visible}${"*".repeat(Math.max(local.length - 2, 3))}@${domain}`
}

export default function SellerAccountPage() {
  const { user, refreshProfile } = useAuth()
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploadingAvatar] = useState(false)

  const isOAuth = user?.app_metadata?.provider !== "email"
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailStep, setEmailStep] = useState<"input" | "otp">("input")
  const [newEmail, setNewEmail] = useState("")
  const [otpValue, setOtpValue] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  const [pwDialogOpen, setPwDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  useEffect(() => {
    void loadProfile()
  }, [])

  useEffect(() => {
    const loadAvatar = async () => {
      if (!user) return
      const storagePath = user.user_metadata?.avatar_storage_path as string | undefined
      if (storagePath) {
        const { data } = await supabase.storage
          .from("image")
          .createSignedUrl(storagePath, 3600)
        if (data?.signedUrl) {
          setAvatarUrl(data.signedUrl)
          return
        }
      }
      setAvatarUrl(user.user_metadata?.avatar_url as string | undefined)
    }
    void loadAvatar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const res = await profileService.getProfile()
      if (res.success && res.data) {
        setProfile(res.data)
        setFullName(res.data.fullName ?? "")
        setPhone(normalizeVietnamPhone(res.data.phone) || "")
      }
    } catch {
      toast.error("Không thể tải thông tin hồ sơ")
    } finally {
      setLoading(false)
    }
  }

  const compressImageToLimit = (file: File, maxBytes = 1024 * 1024): Promise<File> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        const canvas = document.createElement("canvas")

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

        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, width, height)

        const tryQuality = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Không thể nén ảnh"))
              if (blob.size <= maxBytes || quality <= 0.1) {
                resolve(
                  new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                    type: "image/jpeg",
                  })
                )
              } else {
                tryQuality(Math.max(quality - 0.1, 0.1))
              }
            },
            "image/jpeg",
            quality
          )
        }
        tryQuality(0.9)
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error("Không thể đọc ảnh"))
      }
      img.src = objectUrl
    })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    e.target.value = ""

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Chỉ hỗ trợ định dạng JPEG, PNG")
      return
    }

    const MAX = 1024 * 1024
    let finalFile = file

    if (file.size > MAX) {
      try {
        finalFile = await compressImageToLimit(file, MAX)
      } catch {
        toast.error("Không thể xử lý ảnh, vui lòng chọn ảnh khác")
        return
      }
    }

    setAvatarFile(finalFile)
    setAvatarUrl(URL.createObjectURL(finalFile))
    toast.success('Đã chọn ảnh. Bấm "Lưu" để hoàn tất cập nhật.')
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      if (avatarFile && user) {
        const ext = avatarFile.type === "image/png" ? "png" : "jpg"
        const storagePath = `avatars/${user.id}/avatar-${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from("image")
          .upload(storagePath, avatarFile, { upsert: true, cacheControl: "0" })
        if (uploadError) throw uploadError

        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_storage_path: storagePath },
        })
        if (updateError) throw updateError

        try {
          await profileService.refreshAuthCache()
        } catch {
          // Cache sẽ tự expire sau 1 phút nếu refresh lỗi.
        }

        setAvatarFile(null)
      }

      const phoneNorm = normalizeVietnamPhone(phone)
      if (phone.trim() && !isVietnamPhoneLocal(phoneNorm)) {
        toast.error("Số điện thoại không hợp lệ (dùng đầu 0, 10–11 số)")
        return
      }

      const res = await profileService.updateProfile({
        fullName: fullName || null,
        phone: phoneNorm || null,
      })
      if (res.success) {
        await refreshProfile()
        toast.success("Cập nhật hồ sơ thành công")
      } else {
        toast.error(res.message ?? "Cập nhật thất bại")
      }
    } catch (err: any) {
      toast.error(err.message ?? "Có lỗi xảy ra")
    } finally {
      setSaving(false)
    }
  }

  const openEmailDialog = () => {
    setNewEmail("")
    setOtpValue("")
    setEmailStep("input")
    setEmailDialogOpen(true)
  }

  const handleSendOtp = async () => {
    if (!newEmail.trim()) return
    try {
      setSendingOtp(true)
      const res = await profileService.requestEmailChange(newEmail.trim())
      if (res.success) {
        setEmailStep("otp")
        toast.success("Đã gửi mã OTP đến email mới")
      } else {
        toast.error(res.message ?? "Không thể gửi mã OTP")
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể gửi mã OTP")
    } finally {
      setSendingOtp(false)
    }
  }

  const copyUserCode = () => {
    const code = profile?.userCode
    if (!code) return
    void navigator.clipboard.writeText(code)
    toast.success("Đã sao chép mã người dùng")
  }

  const openPwDialog = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setShowCurrentPw(false)
    setShowNewPw(false)
    setShowConfirmPw(false)
    setPwDialogOpen(true)
  }

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại")
      return
    }
    if (!newPassword) {
      toast.error("Vui lòng nhập mật khẩu mới")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự")
      return
    }
    if (newPassword === currentPassword) {
      toast.error("Mật khẩu mới phải khác mật khẩu hiện tại")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp")
      return
    }
    if (!user?.email) {
      toast.error("Không tìm thấy email tài khoản")
      return
    }

    try {
      setChangingPw(true)

      // 1) Xác thực mật khẩu hiện tại bằng cách đăng nhập lại.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (signInError) {
        toast.error("Mật khẩu hiện tại không đúng")
        return
      }

      // 2) Cập nhật mật khẩu mới.
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (updateError) {
        toast.error(updateError.message || "Đổi mật khẩu thất bại")
        return
      }

      toast.success("Đổi mật khẩu thành công")
      setPwDialogOpen(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast.error(err.message ?? "Có lỗi xảy ra")
    } finally {
      setChangingPw(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) return
    try {
      setVerifyingOtp(true)
      const res = await profileService.confirmEmailChange(newEmail.trim(), otpValue)
      if (res.success) {
        setEmailDialogOpen(false)
        toast.success("Email đã được cập nhật. Vui lòng đăng nhập lại.")
        void loadProfile()
      } else {
        toast.error(res.message ?? "Mã OTP không đúng")
      }
    } catch (err: any) {
      toast.error(err.message || "Mã OTP không hợp lệ")
    } finally {
      setVerifyingOtp(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 lg:gap-6 lg:p-6">
      <div className="mb-0.5 space-y-1">
        <h1
          className="text-xl font-semibold md:text-2xl"
          style={{ color: "var(--color-text-main)" }}
        >
          Hồ sơ tài khoản
        </h1>
        <p className="text-sm text-muted-foreground">
          Quản lý thông tin cá nhân của bạn để bảo mật tài khoản
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-48 rounded bg-muted" />
            <Separator />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-6">
                  <div className="h-4 w-28 shrink-0 rounded bg-muted" />
                  <div className="h-9 flex-1 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 px-6 py-6">
              <div className="max-w-lg space-y-5">
                <div className="flex items-center">
                  <Label className="w-[140px] shrink-0 pr-4 text-right text-sm text-muted-foreground">
                    Mã người dùng
                  </Label>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <p
                      className="truncate font-mono text-sm tracking-wide"
                      style={{ color: "var(--color-text-main)" }}
                      title={profile?.userCode ?? undefined}
                    >
                      {profile?.userCode ?? "—"}
                    </p>
                    {profile?.userCode ? (
                      <button
                        type="button"
                        onClick={copyUserCode}
                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Sao chép mã người dùng"
                      >
                        <IconCopy className="size-4" />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center">
                  <Label
                    htmlFor="fullName"
                    className="w-[140px] shrink-0 pr-4 text-right text-sm text-muted-foreground"
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
                  <Label className="w-[140px] shrink-0 pr-4 text-right text-sm text-muted-foreground">
                    Email
                  </Label>
                  <div className="flex flex-1 items-center gap-2">
                    <p className="text-sm" style={{ color: "var(--color-text-main)" }}>
                      {profile?.email ? maskEmail(profile.email) : "—"}
                    </p>
                    {!isOAuth && (
                      <button
                        onClick={openEmailDialog}
                        className="text-xs underline hover:no-underline"
                        style={{ color: "var(--color-primary)" }}
                      >
                        Thay đổi
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <Label
                    htmlFor="phone"
                    className="w-[140px] shrink-0 pr-4 text-right text-sm text-muted-foreground"
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

                <div className="flex items-center pt-2">
                  <div className="w-[140px] shrink-0" />
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Đang lưu...
                      </span>
                    ) : (
                      "Lưu"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-center justify-start border-t px-6 py-8 md:w-[280px] md:border-l md:border-t-0">
              <div className="relative">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    referrerPolicy="no-referrer"
                    className="size-24 rounded-full object-cover ring-2 ring-border"
                    onError={() => setAvatarUrl(undefined)}
                  />
                ) : (
                  <span
                    className="flex size-24 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    <IconUser className="size-10" />
                  </span>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <span className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="mt-4 rounded-md border px-6 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                style={{ color: "var(--color-text-main)" }}
              >
                {uploadingAvatar ? "Đang tải..." : "Chọn Ảnh"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <div className="mt-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Ảnh lớn hơn 1 MB sẽ được nén tự động
                </p>
                <p className="text-xs text-muted-foreground">Định dạng: JPEG, PNG</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-start justify-between gap-4 px-6 py-5">
            <div className="flex items-start gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}
              >
                <IconLock className="size-5" style={{ color: "var(--color-primary)" }} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold" style={{ color: "var(--color-text-main)" }}>
                  Mật khẩu
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {isOAuth
                    ? "Tài khoản đăng nhập qua mạng xã hội không sử dụng mật khẩu."
                    : "Đổi mật khẩu định kỳ giúp tăng cường bảo mật cho tài khoản của bạn."}
                </p>
              </div>
            </div>
            {!isOAuth && (
              <Button variant="outline" onClick={openPwDialog} className="shrink-0">
                Đổi mật khẩu
              </Button>
            )}
          </div>
        </div>
      )}

      <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>
              Nhập mật khẩu hiện tại để xác thực, sau đó đặt mật khẩu mới.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="currentPw">Mật khẩu hiện tại</Label>
              <div className="relative">
                <Input
                  id="currentPw"
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showCurrentPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showCurrentPw ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPw">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="newPw"
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showNewPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showNewPw ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPw">Xác nhận mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="confirmPw"
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="pr-10"
                  autoComplete="new-password"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !changingPw) void handleChangePassword()
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPw ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setPwDialogOpen(false)}
                disabled={changingPw}
              >
                Hủy
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={changingPw}
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {changingPw ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang lưu...
                  </span>
                ) : (
                  "Xác nhận"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thay đổi Email</DialogTitle>
            <DialogDescription>
              {emailStep === "input"
                ? "Nhập email mới. Mã OTP 6 số sẽ được gửi đến email này."
                : `Nhập mã OTP đã gửi đến ${newEmail}`}
            </DialogDescription>
          </DialogHeader>

          {emailStep === "input" ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email mới</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="example@email.com"
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={sendingOtp || !newEmail.trim()}
                className="w-full"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {sendingOtp ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang gửi...
                  </span>
                ) : (
                  "Gửi mã OTP"
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
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {verifyingOtp ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang xác nhận...
                  </span>
                ) : (
                  "Xác nhận"
                )}
              </Button>
              <div className="text-center">
                <button
                  onClick={() => {
                    setEmailStep("input")
                    setOtpValue("")
                  }}
                  className="text-xs underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  Gửi lại mã
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
