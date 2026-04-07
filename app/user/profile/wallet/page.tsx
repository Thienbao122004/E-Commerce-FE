'use client'

import { useState, useEffect, useCallback } from 'react'
import { customerWalletService } from '@/services/customer-wallet'
import type {
  CustomerWalletDto,
  CustomerWalletLedgerItem,
  CustomerWithdrawalRequestDto,
} from '@/types/customer-wallet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const BANKS = [
  'Vietcombank', 'MB Bank', 'Techcombank', 'VPBank', 'ACB',
  'BIDV', 'Agribank', 'Sacombank', 'TPBank', 'HDBank',
]

const QUICK_AMOUNTS = [100_000, 500_000, 1_000_000, 2_000_000]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

function StatusBadge({ status }: { status: 0 | 1 | 2 | 3 }) {
  const config = {
    0: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    1: { label: 'Đã duyệt', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    2: { label: 'Từ chối', className: 'bg-red-100 text-red-700 border-red-200' },
    3: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-700 border-green-200' },
  }[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  )
}

export default function CustomerWalletPage() {
  const [wallet, setWallet] = useState<CustomerWalletDto | null>(null)
  const [transactions, setTransactions] = useState<CustomerWalletLedgerItem[]>([])
  const [requests, setRequests] = useState<CustomerWithdrawalRequestDto[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'transactions' | 'requests'>('transactions')

  type Step = 'form' | 'confirm'
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({
    amount: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
  })

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [walletRes, txRes, reqRes] = await Promise.all([
        customerWalletService.getWallet(),
        customerWalletService.getTransactions(1, 50),
        customerWalletService.getWithdrawalRequests(1, 50),
      ])
      if (walletRes.success) setWallet(walletRes.data)
      if (txRes.success) setTransactions(txRes.transactions)
      if (reqRes.success) setRequests(reqRes.requests)
    } catch {
      toast.error('Không thể tải thông tin ví')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openDialog = () => {
    setForm({ amount: '', bankName: '', bankAccountNumber: '', bankAccountName: '' })
    setStep('form')
    setDialogOpen(true)
  }

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setDialogOpen(false)
      setTimeout(() => { setStep('form'); setForm({ amount: '', bankName: '', bankAccountNumber: '', bankAccountName: '' }) }, 300)
    }
  }

  const handleAction = async () => {
    if (step === 'form') { setStep('confirm'); return }

    try {
      setSubmitting(true)
      const res = await customerWalletService.createWithdrawalRequest({
        amount: amountNum,
        bankName: form.bankName,
        bankAccountNumber: form.bankAccountNumber,
        bankAccountName: form.bankAccountName,
      })
      if (res.success) {
        toast.success('Yêu cầu rút tiền đã được gửi')
        setDialogOpen(false)
        await load()
      } else {
        toast.error(res.message ?? 'Không thể gửi yêu cầu')
      }
    } catch {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-[5px] shadow-sm border p-6" style={{ borderColor: '#e5ded6' }}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-28 bg-gray-100 rounded-lg" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  const hasPending = requests.some((r) => r.status === 0)
  const availableBalance = wallet?.availableBalance ?? 0

  const amountNum = Number(form.amount.replace(/\D/g, ''))
  const amountError =
    amountNum > 0 && amountNum < 10_000
      ? 'Số tiền tối thiểu là 10.000 ₫'
      : amountNum > availableBalance
      ? 'Số tiền vượt quá số dư khả dụng'
      : null
  const canProceed =
    !!form.bankName &&
    form.bankAccountNumber.length >= 6 &&
    !!form.bankAccountName.trim() &&
    amountNum >= 10_000 &&
    amountNum <= availableBalance

  return (
    <>
      <div className="bg-white rounded-[5px] shadow-sm border" style={{ borderColor: '#e5ded6' }}>
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>
            Ví Của Tôi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Số dư từ đơn hàng đã thanh toán bị huỷ hoặc hoàn tiền khiếu nại
          </p>
        </div>
        <Separator />

        {/* Balance card */}
        <div className="px-6 py-6">
          <div
            className="rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa' }}
          >
            <div>
              <p className="text-sm text-orange-600 font-medium mb-1">Số dư khả dụng</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {formatCurrency(availableBalance)}
              </p>
              <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
                <span>Tổng đã nhận: <strong>{formatCurrency(wallet?.totalRefunded ?? 0)}</strong></span>
                <span>Đã rút: <strong>{formatCurrency(wallet?.totalWithdrawn ?? 0)}</strong></span>
              </div>
            </div>
            <Button
              onClick={openDialog}
              disabled={availableBalance <= 0 || hasPending}
              className="shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Yêu cầu rút tiền
            </Button>
          </div>
          {hasPending && (
            <p className="text-xs text-muted-foreground mt-2">
              Bạn đang có một yêu cầu rút tiền chờ xử lý. Vui lòng chờ xử lý trước khi tạo yêu cầu mới.
            </p>
          )}
        </div>

        <Separator />

        {/* Tabs */}
        <div className="px-6">
          <div className="flex border-b" style={{ borderColor: '#e5ded6' }}>
            {[
              { key: 'transactions', label: 'Lịch sử giao dịch' },
              { key: 'requests', label: 'Lịch sử rút tiền' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab.key
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4">
          {activeTab === 'transactions' && (
            transactions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Chưa có giao dịch nào
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#e5ded6' }}>
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`material-symbols-outlined text-[22px] shrink-0 ${
                          tx.type === 'refund' ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {tx.type === 'refund' ? 'add_circle' : 'remove_circle'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-main)' }}>
                          {tx.note ?? (tx.type === 'refund' ? 'Hoàn tiền' : 'Rút tiền')}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold shrink-0 ${
                        tx.type === 'refund' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'refund' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'requests' && (
            requests.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Chưa có yêu cầu rút tiền nào
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#e5ded6' }}>
                {requests.map((req) => (
                  <div key={req.id} className="py-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-main)' }}>
                        {formatCurrency(req.amount)}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {req.bankName} · {req.bankAccountNumber} · {req.bankAccountName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Yêu cầu lúc {formatDate(req.requestedAt)}
                      {req.reviewedAt && ` · Xử lý lúc ${formatDate(req.reviewedAt)}`}
                    </p>
                    {req.rejectionReason && (
                      <p className="text-xs text-red-600">Lý do từ chối: {req.rejectionReason}</p>
                    )}
                    {req.adminNote && (
                      <p className="text-xs text-muted-foreground">Ghi chú: {req.adminNote}</p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Withdrawal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yêu cầu rút tiền</DialogTitle>
            {step === 'form' && (
              <DialogDescription>
                Số dư khả dụng:{' '}
                <strong style={{ color: 'var(--color-primary)' }}>
                  {formatCurrency(availableBalance)}
                </strong>
              </DialogDescription>
            )}
          </DialogHeader>

          {step === 'form' && (
            <div className="space-y-4 py-1">
              {/* Bank */}
              <div className="space-y-2">
                <Label>Ngân hàng</Label>
                <Select
                  value={form.bankName}
                  onValueChange={(v) => setForm((f) => ({ ...f, bankName: v }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Chọn ngân hàng..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Account number */}
              <div className="space-y-2">
                <Label htmlFor="w-account-number">Số tài khoản</Label>
                <Input
                  id="w-account-number"
                  inputMode="numeric"
                  value={form.bankAccountNumber}
                  onChange={(e) => setForm((f) => ({ ...f, bankAccountNumber: e.target.value.replace(/\D/g, '') }))}
                  placeholder="Nhập số tài khoản"
                  className="tabular-nums"
                />
              </div>

              {/* Account name */}
              <div className="space-y-2">
                <Label htmlFor="w-account-name">Tên chủ tài khoản</Label>
                <Input
                  id="w-account-name"
                  value={form.bankAccountName}
                  onChange={(e) => setForm((f) => ({ ...f, bankAccountName: e.target.value.toUpperCase() }))}
                  placeholder="NGUYEN VAN A"
                  className="uppercase"
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="w-amount">Số tiền muốn rút</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">₫</span>
                  <Input
                    id="w-amount"
                    inputMode="numeric"
                    value={form.amount}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      const num = raw ? Math.min(Number(raw), availableBalance) : 0
                      setForm((f) => ({ ...f, amount: num > 0 ? num.toLocaleString('vi-VN') : '' }))
                    }}
                    placeholder="0"
                    className="pl-7 tabular-nums"
                  />
                </div>

                {/* Quick-fill */}
                <div className="flex gap-2">
                  {QUICK_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      disabled={v > availableBalance}
                      onClick={() => setForm((f) => ({ ...f, amount: v.toLocaleString('vi-VN') }))}
                      className="flex-1 rounded-md border text-xs py-1.5 font-medium hover:bg-orange-50 hover:border-orange-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {v >= 1_000_000 ? `${v / 1_000_000}tr` : `${v / 1_000}k`}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={availableBalance <= 0}
                    onClick={() => setForm((f) => ({ ...f, amount: availableBalance.toLocaleString('vi-VN') }))}
                    className="flex-1 rounded-md border text-xs py-1.5 font-medium hover:bg-orange-50 hover:border-orange-300 transition-colors disabled:opacity-30"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Tất cả
                  </button>
                </div>

                {amountError && (
                  <p className="text-xs text-red-500">{amountError}</p>
                )}
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-3 py-1">
              <div className="rounded-lg border overflow-hidden text-sm">
                {[
                  ['Ngân hàng', form.bankName],
                  ['Số tài khoản', form.bankAccountNumber],
                  ['Chủ tài khoản', form.bankAccountName],
                  ['Số tiền', formatCurrency(amountNum)],
                ].map(([label, value], i) => (
                  <div
                    key={label}
                    className={`flex justify-between px-4 py-2.5 ${i % 2 === 0 ? 'bg-muted/30' : ''}`}
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium tabular-nums">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Vui lòng kiểm tra kỹ thông tin trước khi xác nhận. Yêu cầu không thể hoàn tác sau khi gửi.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => step === 'confirm' ? setStep('form') : handleCloseDialog(false)}
            >
              {step === 'confirm' ? 'Quay lại' : 'Hủy'}
            </Button>
            <Button
              onClick={handleAction}
              disabled={(step === 'form' && !canProceed) || submitting}
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Đang gửi...
                </span>
              ) : step === 'form' ? 'Tiếp theo' : 'Xác nhận rút tiền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
