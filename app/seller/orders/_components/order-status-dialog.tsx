"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OrderStatus, OrderStatusLabels } from "@/types/seller-dashboard"

const validTransitions: Record<number, number[]> = {
  [OrderStatus.PendingPayment]: [],
  [OrderStatus.PendingConfirmation]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Confirmed]: [OrderStatus.Processing, OrderStatus.Cancelled],
  [OrderStatus.Processing]: [OrderStatus.Shipping, OrderStatus.Cancelled],
  [OrderStatus.Shipping]: [OrderStatus.Delivered],
  [OrderStatus.Delivered]: [OrderStatus.Completed],
  [OrderStatus.Completed]: [],
  [OrderStatus.Cancelled]: [],
  [OrderStatus.Refunded]: [],
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  orderId: string
  currentStatus: number
  loading: boolean
  onConfirm: (newStatus: number, note: string) => void
}

export function OrderStatusDialog({ open, onOpenChange, orderId, currentStatus, loading, onConfirm }: Props) {
  const transitions = validTransitions[currentStatus] ?? []
  const [newStatus, setNewStatus] = useState<number | null>(null)
  const [note, setNote] = useState("")

  useEffect(() => {
    if (open) {
      const t = validTransitions[currentStatus] ?? []
      setNewStatus(t[0] ?? null)
      setNote("")
    }
  }, [open, currentStatus])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái</DialogTitle>
          <DialogDescription>Đơn hàng #{orderId.slice(0, 8)}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select
            value={newStatus !== null ? String(newStatus) : ""}
            onValueChange={(val) => setNewStatus(Number(val))}
          >
            <SelectTrigger><SelectValue placeholder="Chọn trạng thái mới" /></SelectTrigger>
            <SelectContent>
              {transitions.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {OrderStatusLabels[s] ?? `Trạng thái ${s}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Ghi chú (không bắt buộc)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button
            onClick={() => { if (newStatus !== null) onConfirm(newStatus, note) }}
            disabled={loading || newStatus === null}
          >
            {loading ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { validTransitions }
