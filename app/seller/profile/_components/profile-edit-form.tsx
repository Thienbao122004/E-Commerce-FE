/* eslint-disable react-hooks/set-state-in-effect */
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
      <CardHeader className="py-3.5 px-4 lg:px-5 border-b">
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent className="grid gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="grid gap-2">
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

  useEffect(() => {
    if (shop) {
      setName(shop.name ?? "")
      setDescription(shop.description ?? "")
    }
  }, [shop])

  if (loading) return <FormSkeleton />

  const hasChanges =
    name !== (shop?.name ?? "") ||
    description !== (shop?.description ?? "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const dto: UpdateShopPayload = {}
    if (name.trim() && name !== shop?.name) dto.name = name.trim()
    if (description !== (shop?.description ?? "")) dto.description = description
    if (Object.keys(dto).length === 0) return
    await onSave(dto)
  }

  return (
    <>

      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-muted">
              <IconInfoCircle className="size-3.5 text-muted-foreground" />
            </div>
            Thông tin cơ bản
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="shop-name" className="text-xs font-medium">
                Tên thương hiệu
              </Label>
              <Input
                id="shop-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên thương hiệu"
                maxLength={255}
                className="text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shop-description" className="text-xs font-medium">
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
              <p className="text-xs text-muted-foreground text-right tabular-nums">
                {description.length} / 2000
              </p>
            </div>

          </form>
        </CardContent>
      </Card>
      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={saving || !hasChanges} className="min-w-[140px]">
          {saving ? (
            <><IconLoader2 className="mr-2 size-4 animate-spin" />Đang lưu...</>
          ) : (
            <><IconDeviceFloppy className="mr-2 size-4" />Lưu thay đổi</>
          )}
        </Button>
      </div>
    </>
  )
}
