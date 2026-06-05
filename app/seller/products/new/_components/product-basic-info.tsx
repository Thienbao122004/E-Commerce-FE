"use client"

import * as React from "react"
import { IconAlignLeft } from "@tabler/icons-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SellerPlatformFeeHint } from "@/components/seller/seller-platform-fee-hint"

interface ProductBasicInfoProps {
  name: string
  onNameChange: (v: string) => void
  nameTouched: boolean
  onNameBlur: () => void
  price: string
  priceRaw: number
  onPriceChange: (formatted: string, raw: number) => void
  priceTouched: boolean
  onPriceBlur: () => void
  commissionPercent: number | null
  platformFeeLoading: boolean
  useVariants: boolean
  onOpenDescSheet: () => void
  description: string
  children: React.ReactNode // variants section
}

export function ProductBasicInfo({
  name,
  onNameChange,
  nameTouched,
  onNameBlur,
  price,
  priceRaw,
  onPriceChange,
  priceTouched,
  onPriceBlur,
  commissionPercent,
  platformFeeLoading,
  useVariants,
  onOpenDescSheet,
  description,
  children,
}: ProductBasicInfoProps) {
  return (
    <Card className="!rounded">
      <CardContent className="grid gap-3">
        {/* Tên sản phẩm */}
        <div className="grid gap-2">
          <Label htmlFor="name" className="text-xs">
            Tên sản phẩm <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Ví dụ: Cà phê Robusta Buôn Ma Thuột rang mộc 500g"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onNameBlur}
            className={`h-9 text-sm ${nameTouched && !name.trim() ? "border-red-400 focus-visible:ring-red-400" : ""}`}
          />
          {nameTouched && !name.trim() && (
            <p className="text-[11px] text-red-500">Tên sản phẩm là bắt buộc</p>
          )}
        </div>

        {/* Giá bán */}
        <div className="grid gap-2">
          <Label htmlFor="price" className="text-xs">
            Giá bán (VND) <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">₫</span>
            <Input
              id="price"
              inputMode="numeric"
              placeholder="299,000"
              value={price}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^0-9]/g, "")
                const num = digits === "" ? 0 : Number(digits)
                onPriceChange(digits === "" ? "" : num.toLocaleString("vi-VN"), num)
              }}
              onBlur={onPriceBlur}
              className={`h-9 pl-7 text-sm ${priceTouched && priceRaw <= 0 ? "border-red-400 focus-visible:ring-red-400" : ""}`}
            />
          </div>
          {priceTouched && priceRaw <= 0 && (
            <p className="text-[11px] text-red-500">Giá bán phải lớn hơn 0</p>
          )}
          <SellerPlatformFeeHint
            commissionPercent={commissionPercent}
            loading={platformFeeLoading}
            grossVnd={!useVariants && priceRaw > 0 ? priceRaw : undefined}
            isMultiPrice={useVariants}
            className="mt-1"
          />
        </div>

        {/* Variants / SKU / Stock — được truyền từ bên ngoài */}
        {children}

        {/* Mô tả sản phẩm */}
        <div className="grid gap-2">
          <Label className="text-xs">Mô tả sản phẩm</Label>
          <button
            type="button"
            onClick={onOpenDescSheet}
            className="w-full text-left rounded-xl border bg-muted/20 border-muted hover:border-primary/50 transition-colors px-3 py-2.5 min-h-[72px] group"
          >
            {description ? (
              <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">{description}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground">Nhấn để nhập mô tả sản phẩm...</p>
            )}
            <span className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-primary transition-colors">
              <IconAlignLeft className="size-3" /> Nhấn để chỉnh sửa
            </span>
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
