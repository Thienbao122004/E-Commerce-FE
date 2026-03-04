"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconArrowUpRight, IconRefresh } from "@tabler/icons-react"
import { useSellerWallet } from "@/hooks/use-seller-wallet"
import { WalletSummary } from "./_components/wallet-summary"
import { WithdrawalHistory } from "./_components/withdrawal-history"
import { WithdrawalDialog } from "./_components/withdrawal-dialog"

export default function SellerWalletPage() {
  const {
    wallet,
    withdrawals,
    totalWithdrawals,
    page,
    pageSize,
    loading,
    loadingWithdrawals,
    submitting,
    setPage,
    submit,
    reload,
  } = useSellerWallet()

  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 lg:gap-6 lg:p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ví & Rút tiền</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý số dư và lịch sử rút tiền
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reload} disabled={loading || loadingWithdrawals}>
            <IconRefresh className={`mr-1.5 size-4 ${loading || loadingWithdrawals ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button onClick={() => setDialogOpen(true)} disabled={loading}>
            <IconArrowUpRight className="mr-1.5 size-4" />
            Yêu cầu rút tiền
          </Button>
        </div>
      </div>

      {/* Wallet Summary Cards */}
      <WalletSummary wallet={wallet} loading={loading} />

      {/* Withdrawal History */}
      <WithdrawalHistory
        withdrawals={withdrawals}
        total={totalWithdrawals}
        page={page}
        pageSize={pageSize}
        loading={loadingWithdrawals}
        onPageChange={setPage}
      />

      {/* Withdrawal Dialog */}
      <WithdrawalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        availableBalance={wallet?.availableBalance ?? 0}
        submitting={submitting}
        onSubmit={submit}
      />
    </div>
  )
}
