"use client"

import { useState, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  VerificationStatus,
  VerificationStatusLabels,
  ShopStatusLabels,
  ShopStatusColors,
} from "@/types/seller"
import type { SellerShopInfo } from "@/types/seller-dashboard"
import {
  IconCamera,
  IconCircleCheckFilled,
  IconExternalLink,
  IconLoader2,
  IconPhoto,
} from "@tabler/icons-react"

type Props = {
  shop: SellerShopInfo | null
  loading: boolean
  saving: boolean
  onUpdateLogo: (url: string) => Promise<boolean>
}

export function ProfileCover({ shop, loading, saving, onUpdateLogo }: Props) {
  const [logoDialog, setLogoDialog] = useState(false)
  const [logoInput, setLogoInput] = useState("")
  const [logoPreview, setLogoPreview] = useState("")
  const [logoPreviewError, setLogoPreviewError] = useState(false)

  // Cover image stored in localStorage (no backend field)
  const coverKey = shop ? `shop-cover-${shop.id}` : ""
  const [coverUrl, setCoverUrl] = useState(() => {
    if (typeof window !== "undefined" && coverKey) {
      return localStorage.getItem(coverKey) || ""
    }
    return ""
  })
  const [coverDialog, setCoverDialog] = useState(false)
  const [coverInput, setCoverInput] = useState("")
  const [coverPreview, setCoverPreview] = useState("")
  const [coverPreviewError, setCoverPreviewError] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOpenLogoDialog = () => {
    setLogoInput(shop?.logoUrl ?? "")
    setLogoPreview(shop?.logoUrl ?? "")
    setLogoPreviewError(false)
    setLogoDialog(true)
  }

  const handleLogoInputChange = (val: string) => {
    setLogoInput(val)
    setLogoPreview(val)
    setLogoPreviewError(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setLogoInput(base64String)
      setLogoPreview(base64String)
      setLogoPreviewError(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveLogo = async () => {
    const ok = await onUpdateLogo(logoInput.trim())
    if (ok) setLogoDialog(false)
  }

  const handleOpenCoverDialog = () => {
    setCoverInput(coverUrl)
    setCoverPreview(coverUrl)
    setCoverPreviewError(false)
    setCoverDialog(true)
  }

  const handleCoverInputChange = (val: string) => {
    setCoverInput(val)
    setCoverPreview(val)
    setCoverPreviewError(false)
  }

  const handleSaveCover = () => {
    if (coverKey) {
      if (coverInput.trim()) {
        localStorage.setItem(coverKey, coverInput.trim())
      } else {
        localStorage.removeItem(coverKey)
      }
      setCoverUrl(coverInput.trim())
    }
    setCoverDialog(false)
  }

  if (loading || !shop) {
    return (
      <div className="rounded-xl border overflow-hidden bg-card">
        <Skeleton className="h-48 w-full rounded-none" />
        <div className="px-6 pb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
            <Skeleton className="size-24 rounded-full border-4 border-background shrink-0" />
            <div className="flex-1 space-y-2 pt-4">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isVerified = shop.verificationStatus === VerificationStatus.Verified

  return (
    <>
      <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
        {/* Cover Image */}
        <div className="relative h-48 group cursor-pointer" onClick={handleOpenCoverDialog}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Cover"
              className="w-full h-full object-cover"
              onError={() => setCoverUrl("")}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.08),transparent_60%)]" />
              <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.03)_10px,rgba(255,255,255,0.03)_20px)]" />
            </div>
          )}
          {/* Cover overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white text-sm font-medium bg-black/50 rounded-lg px-4 py-2">
              <IconPhoto className="size-4" />
              Thay đổi ảnh bìa
            </div>
          </div>
        </div>

        {/* Profile Info Bar */}
        <div className="relative px-5 lg:px-6 pb-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10">
            {/* Avatar */}
            <div className="relative shrink-0 group/avatar">
              <div
                className="size-24 rounded-full border-4 border-background overflow-hidden bg-muted shadow-lg cursor-pointer"
                onClick={handleOpenLogoDialog}
              >
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.name} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-stone-600 to-stone-800 text-3xl font-bold text-white">
                    {shop.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Avatar hover overlay */}
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover/avatar:bg-black/40 transition-all flex items-center justify-center">
                  <IconCamera className="size-5 text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                </div>
              </div>
              <span className="absolute bottom-1.5 right-1.5 size-4 rounded-full border-2 border-background bg-green-500 shadow-sm" />
            </div>

            {/* Name & badges */}
            <div className="flex-1 min-w-0 text-center sm:text-left pt-5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <h1 className="text-xl font-bold truncate">{shop.name}</h1>
                {isVerified && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700 gap-1 text-xs">
                    <IconCircleCheckFilled className="size-3 text-emerald-500" />
                    Đã xác thực
                  </Badge>
                )}
                {!isVerified && (
                  <Badge variant="outline" className="text-xs">
                    {VerificationStatusLabels[shop.verificationStatus] ?? "Chưa xác thực"}
                  </Badge>
                )}
              </div>

              {shop.description && (
                <p className="mt-1 text-sm text-muted-foreground italic line-clamp-1">
                  &ldquo;{shop.description}&rdquo;
                </p>
              )}

              <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Badge variant="outline" className={`text-xs ${ShopStatusColors[shop.status] ?? ""}`}>
                  {ShopStatusLabels[shop.status] ?? "—"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Tham gia từ{" "}
                  {new Date(shop.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
            </div>

            {/* View shop button */}
            <div className="pb-1">
              <Button variant="outline" size="sm" className="shrink-0 text-xs" asChild>
                <a href={`/shop/${shop.slug}`} target="_blank" rel="noopener noreferrer">
                  <IconExternalLink className="mr-1.5 size-3.5" />
                  Xem cửa hàng
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Upload Dialog */}
      <Dialog open={logoDialog} onOpenChange={setLogoDialog}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCamera className="size-5" />
              Cập nhật ảnh đại diện
            </DialogTitle>
            <DialogDescription>
              Tải ảnh từ máy tính hoặc dán URL hình ảnh
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2">
            {/* Preview & File Picker */}
            <div className="flex flex-col items-center gap-4">
              <div className="size-28 rounded-full border-2 border-dashed border-muted-foreground/30 overflow-hidden bg-muted shadow-inner flex items-center justify-center relative group">
                {logoPreview && !logoPreviewError ? (
                  <img
                    src={logoPreview}
                    alt="Preview"
                    className="size-full object-cover"
                    onError={() => setLogoPreviewError(true)}
                  />
                ) : (
                  <IconCamera className="size-8 text-muted-foreground/40" />
                )}
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto"
              >
                <IconPhoto className="mr-2 size-4" />
                Chọn ảnh từ máy
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Hoặc dùng URL</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-medium">Link hình ảnh</Label>
              <Input
                placeholder="https://example.com/logo.png"
                value={logoInput.startsWith('data:') ? '' : logoInput}
                onChange={(e) => handleLogoInputChange(e.target.value)}
                className="text-sm"
              />
              {logoPreviewError && (
                <p className="text-xs text-red-500">Hình ảnh không hợp lệ hoặc không tải được</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoDialog(false)} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={handleSaveLogo} disabled={saving || logoPreviewError}>
              {saving ? (
                <><IconLoader2 className="mr-2 size-4 animate-spin" />Đang lưu...</>
              ) : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cover Upload Dialog */}
      <Dialog open={coverDialog} onOpenChange={setCoverDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconPhoto className="size-5" />
              Cập nhật ảnh bìa
            </DialogTitle>
            <DialogDescription>
              Dán URL hình ảnh để thay đổi ảnh bìa cửa hàng
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Preview */}
            <div className="aspect-[3/1] rounded-lg border-2 border-dashed border-muted-foreground/30 overflow-hidden bg-muted">
              {coverPreview && !coverPreviewError ? (
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={() => setCoverPreviewError(true)}
                />
              ) : (
                <div className="flex size-full items-center justify-center flex-col gap-2">
                  <IconPhoto className="size-10 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground/50">Xem trước ảnh bìa</p>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-medium">URL hình ảnh</Label>
              <Input
                placeholder="https://example.com/cover.jpg"
                value={coverInput}
                onChange={(e) => handleCoverInputChange(e.target.value)}
                className="text-sm"
              />
              {coverPreviewError && (
                <p className="text-xs text-red-500">URL hình ảnh không hợp lệ hoặc không tải được</p>
              )}
              <p className="text-xs text-muted-foreground">
                Khuyến nghị: ảnh ngang tỉ lệ 3:1 (ví dụ 1200×400px)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCoverDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveCover} disabled={coverPreviewError}>
              Lưu ảnh bìa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
