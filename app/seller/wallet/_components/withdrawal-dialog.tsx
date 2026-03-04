"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconAlertTriangle,
  IconBuildingBank,
  IconCircleCheck,
  IconLoader2,
} from "@tabler/icons-react"
import type { CreateWithdrawalPayload } from "@/types/seller-dashboard"

const BANKS = [
  "Vietcombank", "MB Bank", "Techcombank", "VPBank", "ACB",
  "BIDV", "Agribank", "Sacombank", "TPBank", "HDBank",
]

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

type Step = "form" | "confirm" | "success"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  availableBalance: number
  submitting: boolean
  onSubmit: (dto: CreateWithdrawalPayload) => Promise<boolean>
}

const EMPTY_FORM = { bankName: "", accountNumber: "", accountHolder: "", amount: "" }

export function WithdrawalDialog({ open, onOpenChange, availableBalance, submitting, onSubmit }: Props) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [step, setStep] = useState<Step>("form")

  const amountNum = Number(form.amount.replace(/\D/g, ""))
  const canSubmit =
    form.bankName &&
    form.accountNumber.length >= 6 &&
    form.accountHolder.trim() &&
    amountNum >= 100_000 &&
    amountNum <= availableBalance

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => { setStep("form"); setForm(EMPTY_FORM) }, 300)
  }

  const handleAction = async () => {
    if (step === "form") { setStep("confirm"); return }
    if (step === "confirm") {
      const ok = await onSubmit({
        amount: amountNum,
        bankName: form.bankName,
        bankAccountNumber: form.accountNumber,
        bankAccountName: form.accountHolder,
      })
      if (ok) setStep("success")
      return
    }
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconBuildingBank className="size-5" />
            {step === "success" ? "Đã gửi yêu cầu!" : "Yêu cầu rút tiền"}
          </DialogTitle>
          {step !== "success" && (
            <DialogDescription>
              Số dư khả dụng:{" "}
              <strong className="text-foreground">{currency(availableBalance)}</strong>
            </DialogDescription>
          )}
        </DialogHeader>

        {step === "form" && (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs">Ngân hàng</Label>
              <Select value={form.bankName} onValueChange={(v) => setForm((f) => ({ ...f, bankName: v }))}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Chọn ngân hàng..." />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Số tài khoản</Label>
              <Input
                placeholder="Nhập số tài khoản..."
                value={form.accountNumber}
                onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, "") }))}
                className="h-9 text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Tên chủ tài khoản</Label>
              <Input
                placeholder="NGUYEN VAN A"
                value={form.accountHolder}
                onChange={(e) => setForm((f) => ({ ...f, accountHolder: e.target.value.toUpperCase() }))}
                className="h-9 text-sm uppercase"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Số tiền muốn rút (VND)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">₫</span>
                <Input
                  placeholder="Tối thiểu 100,000"
                  value={form.amount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "")
                    setForm((f) => ({ ...f, amount: raw ? Number(raw).toLocaleString("vi-VN") : "" }))
                  }}
                  className="h-9 text-sm pl-7"
                />
              </div>
              <div className="flex gap-2">
                {[500_000, 1_000_000, 2_000_000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    disabled={v > availableBalance}
                    onClick={() => setForm((f) => ({ ...f, amount: v.toLocaleString("vi-VN") }))}
                    className="flex-1 rounded border text-[11px] py-1 hover:bg-muted transition-colors disabled:opacity-40"
                  >
                    {(v / 1_000_000).toFixed(v < 1_000_000 ? 1 : 0)}tr
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, amount: availableBalance.toLocaleString("vi-VN") }))}
                  className="flex-1 rounded border text-[11px] py-1 hover:bg-muted transition-colors"
                >
                  Tất cả
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="grid gap-3">
            <div className="flex items-start gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 p-3 text-sm text-yellow-700">
              <IconAlertTriangle className="size-4 shrink-0 mt-0.5" />
              <p>Vui lòng kiểm tra kỹ thông tin trước khi xác nhận. Yêu cầu không thể hoàn tác sau khi gửi.</p>
            </div>
            {[
              ["Ngân hàng", form.bankName],
              ["Số tài khoản", form.accountNumber],
              ["Chủ tài khoản", form.accountHolder],
              ["Số tiền", currency(amountNum)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm border-b pb-2 last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex items-center justify-center size-14 rounded-full bg-green-100 dark:bg-green-950">
              <IconCircleCheck className="size-8 text-green-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Yêu cầu đã được gửi!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tiền sẽ được chuyển về tài khoản trong 1–3 ngày làm việc.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step !== "success" && (
            <Button
              variant="outline"
              onClick={() => (step === "confirm" ? setStep("form") : handleClose())}
              disabled={submitting}
            >
              {step === "confirm" ? "Quay lại" : "Hủy"}
            </Button>
          )}
          <Button onClick={handleAction} disabled={(step === "form" && !canSubmit) || submitting}>
            {submitting ? (
              <><IconLoader2 className="mr-2 size-4 animate-spin" />Đang gửi...</>
            ) : step === "form" ? "Tiếp theo"
              : step === "confirm" ? "Xác nhận rút tiền"
              : "Đóng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
