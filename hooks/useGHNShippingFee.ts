'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ghnService } from '@/services/ghn'
import type { AddressResponse } from '@/types/profile'

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
}

function fuzzyMatch(candidate: string, query: string): boolean {
  const c = normalize(candidate)
  const words = normalize(query).split(/\s+/).filter(Boolean)
  return words.every((w) => c.includes(w))
}

export interface ShopShippingFee {
  fee: number | undefined
  leadTime?: number
  loading: boolean
  error: string | null
}

export interface UseGHNShippingFeeResult {
  shopFees: Map<string, ShopShippingFee>
  totalShippingFee: number
  isCalculating: boolean
  fallbackFee: number
}

interface ShopInput {
  key: string
  totalWeightGrams: number
  totalValue: number
  ghnShopId?: number | null
  fromDistrictId?: number | null
  fromWardCode?: string | null
}

const FALLBACK_FEE = 30_000
const DEFAULT_WEIGHT = 1000

  export function useGHNShippingFee(
  shops: ShopInput[],
  address: AddressResponse | undefined,
): UseGHNShippingFeeResult {
  const [shopFees, setShopFees] = useState<Map<string, ShopShippingFee>>(new Map())

  const abortRef = useRef<AbortController | null>(null)

  const calculate = useCallback(async () => {
    if (!address || shops.length === 0) {
      setShopFees(new Map())
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setShopFees(
      new Map(
        shops.map((s) => [
          s.key,
          { fee: undefined, leadTime: undefined, loading: true, error: null },
        ]),
      ),
    )

    try {
      const provinces = await ghnService.getProvinces()
      if (controller.signal.aborted) return

      const provinceQuery = address.province || address.city
      const matchedProvince = provinces.find(
        (p) =>
          fuzzyMatch(p.ProvinceName, provinceQuery) ||
          (p.NameExtension ?? []).some((ext) => fuzzyMatch(ext, provinceQuery)),
      )

      if (!matchedProvince) {
        setShopFees(
          new Map(
            shops.map((s) => [
              s.key,
              {
                fee: FALLBACK_FEE,
                loading: false,
                error: `Không tìm thấy tỉnh/thành phố "${provinceQuery}" trên GHN`,
              },
            ]),
          ),
        )
        return
      }

      const districts = await ghnService.getDistricts(matchedProvince.ProvinceID)
      if (controller.signal.aborted) return

      const districtQuery = address.district || ''
      const matchedDistrict = districts.find(
        (d) =>
          fuzzyMatch(d.DistrictName, districtQuery) ||
          (d.NameExtension ?? []).some((ext) => fuzzyMatch(ext, districtQuery)),
      )

      if (!matchedDistrict) {
        setShopFees(
          new Map(
            shops.map((s) => [
              s.key,
              {
                fee: FALLBACK_FEE,
                loading: false,
                error: `Không tìm thấy quận/huyện "${districtQuery}" trên GHN`,
              },
            ]),
          ),
        )
        return
      }

      const wards = await ghnService.getWards(matchedDistrict.DistrictID)
      if (controller.signal.aborted) return

      const wardQuery = address.ward || ''
      const matchedWard = wards.find(
        (w) =>
          fuzzyMatch(w.WardName, wardQuery) ||
          (w.NameExtension ?? []).some((ext) => fuzzyMatch(ext, wardQuery)),
      )

      if (!matchedWard) {
        setShopFees(
          new Map(
            shops.map((s) => [
              s.key,
              {
                fee: FALLBACK_FEE,
                loading: false,
                error: `Không tìm thấy phường/xã "${wardQuery}" trên GHN`,
              },
            ]),
          ),
        )
        return
      }

      const results = await Promise.allSettled(
        shops.map(async (shop) => {
          const ghnShopId = shop.ghnShopId ?? undefined
          const feeData = await ghnService.calculateFee({
            from_district_id: shop.fromDistrictId ?? undefined,
            from_ward_code: shop.fromWardCode ?? undefined,
            to_district_id: matchedDistrict.DistrictID,
            to_ward_code: matchedWard.WardCode,
            weight: shop.totalWeightGrams || DEFAULT_WEIGHT,
            insurance_value: Math.min(shop.totalValue, 5_000_000),
            service_type_id: 2, // E-Commerce Standard
          }, ghnShopId)

          let leadTime: number | undefined = undefined
          try {
            const leadTimeData = await ghnService.calculateLeadTime({
              from_district_id: shop.fromDistrictId ?? undefined,
              from_ward_code: shop.fromWardCode ?? undefined,
              to_district_id: matchedDistrict.DistrictID,
              to_ward_code: matchedWard.WardCode,
              service_id: 53320,
            }, ghnShopId)
            leadTime = leadTimeData.leadtime
          } catch (e) {
            console.warn('Could not get lead time', e)
          }

          return { key: shop.key, total: feeData.total, leadTime }
        }),
      )

      if (controller.signal.aborted) return

      const updatedMap = new Map<string, ShopShippingFee>()
      results.forEach((result, idx) => {
        const key = shops[idx].key
        if (result.status === 'fulfilled') {
          updatedMap.set(key, {
            fee: result.value.total,
            leadTime: result.value.leadTime,
            loading: false,
            error: null,
          })
        } else {
          updatedMap.set(key, {
            fee: FALLBACK_FEE,
            loading: false,
            error: result.reason instanceof Error ? result.reason.message : 'Lỗi tính phí GHN',
          })
        }
      })
      setShopFees(updatedMap)
    } catch (err) {
      if (controller.signal.aborted) return
      const errMsg = err instanceof Error ? err.message : 'Lỗi kết nối GHN'
      setShopFees(
        new Map(
          shops.map((s) => [
            s.key,
            { fee: FALLBACK_FEE, loading: false, error: errMsg },
          ]),
        ),
      )
    }
  }, [address, shops])

  useEffect(() => {
    void calculate()
    return () => {
      abortRef.current?.abort()
    }
  }, [calculate])

  const totalShippingFee = Array.from(shopFees.values()).reduce(
    (sum, s) => sum + (s.loading ? 0 : (s.fee ?? FALLBACK_FEE)),
    0,
  )

  const isCalculating = Array.from(shopFees.values()).some((s) => s.loading)

  return { shopFees, totalShippingFee, isCalculating, fallbackFee: FALLBACK_FEE }
}
