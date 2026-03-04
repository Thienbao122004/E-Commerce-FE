"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { IconInfoCircle, IconLoader2, IconDeviceFloppy } from "@tabler/icons-react"
import type { SellerShopInfo, UpdateShopPayload } from "@/types/seller-dashboard"

type Props = {
  shop: SellerShopInfo | null
  loading: boolean
  saving: boolean
  onSave: (dto: UpdateShopPayload) => Promise<boolean>
}

function FormSkeleton() {
  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent className="p-4 grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid gap-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ProfileEditForm({ shop, loading, saving, onSave }: Props) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    if (shop) {
      setName(shop.name ?? "")
      setDescription(shop.description ?? "")
      setLogoUrl(shop.logoUrl ?? "")
      setLogoError(false)
    }
  }, [shop])

  if (loading) return <FormSkeleton />

  const hasChanges =
    name !== (shop?.name ?? "") ||
    description !== (shop?.description ?? "") ||
    logoUrl !== (shop?.logoUrl ?? "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const dto: UpdateShopPayload = {}
    if (name.trim() && name !== shop?.name) dto.name = name.trim()
    if (description !== (shop?.description ?? "")) dto.description = description
    if (logoUrl.trim() !== (shop?.logoUrl ?? "")) dto.logoUrl = logoUrl.trim() || undefined
    if (Object.keys(dto).length === 0) return
    await onSave(dto)
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm flex items-center gap-2">
          <IconInfoCircle className="size-4 text-muted-foreground" />
          Thông tin cơ bản
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="shop-name" className="text-xs">Tên thương hiệu</Label>
            <Input
              id="shop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên thương hiệu"
              maxLength={255}
              className="h-9 text-sm"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="shop-description" className="text-xs">
              Câu chuyện thương hiệu (Storytelling)
            </Label>
            <Textarea
              id="shop-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả câu chuyện thương hiệu, sứ mệnh và giá trị của bạn..."
              rows={5}
              maxLength={2000}
              className="resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground text-right">{description.length} / 2000</p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="logo-url" className="text-xs">Logo URL</Label>
            <Input
              id="logo-url"
              value={logoUrl}
              onChange={(e) => { setLogoUrl(e.target.value); setLogoError(false) }}
              placeholder="https://example.com/logo.png"
              className="h-9 text-sm"
            />
            {logoUrl && (
              <div className="flex items-center gap-3 mt-1">
                <div className="size-12 rounded-lg border bg-muted overflow-hidden shrink-0">
                  {!logoError ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="size-full object-cover"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                      Lỗi
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {logoError ? "URL không hợp lệ" : "Xem trước logo"}
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Slug (đường dẫn)</Label>
            <Input value={shop?.slug ?? ""} disabled className="h-9 text-sm bg-muted" />
            <p className="text-xs text-muted-foreground">Slug không thể thay đổi</p>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button type="submit" disabled={saving || !hasChanges} className="min-w-[130px] h-9">
              {saving ? (
                <><IconLoader2 className="mr-2 size-4 animate-spin" />Đang lưu...</>
              ) : (
                <><IconDeviceFloppy className="mr-2 size-4" />Lưu thay đổi</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
