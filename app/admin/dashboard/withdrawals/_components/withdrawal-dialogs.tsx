import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { WithdrawRequest } from "@/types/withdraw"

const fmtMoney = (amount: number, cur: string) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: cur || "VND" }).format(amount)

type DialogType = "approve" | "reject" | null

export function WithdrawalDialogs({
  dialogType,
  target,
  busy,
  onClose,
  onApprove,
  onReject,
}: {
  dialogType: DialogType
  target: WithdrawRequest | null
  busy: boolean
  onClose: () => void
  onApprove: (adminNote: string) => void
  onReject: (reason: string, adminNote: string) => void
}) {
  const [reason, setReason] = React.useState("")
  const [adminNote, setAdminNote] = React.useState("")

  React.useEffect(() => {
    if (dialogType) { setReason(""); setAdminNote("") }
  }, [dialogType])

  return (
    <>
      <Dialog open={dialogType === "approve"} onOpenChange={(v) => { if (!v) onClose() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt yêu cầu rút tiền</DialogTitle>
            <DialogDescription>
              Xác nhận duyệt rút {target ? fmtMoney(target.amount, target.currency) : ""} cho {target?.sellerName}?
            </DialogDescription>
          </DialogHeader>
          {target && (
            <div className="rounded-md bg-muted/50 border p-3 space-y-1.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Thông tin chuyển khoản</p>
              <div className="grid grid-cols-2 gap-1 text-sm">
                <span className="text-muted-foreground">Ngân hàng:</span>
                <span className="font-medium">{target.bankName}</span>
                <span className="text-muted-foreground">Số TK:</span>
                <span className="font-mono font-medium">{target.bankAccountNumber}</span>
                <span className="text-muted-foreground">Chủ TK:</span>
                <span className="font-medium">{target.bankAccountName}</span>
                <span className="text-muted-foreground">Số tiền:</span>
                <span className="font-bold text-emerald-600">{fmtMoney(target.amount, target.currency)}</span>
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Ghi chú admin (tùy chọn)</label>
            <Textarea placeholder="Ghi chú..." value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="min-h-[60px]" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={busy}>Hủy</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onApprove(adminNote)} disabled={busy}>
              {busy ? "Đang xử lý..." : "Duyệt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "reject"} onOpenChange={(v) => { if (!v) onClose() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu rút tiền</DialogTitle>
            <DialogDescription>
              Từ chối rút {target ? fmtMoney(target.amount, target.currency) : ""} của {target?.sellerName}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Lý do từ chối *</label>
              <Textarea placeholder="Nhập lý do..." value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[60px]" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ghi chú admin (tùy chọn)</label>
              <Textarea placeholder="Ghi chú..." value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={busy}>Hủy</Button>
            <Button variant="destructive" onClick={() => onReject(reason, adminNote)} disabled={busy || !reason}>
              {busy ? "Đang xử lý..." : "Từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
