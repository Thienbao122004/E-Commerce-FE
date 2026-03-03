import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { AdminDispute } from "@/types/dispute"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

export function DisputeActionDialog({
  dispute,
  dialogType,
  onClose,
  loading,
  onConfirm,
}: {
  dispute: AdminDispute | null
  dialogType: "approve" | "reject" | null
  onClose: () => void
  loading: boolean
  onConfirm: (resolution: string, adminNote: string, approvedAmount?: number) => void
}) {
  const [resolution, setResolution] = React.useState("")
  const [adminNote, setAdminNote] = React.useState("")
  const [approvedAmount, setApprovedAmount] = React.useState("")

  React.useEffect(() => {
    if (dispute) {
      setResolution("")
      setAdminNote("")
      setApprovedAmount(dialogType === "approve" ? String(dispute.requestedAmount) : "")
    }
  }, [dispute, dialogType])

  const handleConfirm = () => {
    onConfirm(
      resolution,
      adminNote,
      dialogType === "approve" && approvedAmount ? Number(approvedAmount) : undefined
    )
  }

  return (
    <Dialog open={dispute !== null} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {dialogType === "approve" ? "Duyệt hoàn tiền" : "Từ chối tranh chấp"}
          </DialogTitle>
          <DialogDescription>
            Tranh chấp: {dispute?.id.slice(0, 8)}... · {dispute?.title}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {dialogType === "approve" && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Số tiền duyệt</label>
              <Input
                type="number"
                placeholder="Nhập số tiền..."
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Yêu cầu: {dispute ? currency(dispute.requestedAmount) : ""}
              </p>
              {approvedAmount && Number(approvedAmount) > (dispute?.requestedAmount ?? 0) && (
                <p className="text-xs text-red-500 mt-1">⚠️ Số tiền duyệt không được vượt quá số tiền yêu cầu</p>
              )}
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Kết luận *</label>
            <Textarea
              placeholder="Nhập kết luận xử lý..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="min-h-[60px]"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Ghi chú admin (tùy chọn)</label>
            <Textarea
              placeholder="Ghi chú nội bộ..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="min-h-[40px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !resolution}
            variant={dialogType === "approve" ? "default" : "destructive"}
          >
            {loading ? "Đang xử lý..." : dialogType === "approve" ? "Duyệt hoàn tiền" : "Từ chối"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
