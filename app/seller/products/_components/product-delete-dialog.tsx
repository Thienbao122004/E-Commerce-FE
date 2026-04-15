"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  loading: boolean
  productName: string
  onConfirm: () => void
}

export function ProductDeleteDialog({ open, onOpenChange, loading, productName, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Xóa sản phẩm</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa sản phẩm{" "}
            <span className="font-semibold text-foreground">{productName}</span>?{" "}
            Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Đang xóa..." : "Xóa sản phẩm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
