"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconArrowUpRight } from "@tabler/icons-react"
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
  } = useSellerWallet()

  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-5 lg:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Ví & Rút tiền</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quản lý số dư và lịch sử rút tiền</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={loading}>
          <IconArrowUpRight className="mr-2 size-4" />
          Yêu cầu rút tiền
        </Button>
      </div>

      <WalletSummary wallet={wallet} loading={loading} />



      <WithdrawalHistory
        withdrawals={withdrawals}
        total={totalWithdrawals}
        page={page}
        pageSize={pageSize}
        loading={loadingWithdrawals}
        onPageChange={setPage}
      />

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
