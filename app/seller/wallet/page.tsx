"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconArrowUpRight, IconRefresh } from "@tabler/icons-react"
import { useSellerWallet } from "@/hooks/use-seller-wallet"
import { useSellerPlatformFee } from "@/hooks/use-seller-platform-fee"
import { WalletSummary } from "./_components/wallet-summary"
import { WithdrawalHistory } from "./_components/withdrawal-history"
import { WithdrawalDialog } from "./_components/withdrawal-dialog"
import { SetHeaderActions } from "@/hooks/use-header-actions"

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

  const { commissionPercent: platformFeePercent, loading: platformFeeLoading } = useSellerPlatformFee()

  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <SetHeaderActions>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading || loadingWithdrawals}>
          <IconRefresh className={`mr-1.5 size-4 ${loading || loadingWithdrawals ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
        <Button
          onClick={() => setDialogOpen(true)}
          disabled={loading || !wallet || wallet.availableBalance <= 0}
        >
          <IconArrowUpRight className="mr-1.5 size-4" />
          Yêu cầu rút tiền
        </Button>
      </SetHeaderActions>

      <WalletSummary
        wallet={wallet}
        loading={loading}
        platformFeePercent={platformFeePercent}
        platformFeeLoading={platformFeeLoading}
      />

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
