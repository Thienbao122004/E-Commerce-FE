'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { userFacingGhnMessage } from '@/lib/ghn-user-message'
import { ghnService } from '@/services/ghn'
import type { AddressResponse } from '@/types/profile'
import type { GHNService } from '@/types/ghn'

/**
 * Fallback khi chưa có shop_id / tuyến hoặc API available-services lỗi.
 * 53320 = "Chuẩn" (service_type_id 2) theo tài liệu GHN.
 */
const GHN_DEFAULT_SERVICE_ID = 53_320
const GHN_DEFAULT_SERVICE_TYPE_ID = 2

/** Chọn dịch vụ từ `available-services` (ưu tiên Chuẩn, rồi Nhanh, rồi Tiết kiệm). */
function pickPreferredGhnService(services: GHNService[]): GHNService | null {
  if (!services?.length) return null
  const byType = (t: number) => services.find((s) => s.service_type_id === t)
  return (
    byType(2) ?? // Chuẩn
    byType(1) ?? // Nhanh
    byType(3) ?? // Tiết kiệm
    services.find((s) => s.service_type_id > 0) ??
    services[0] ??
    null
  )
}

/**
 * Tự động chọn tuyến từ `available-services` (Chuẩn → Nhanh → …). Không ép `service_type_id` 0 → 2.
 */
function pickGhnServiceFromList(list: GHNService[]): {
  service: GHNService
  service_id: number
  service_type_id: number
} {
  const preferred = pickPreferredGhnService(list)
  if (preferred) {
    return {
      service: preferred,
      service_id: preferred.service_id,
      service_type_id: preferred.service_type_id,
    }
  }
  return {
    service: {
      service_id: GHN_DEFAULT_SERVICE_ID,
      short_name: 'Chuẩn',
      service_type_id: GHN_DEFAULT_SERVICE_TYPE_ID,
    },
    service_id: GHN_DEFAULT_SERVICE_ID,
    service_type_id: GHN_DEFAULT_SERVICE_TYPE_ID,
  }
}

/** GHN: `service_type_id` = 0 thường là tuyến đặc biệt — gửi kèm 0 dễ bị 400; chỉ gửi nếu 1/2/3. */
function serviceTypeIdForGhnFeeBody(serviceTypeId: number): number | undefined {
  if (serviceTypeId >= 1 && serviceTypeId <= 3) {
    return serviceTypeId
  }
  return undefined
}

function notifyShippingToasts(
  userMessages: string[],
  rawTechForDev: (string | undefined)[],
) {
  const list = userMessages
    .map((m) => m.trim())
    .filter(Boolean)
  const unique = [...new Set(list)]
  if (unique.length === 0) return

  if (process.env.NODE_ENV === 'development' && rawTechForDev.some(Boolean)) {
    // eslint-disable-next-line no-console
    console.warn('[GHN shipping]', rawTechForDev.filter(Boolean))
  }

  if (unique.length === 1) {
    toast.error(unique[0])
  } else {
    toast.error(
      unique[0] + ` (và ${unique.length - 1} tuyến/shop chưa tính được phí)`,
    )
  }
}

function formatToastFromAddress(technical: string): string {
  if (technical.startsWith('Không tìm thấy')) {
    return technical
  }
  return userFacingGhnMessage(technical)
}

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
  ghnServiceId?: string
  loading: boolean
  error: string | null
}

export interface UseGHNShippingFeeResult {
  shopFees: Map<string, ShopShippingFee>
  totalShippingFee: number
  isCalculating: boolean
  hasBlockingError: boolean
}

interface ShopInput {
  key: string
  totalWeightGrams: number
  totalValue: number
  ghnShopId?: number | null
  fromDistrictId?: number | null
  fromWardCode?: string | null
}

/** Gram; GHN dễ báo 400 nếu cân quá nhỏ (ước lượng giỏ thấp) — tối thiểu 1kg. */
const DEFAULT_WEIGHT = 1000

function buildAddressError(what: string, value: string) {
  return `Không tìm thấy "${value}" trên GHN (${what}). Sửa tỉnh / quận / xã trùng cách gọi mà GHN dùng.`
}

