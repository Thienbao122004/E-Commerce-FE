"use client"

import * as React from "react"
import { IconAlignLeft, IconCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"

interface ProductDescriptionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onChange: (value: string) => void
}

export function ProductDescriptionSheet({
  open,
  onOpenChange,
  value,
  onChange,
}: ProductDescriptionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <IconAlignLeft className="size-4 text-muted-foreground" />
            Mô tả sản phẩm
          </SheetTitle>
          <SheetDescription className="text-xs">
            Nhập mô tả chi tiết — hỗ trợ xuống dòng, không giới hạn ký tự.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Textarea
            id="desc-sheet-new-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Nhập mô tả chi tiết sản phẩm: chất liệu, kích thước, hướng dẫn sử dụng..."
            className="text-sm resize-none h-full min-h-[400px] rounded-xl"
          />
        </div>

        <SheetFooter className="px-6 py-4 border-t flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-xl gap-1.5"
            onClick={() => onOpenChange(false)}
          >
            <IconCheck className="size-3.5" />
            Xác nhận
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
