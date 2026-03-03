import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  loading,
  onConfirm,
  requireReason,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description: string
  loading: boolean
  onConfirm: (reason: string) => void
  requireReason: boolean
}) {
  const [reason, setReason] = React.useState("")

  React.useEffect(() => {
    if (open) setReason("")
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {requireReason && (
          <Textarea
            placeholder="Nhập lý do..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[80px]"
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={loading || (requireReason && !reason.trim())}
          >
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
