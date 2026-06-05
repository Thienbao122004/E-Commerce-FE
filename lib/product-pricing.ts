type PricedVariant = {
  price?: number | null
}

export function resolveMinVariantPrice(basePrice: number, variants?: PricedVariant[] | null): number {
  if (!Array.isArray(variants) || variants.length === 0) return basePrice
  let minPrice = Number.isFinite(basePrice) ? basePrice : 0
  for (const v of variants) {
    const p = v?.price
    if (typeof p === "number" && Number.isFinite(p) && p > 0) {
      if (p < minPrice) minPrice = p
    }
  }
  return minPrice
}
