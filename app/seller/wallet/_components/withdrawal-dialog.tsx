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

  const QUICK_AMOUNTS = [500_000, 1_000_000, 2_000_000, 5_000_000]

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "success" ? (
              <IconCircleCheck className="size-5 text-green-500" />
            ) : (
              <IconBuildingBank className="size-5" />
            )}
            {step === "success" ? "Đã gửi yêu cầu!" : "Yêu cầu rút tiền"}
          </DialogTitle>
          {step !== "success" && (
            <DialogDescription>
              Số dư khả dụng:{" "}
              <strong className="text-primary">{currency(availableBalance)}</strong>
            </DialogDescription>
          )}
        </DialogHeader>

        {/* ── Step 1: Form ── */}
        {step === "form" && (
          <div className="grid gap-4 py-1">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Ngân hàng</Label>
              <Select value={form.bankName} onValueChange={(v) => setForm((f) => ({ ...f, bankName: v }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Chọn ngân hàng..." />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-medium">Số tài khoản</Label>
              <Input
                placeholder="Nhập số tài khoản..."
                value={form.accountNumber}
                onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, "") }))}
                className="text-sm tabular-nums"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-medium">Tên chủ tài khoản</Label>
              <Input
                placeholder="NGUYEN VAN A"
                value={form.accountHolder}
                onChange={(e) => setForm((f) => ({ ...f, accountHolder: e.target.value.toUpperCase() }))}
                className="text-sm uppercase"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-medium">Số tiền muốn rút (VND)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">₫</span>
                <Input
                  placeholder="Tối thiểu 100,000"
                  value={form.amount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "")
                    setForm((f) => ({ ...f, amount: raw ? Number(raw).toLocaleString("vi-VN") : "" }))
                  }}
                  className="text-sm pl-7 tabular-nums"
                />
              </div>
              {/* Quick amount buttons */}
              <div className="flex gap-2">
                {QUICK_AMOUNTS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    disabled={v > availableBalance}
                    onClick={() => setForm((f) => ({ ...f, amount: v.toLocaleString("vi-VN") }))}
                    className="flex-1 rounded-md border text-xs py-1.5 font-medium hover:bg-primary/5 hover:border-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {v >= 1_000_000 ? `${v / 1_000_000}tr` : `${v / 1_000}k`}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={availableBalance <= 0}
                  onClick={() => setForm((f) => ({ ...f, amount: availableBalance.toLocaleString("vi-VN") }))}
                  className="flex-1 rounded-md border text-xs py-1.5 font-medium text-primary hover:bg-primary/5 hover:border-primary/30 transition-colors disabled:opacity-30"
                >
                  Tất cả
                </button>
              </div>
              {amountNum > 0 && amountNum < 100_000 && (
                <p className="text-xs text-red-500">Số tiền tối thiểu là 100.000 ₫</p>
              )}
              {amountNum > availableBalance && (
                <p className="text-xs text-red-500">Số tiền vượt quá số dư khả dụng</p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Confirm ── */}
        {step === "confirm" && (
          <div className="grid gap-4 py-1">
            <div className="flex items-start gap-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-3 text-sm text-yellow-700 dark:text-yellow-400">
              <IconAlertTriangle className="size-4 shrink-0 mt-0.5" />
              <p>Vui lòng kiểm tra kỹ thông tin trước khi xác nhận. Yêu cầu không thể hoàn tác sau khi gửi.</p>
            </div>
            <div className="rounded-lg border overflow-hidden">
              {[
                ["Ngân hàng", form.bankName],
                ["Số tài khoản", form.accountNumber],
                ["Chủ tài khoản", form.accountHolder],
                ["Số tiền", currency(amountNum)],
              ].map(([label, value], i) => (
                <div
                  key={label}
                  className={`flex justify-between px-4 py-2.5 text-sm ${
                    i % 2 === 0 ? "bg-muted/30" : ""
                  }`}
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium tabular-nums">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Success ── */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex items-center justify-center size-16 rounded-full bg-green-100 dark:bg-green-950">
              <IconCircleCheck className="size-9 text-green-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">Yêu cầu đã được gửi!</p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-[280px] mx-auto">
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
