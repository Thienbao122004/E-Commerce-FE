import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { disputeRefundCeiling, type AdminDispute } from "@/types/dispute"
import { formatPriceVND } from "@/lib/formatters"

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

  const ceiling = dispute ? disputeRefundCeiling(dispute) : 0
  const lineSum =
    dispute?.affectedItems && dispute.affectedItems.length > 0
      ? dispute.affectedItems.reduce((s, i) => s + i.lineTotal, 0)
      : 0

  const handleConfirm = () => {
    if (dialogType === "approve") {
      const trimmed = approvedAmount.trim()
      const parsed = trimmed === "" ? undefined : Number(trimmed)
      onConfirm(resolution, adminNote, parsed)
    } else {
      onConfirm(resolution, adminNote, undefined)
    }
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
              <p className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <span className="block">Yêu cầu: {dispute ? formatPriceVND(dispute.requestedAmount) : ""}</span>
                {dispute && dispute.requestedAmount <= 0 && dispute.orderTotal != null && (
                  <span className="block">
                    Tối đa theo đơn: {formatPriceVND(dispute.orderTotal)}
                  </span>
                )}
                {lineSum > 0 && (
                  <span className="block text-amber-600">
                    Trần theo dòng hàng khiếu nại: {formatPriceVND(lineSum)}
                    {lineSum < (dispute?.requestedAmount ?? Infinity) && " (thấp hơn yêu cầu — BE sẽ dùng giá trị này)"}
                  </span>
                )}
              </p>
              {dispute &&
                approvedAmount.trim() !== "" &&
                !Number.isNaN(Number(approvedAmount)) &&
                Number(approvedAmount) > ceiling && (
                <p className="text-xs text-red-500 mt-1">
                  Số tiền duyệt không được vượt quá{" "}
                  {dispute.requestedAmount > 0
                    ? lineSum > 0 && lineSum < dispute.requestedAmount
                      ? "tổng giá trị dòng hàng khiếu nại"
                      : "số tiền yêu cầu"
                    : lineSum > 0
                      ? "tổng giá trị dòng hàng khiếu nại"
                      : "tổng đơn hàng"}
                </p>
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
