"use client"

import * as React from "react"
import { IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export type VariantDraftRow = {
  id: string
  variantName: string
  sku: string
  price: string
  quantity: string
  attributes: string
}

export function newVariantDraftRow(): VariantDraftRow {
  return {
    id: Math.random().toString(36).slice(2),
    variantName: "",
    sku: "",
    price: "",
    quantity: "0",
    attributes: "",
  }
}

export function parseAttributesStr(attrStr: string): Record<string, string> {
  const result: Record<string, string> = {}
  const leftoverSegments: string[] = []

  if (attrStr.startsWith("{") || attrStr.startsWith("[")) {
    try {
      const parsed = JSON.parse(attrStr)
      return typeof parsed === "object" && parsed !== null ? parsed : { "Thuộc tính": attrStr }
    } catch {
      return { "Thuộc tính": attrStr }
    }
  }

  const segments = attrStr.split(",")
  for (const seg of segments) {
    // eslint-disable-next-line prefer-const
    let text = seg.trim()
    if (!text) continue

    const firstColon = text.indexOf(":")
    if (firstColon > 0) {
      let k = text.substring(0, firstColon).trim()
      let v = text.substring(firstColon + 1).trim()

      if (k.toLowerCase() === "size") {
        k = "Size"
        v = v.toUpperCase()
      } else if (k.toLowerCase() === "màu" || k.toLowerCase() === "màu sắc") {
        k = "Màu"
        v = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
      } else {
        k = k.charAt(0).toUpperCase() + k.slice(1)
      }

      if (k) {
        if (result[k]) result[k] += `, ${v}`
        else result[k] = v
      } else {
        leftoverSegments.push(text)
      }
    } else {
      const lower = text.toLowerCase()
      if (lower.startsWith("size ") || lower.startsWith("size")) {
        const val = text.substring(4).trim()
        if (val) {
          const finalVal = val.toUpperCase()
          if (result["Size"]) result["Size"] += `, ${finalVal}`
          else result["Size"] = finalVal
          continue
        }
      } else if (lower.startsWith("màu ") || lower.startsWith("màu")) {
        const idx = lower.startsWith("màu sắc") ? 7 : 3
        const val = text.substring(idx).trim()
        if (val) {
          const finalVal = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()
          if (result["Màu"]) result["Màu"] += `, ${finalVal}`
          else result["Màu"] = finalVal
          continue
        }
      }

      const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1)
      leftoverSegments.push(capitalizedText)
    }
  }

  if (leftoverSegments.length > 0) {
    if (Object.keys(result).length === 0) {
      result["Phân loại"] = leftoverSegments.join(", ")
    } else {
      result["Khác"] = leftoverSegments.join(", ")
    }
  }

  return result
}

interface ProductVariantsProps {
  useVariants: boolean
  onUseVariantsChange: (checked: boolean) => void
  variantRows: VariantDraftRow[]
  onVariantRowsChange: (rows: VariantDraftRow[]) => void
  sku: string
  onSkuChange: (sku: string) => void
  baseStock: string
  onBaseStockChange: (stock: string) => void
}

export function ProductVariants({
  useVariants,
  onUseVariantsChange,
  variantRows,
  onVariantRowsChange,
  sku,
  onSkuChange,
  baseStock,
  onBaseStockChange,
}: ProductVariantsProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-muted-foreground/15 bg-muted/20 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">Nhiều phân loại (màu, size…)</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Bật để tạo nhiều SKU cùng lúc; tắt để một mặt hàng với tồn kho chung.
          </p>
        </div>
        <Switch
          checked={useVariants}
          onCheckedChange={(checked) => {
            onUseVariantsChange(checked)
            if (checked && variantRows.length === 0) {
              onVariantRowsChange([newVariantDraftRow()])
            }
          }}
          className="shrink-0"
        />
      </div>

      {!useVariants ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="sku" className="text-xs">Mã SKU</Label>
            <Input
              id="sku"
              placeholder="Tùy chọn"
              value={sku}
              onChange={(e) => onSkuChange(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="baseStock" className="text-xs">Tồn kho</Label>
            <Input
              id="baseStock"
              type="number"
              min="0"
              value={baseStock}
              onChange={(e) => onBaseStockChange(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-2 rounded-xl border border-muted-foreground/15 p-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-semibold">Danh sách biến thể</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => onVariantRowsChange([...variantRows, newVariantDraftRow()])}
            >
              <IconPlus className="size-3.5" />
              Thêm dòng
            </Button>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {variantRows.map((row, idx) => (
              <div
                key={row.id}
                className="grid gap-2 rounded-lg border bg-background/80 p-2.5 sm:grid-cols-12 sm:items-end"
              >
                <div className="sm:col-span-4 grid gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Tên *</span>
                  <Input
                    value={row.variantName}
                    onChange={(e) =>
                      onVariantRowsChange(
                        variantRows.map((r) => (r.id === row.id ? { ...r, variantName: e.target.value } : r))
                      )
                    }
                    placeholder={`Loại ${idx + 1}`}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="sm:col-span-2 grid gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">SKU</span>
                  <Input
                    value={row.sku}
                    onChange={(e) =>
                      onVariantRowsChange(
                        variantRows.map((r) => (r.id === row.id ? { ...r, sku: e.target.value } : r))
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="sm:col-span-2 grid gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Giá</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-semibold">₫</span>
                    <Input
                      inputMode="numeric"
                      value={row.price}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^0-9]/g, "")
                        const formatted = digits === "" ? "" : Number(digits).toLocaleString("vi-VN")
                        onVariantRowsChange(
                          variantRows.map((r) => (r.id === row.id ? { ...r, price: formatted } : r))
                        )
                      }}
                      placeholder="Trống = giá gốc"
                      className="h-8 pl-5 text-xs"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 grid gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Tồn *</span>
                  <Input
                    type="number"
                    min="0"
                    value={row.quantity}
                    onChange={(e) =>
                      onVariantRowsChange(
                        variantRows.map((r) => (r.id === row.id ? { ...r, quantity: e.target.value } : r))
                      )
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end pb-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground"
                    disabled={variantRows.length <= 1}
                    onClick={() => onVariantRowsChange(variantRows.filter((r) => r.id !== row.id))}
                  >
                    Xóa
                  </Button>
                </div>
                <div className="sm:col-span-12 grid gap-1 mt-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Thuộc tính <span className="text-muted-foreground/60 normal-case tracking-normal">(Tùy chọn)</span>
                  </span>
                  <Input
                    value={row.attributes}
                    onChange={(e) =>
                      onVariantRowsChange(
                        variantRows.map((r) => (r.id === row.id ? { ...r, attributes: e.target.value } : r))
                      )
                    }
                    placeholder="VD: Màu: Đỏ, Size: L"
                    className="h-8 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5 mb-1.5">
                    Hệ thống tự nhận diện các thuộc tính theo định dạng{" "}
                    <strong className="font-semibold text-foreground/80">Khóa: Giá trị</strong>, phân tách bằng dấu phẩy.
                  </p>
                  {row.attributes.trim() && (
                    <div className="rounded bg-emerald-50 text-emerald-700 px-2.5 py-1.5 text-[10px] mt-1 border border-emerald-100/50">
                      <span className="font-semibold opacity-75 mr-1">Đã nhận diện:</span>
                      {Object.entries(parseAttributesStr(row.attributes)).map(([k, v]) => (
                        <span key={k} className="inline-flex items-center gap-1 mr-2 px-1 rounded bg-white shadow-sm border border-emerald-100">
                          <span className="font-semibold opacity-80">{k}:</span>
                          <span>{v}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