export function useGHNShippingFee(shops: ShopInput[], address: AddressResponse | undefined): UseGHNShippingFeeResult {
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
          { fee: undefined, leadTime: undefined, ghnServiceId: undefined, loading: true, error: null },
        ]),
      ),
    )

    const applyAddressFailure = (errorMsg: string) => {
      notifyShippingToasts([formatToastFromAddress(errorMsg)], [errorMsg])
      setShopFees(
        new Map(shops.map((s) => [s.key, { fee: undefined, loading: false, error: errorMsg }])),
      )
    }

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
        const msg = buildAddressError('tỉnh/thành', provinceQuery || '')
        applyAddressFailure(msg)
        return
      }

      const districts = await ghnService.getDistricts(matchedProvince.ProvinceID)
      if (controller.signal.aborted) return

      const districtQuery = address.district || ''
      const matchedDistrict = districts.find(
        (d) =>
          fuzzyMatch(d.DistrictName, districtQuery) || (d.NameExtension ?? []).some((ext) => fuzzyMatch(ext, districtQuery)),
      )

      if (!matchedDistrict) {
        const msg = buildAddressError('quận/huyện', districtQuery || '—')
        applyAddressFailure(msg)
        return
      }

      const wards = await ghnService.getWards(matchedDistrict.DistrictID)
      if (controller.signal.aborted) return

      const wardQuery = address.ward || ''
      const matchedWard = wards.find(
        (w) =>
          fuzzyMatch(w.WardName, wardQuery) || (w.NameExtension ?? []).some((ext) => fuzzyMatch(ext, wardQuery)),
      )

      if (!matchedWard) {
        const msg = buildAddressError('phường/xã', wardQuery || '—')
        applyAddressFailure(msg)
        return
      }

      const results = await Promise.allSettled(
        shops.map(async (shop) => {
          const ghnShopId = shop.ghnShopId ?? undefined
          let list: GHNService[] = []
          if (ghnShopId != null && shop.fromDistrictId != null) {
            try {
              const raw = await ghnService.getAvailableServices(
                {
                  shop_id: ghnShopId,
                  from_district: shop.fromDistrictId,
                  to_district: matchedDistrict.DistrictID,
                },
                ghnShopId,
              )
              list = raw
            } catch (e) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('[GHN getAvailableServices]', e)
              }
            }
          }

          const { service_id, service_type_id } =
            list.length > 0
              ? (() => {
                  const picked = pickGhnServiceFromList(list)
                  return { service_id: picked.service_id, service_type_id: picked.service_type_id }
                })()
              : { service_id: GHN_DEFAULT_SERVICE_ID, service_type_id: GHN_DEFAULT_SERVICE_TYPE_ID }

          const weightGrams = Math.max(shop.totalWeightGrams || 0, DEFAULT_WEIGHT)
          const feeTypeForBody = serviceTypeIdForGhnFeeBody(service_type_id)
          const feeData = await ghnService.calculateFee(
            {
              service_id,
              from_district_id: shop.fromDistrictId ?? undefined,
              from_ward_code: shop.fromWardCode ?? undefined,
              to_district_id: matchedDistrict.DistrictID,
              to_ward_code: matchedWard.WardCode,
              weight: weightGrams,
              insurance_value: Math.min(shop.totalValue, 5_000_000),
              ...(feeTypeForBody != null ? { service_type_id: feeTypeForBody } : {}),
            },
            ghnShopId,
          )

          let leadTime: number | undefined
          try {
            const leadTimeData = await ghnService.calculateLeadTime(
              {
                from_district_id: shop.fromDistrictId ?? undefined,
                from_ward_code: shop.fromWardCode ?? undefined,
                to_district_id: matchedDistrict.DistrictID,
                to_ward_code: matchedWard.WardCode,
                service_id,
              },
              ghnShopId,
            )
            leadTime = leadTimeData.leadtime
          } catch (e) {
            console.warn('Could not get lead time', e)
          }

          return {
            key: shop.key,
            total: feeData.total,
            leadTime,
            ghnServiceId: String(service_id),
          }
        }),
      )

      if (controller.signal.aborted) return

      const updatedMap = new Map<string, ShopShippingFee>()
      const errMsgs: string[] = []
      const rawForDev: string[] = []

      results.forEach((result, idx) => {
        const key = shops[idx].key
        if (result.status === 'fulfilled') {
          const v = result.value
          updatedMap.set(key, {
            fee: v.total,
            leadTime: v.leadTime,
            ghnServiceId: v.ghnServiceId,
            loading: false,
            error: null,
          })
        } else {
          const raw =
            result.reason instanceof Error
              ? result.reason.message
              : 'GHN không tính được phí (kiểm tra cấu hình kho, địa chỉ gửi, hoặc tuyến giao hàng).'
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn('[GHN calculateFee]', raw)
          }
          const friendly = userFacingGhnMessage(raw)
          errMsgs.push(friendly)
          rawForDev.push(raw)
          updatedMap.set(key, { fee: undefined, loading: false, error: friendly })
        }
      })

      setShopFees(updatedMap)
      if (errMsgs.length > 0) {
        notifyShippingToasts(errMsgs, rawForDev)
      }
    } catch (err) {
      if (controller.signal.aborted) return
      const errMsg = err instanceof Error ? err.message : 'Lỗi kết nối GHN'
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[GHN shipping fee]', errMsg)
      }
      const friendly = userFacingGhnMessage(errMsg)
      setShopFees(new Map(shops.map((s) => [s.key, { fee: undefined, loading: false, error: friendly }]))),
      notifyShippingToasts([friendly], [errMsg])
    }
  }, [address, shops])

  useEffect(() => {
    void calculate()
    return () => {
      abortRef.current?.abort()
    }
  }, [calculate])

  const values = Array.from(shopFees.values())
  const totalShippingFee = values.reduce((sum, s) => {
    if (s.loading || s.fee == null || s.error) return sum
    return sum + s.fee
  }, 0)
  const isCalculating = values.some((s) => s.loading)
  const hasBlockingError = values.some((s) => !s.loading && s.error != null)

  return {
    shopFees,
    totalShippingFee,
    isCalculating,
    hasBlockingError,
  }
}
