/**
 * Trùng logic BE: phí tính trên tiền hàng (subtotal), làm tròn 2 chữ số.
 */
export function estimatedNetAfterPlatformFeeVnd(
  grossSubtotalVnd: number,
  commissionPercent: number
): number {
  if (!Number.isFinite(grossSubtotalVnd) || grossSubtotalVnd <= 0) return 0
  if (!Number.isFinite(commissionPercent) || commissionPercent < 0) return grossSubtotalVnd
  const pct = Math.min(100, Math.max(0, commissionPercent))
  const net = (grossSubtotalVnd * (100 - pct)) / 100
  return Math.round(net * 100) / 100
}

export function platformFeeVndFromGross(grossSubtotalVnd: number, commissionPercent: number): number {
  if (!Number.isFinite(grossSubtotalVnd) || grossSubtotalVnd <= 0) return 0
  if (!Number.isFinite(commissionPercent) || commissionPercent <= 0) return 0
  const pct = Math.min(100, commissionPercent)
  const fee = (grossSubtotalVnd * pct) / 100
  return Math.round(fee * 100) / 100
}
