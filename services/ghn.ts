import type {
  GHNCancelOrderResponse,
  GHNCalculateFeeRequest,
  GHNCreateOrderData,
  GHNCreateOrderRequest,
  GHNCreateStoreData,
  GHNCreateStoreRequest,
  GHNDistrict,
  GHNFeeData,
  GHNGetServiceRequest,
  GHNLeadTimeData,
  GHNLeadTimeRequest,
  GHNOrderStatusResult,
  GHNProvince,
  GHNReturnOrderResponse,
  GHNService,
  GHNUpdateOrderRequest,
  GHNWard,
} from '@/types/ghn'

const GHN_TOKEN  = process.env.NEXT_PUBLIC_GHN_TOKEN  ?? ''
const GHN_SHOP_ID = process.env.NEXT_PUBLIC_GHN_SHOP_ID ?? ''

const GHN_ORIGIN = 'https://dev-online-gateway.ghn.vn'

const MASTER_BASE  = `${GHN_ORIGIN}/shiip/public-api/master-data`
const SHIP_BASE    = `${GHN_ORIGIN}/shiip/public-api/v2/shipping-order`
const SWITCH_BASE  = `${GHN_ORIGIN}/shiip/public-api/v2/switch-status`
const SHOP_BASE    = `${GHN_ORIGIN}/shiip/public-api/v2/shop`

type GHNResponse<T> = { code: number; message: string; data: T | null }

function buildHeaders(shopId?: string | number): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Token: GHN_TOKEN,
  }
  const sid = shopId ?? GHN_SHOP_ID
  if (sid) headers['ShopId'] = String(sid)
  return headers
}

async function ghnFetch<T>(
  url: string,
  method: 'GET' | 'POST',
  body?: unknown,
  shopId?: string | number,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: buildHeaders(shopId),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  const json: GHNResponse<T> = await res.json()

  if (!res.ok || json.code !== 200) {
    throw new Error(json.message ?? `GHN API error ${res.status}`)
  }

  if (json.data === null || json.data === undefined) {
    return null as unknown as T
  }

  return json.data
}

const get  = <T>(url: string, shopId?: string | number) =>
  ghnFetch<T>(url, 'GET', undefined, shopId)

const post = <T>(url: string, body: unknown, shopId?: string | number) =>
  ghnFetch<T>(url, 'POST', body, shopId)

// ============================================================
// GHN Service
// ============================================================

export const ghnService = {

  getProvinces: (): Promise<GHNProvince[]> =>
    get<GHNProvince[]>(`${MASTER_BASE}/province`),

  getDistricts: (provinceId: number): Promise<GHNDistrict[]> =>
    post<GHNDistrict[]>(`${MASTER_BASE}/district`, { province_id: provinceId }),

  getWards: (districtId: number): Promise<GHNWard[]> =>
    post<GHNWard[]>(`${MASTER_BASE}/ward`, { district_id: districtId }),

  createStore: (payload: GHNCreateStoreRequest): Promise<GHNCreateStoreData> =>
    post<GHNCreateStoreData>(`${SHOP_BASE}/register`, payload),

  getAvailableServices: (
    payload: GHNGetServiceRequest,
    shopId?: string | number,
  ): Promise<GHNService[]> =>
    post<GHNService[]>(
      `${SHIP_BASE}/available-services`,
      payload,
      shopId,
    ),

  calculateFee: (
    payload: GHNCalculateFeeRequest,
    shopId?: string | number,
  ): Promise<GHNFeeData> =>
    post<GHNFeeData>(`${SHIP_BASE}/fee`, payload, shopId),

  calculateLeadTime: (
    payload: GHNLeadTimeRequest,
    shopId?: string | number,
  ): Promise<GHNLeadTimeData> =>
    post<GHNLeadTimeData>(`${SHIP_BASE}/leadtime`, payload, shopId),

  createOrder: (
    payload: GHNCreateOrderRequest,
    shopId?: string | number,
  ): Promise<GHNCreateOrderData> =>
    post<GHNCreateOrderData>(`${SHIP_BASE}/create`, payload, shopId),

  updateOrder: (
    payload: GHNUpdateOrderRequest,
    shopId?: string | number,
  ): Promise<null> =>
    post<null>(`${SHIP_BASE}/update`, payload, shopId),

  cancelOrder: (
    orderCodes: string[],
    shopId?: string | number,
  ): Promise<GHNOrderStatusResult[]> =>
    post<GHNOrderStatusResult[]>(
      `${SWITCH_BASE}/cancel`,
      { order_codes: orderCodes },
      shopId,
    ),

  returnOrder: (
    orderCodes: string[],
    shopId?: string | number,
  ): Promise<GHNOrderStatusResult[]> =>
    post<GHNOrderStatusResult[]>(
      `${SWITCH_BASE}/return`,
      { order_codes: orderCodes },
      shopId,
    ),
}
