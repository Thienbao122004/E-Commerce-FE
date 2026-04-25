// ============================================================
// GHN (Giao Hàng Nhanh) – Full TypeScript Definitions
// ============================================================

// ─── Base Response ──────────────────────────────────────────
export interface GHNBaseResponse<T> {
  code: number
  message: string
  data: T | null
  code_message?: string
  code_message_value?: string
}

// ─── Master Data ────────────────────────────────────────────

export interface GHNProvince {
  ProvinceID: number
  ProvinceName: string
  Code: string
  NameExtension?: string[]
  CanUpdateCOD?: boolean
  /** 1: Unlock | 2: Lock */
  Status?: number
  CreatedAt?: string
  UpdatedAt?: string
}

export interface GHNDistrict {
  DistrictID: number
  ProvinceID: number
  DistrictName: string
  Code: string
  Type?: number
  /** 0: Lock | 1: Take/Pay | 2: Deliver | 3: Take/Deliver/Pay */
  SupportType?: number
  NameExtension?: string[]
  CanUpdateCOD?: boolean
  /** 1: Unlock | 2: Lock */
  Status?: number
  CreatedDate?: string
  UpdatedDate?: string
}

export interface GHNWard {
  WardCode: string
  DistrictID: number
  WardName: string
  NameExtension?: string[]
  CanUpdateCOD?: boolean
  /** 0: Lock | 1: Take/Pay | 2: Deliver | 3: Take/Deliver/Pay */
  SupportType?: number
  /** 1: Unlock | 2: Lock */
  Status?: number
  CreatedDate?: string
  UpdatedDate?: string
}

// ─── Store ──────────────────────────────────────────────────

export interface GHNCreateStoreRequest {
  district_id: number
  ward_code: string
  name: string
  phone: string
  address: string
}

export interface GHNCreateStoreData {
  shop_id: number
}

// ─── Service ────────────────────────────────────────────────

export interface GHNGetServiceRequest {
  shop_id: number
  from_district: number
  to_district: number
}

export interface GHNService {
  service_id: number
  short_name: string
  /** 0: Other | 1: Express | 2: Standard | 3: Economy */
  service_type_id: number
}

// ─── Calculate Fee ──────────────────────────────────────────

export interface GHNFeeItem {
  name: string
  quantity: number
  height?: number
  weight?: number
  length?: number
  width?: number
}

export interface GHNCalculateFeeRequest {
  /** Bắt buộc với API v2 (vd. 53320 — dịch vụ chuẩn, trùng lead time & checkout) */
  service_id?: number
  service_type_id?: number
  insurance_value?: number
  coupon?: string | null
  cod_failed_amount?: number
  from_district_id?: number
  from_ward_code?: string
  to_district_id: number
  to_ward_code: string
  weight?: number
  length?: number
  width?: number
  height?: number
  cod_value?: number
  items?: GHNFeeItem[]
}

export interface GHNFeeData {
  total: number
  service_fee: number
  insurance_fee: number
  pick_station_fee: number
  coupon_value: number
  r2s_fee: number
  document_return: number
  double_check: number
  cod_fee: number
  pick_remote_areas_fee: number
  deliver_remote_areas_fee: number
  cod_failed_fee: number
}

// ─── Lead Time ──────────────────────────────────────────────

export interface GHNLeadTimeRequest {
  from_district_id?: number
  from_ward_code?: string
  to_district_id: number
  to_ward_code: string
  service_id: number
}

export interface GHNLeadTimeData {
  /** Unix timestamp */
  leadtime: number
  /** Unix timestamp */
  order_date: number
}

// ─── Create Order ───────────────────────────────────────────

export type GHNRequiredNote =
  | 'CHOTHUHANG'
  | 'CHOXEMHANGKHONGTHU'
  | 'KHONGCHOXEMHANG'

export interface GHNOrderItem {
  name: string
  code?: string
  quantity: number
  price?: number
  length?: number
  width?: number
  height?: number
  weight?: number
  category?: {
    level1?: string
    level2?: string
    level3?: string
  }
}

export interface GHNCreateOrderRequest {
  /** 1: Shop/Seller | 2: Buyer/Consignee */
  payment_type_id: number
  /** CHOTHUHANG | CHOXEMHANGKHONGTHU | KHONGCHOXEMHANG */
  required_note: GHNRequiredNote
  note?: string
  from_name?: string
  from_phone?: string
  from_address?: string
  from_ward_name?: string
  from_district_name?: string
  from_province_name?: string
  to_name: string
  to_phone: string
  to_address: string
  to_ward_code: string
  to_district_id: number
  return_phone?: string
  return_address?: string
  return_district_id?: number | null
  return_ward_code?: string
  client_order_code?: string
  /** Max 50,000,000 */
  cod_amount?: number
  content?: string
  /** gram, max 50,000 */
  weight: number
  /** cm, max 200 */
  length: number
  /** cm, max 200 */
  width: number
  /** cm, max 200 */
  height: number
  pick_station_id?: number | null
  deliver_station_id?: number | null
  /** Max 5,000,000 */
  insurance_value?: number
  service_id?: number
  service_type_id: number
  coupon?: string | null
  pick_shift?: number[]
  items: GHNOrderItem[]
}

export interface GHNCreateOrderFee {
  coupon: number
  insurance: number
  main_service: number
  r2s: number
  return: number
  station_do: number
  station_pu: number
}

export interface GHNCreateOrderData {
  order_code: string
  sort_code: string
  trans_type: string
  ward_encode: string
  district_encode: string
  expected_delivery_time: string
  total_fee: string
  fee: GHNCreateOrderFee
}

// ─── Update Order ───────────────────────────────────────────

export interface GHNUpdateOrderRequest {
  order_code: string
  note?: string
  from_name?: string
  from_phone?: string
  from_address?: string
  from_ward_code?: string
  to_name?: string
  to_phone?: string
  to_address?: string
  to_ward_code?: string
  to_district_id?: number
  return_phone?: string
  return_address?: string
  return_district_id?: number
  return_ward_code?: string
  client_order_code?: string
  cod_amount?: number
  content?: string
  weight?: number
  length?: number
  width?: number
  height?: number
  pick_station_id?: number
  insurance_value?: number
  coupon?: string | null
  payment_type_id?: number
  required_note?: GHNRequiredNote
  pick_shift?: number[]
  items?: GHNOrderItem[]
}

// ─── Cancel / Return Order ──────────────────────────────────

export interface GHNOrderCodesRequest {
  order_codes: string[]
}

export interface GHNOrderStatusResult {
  order_code: string
  result: boolean
  message: string
}

// ─── Response type aliases ───────────────────────────────────
export type GHNProvinceResponse     = GHNBaseResponse<GHNProvince[]>
export type GHNDistrictResponse     = GHNBaseResponse<GHNDistrict[]>
export type GHNWardResponse         = GHNBaseResponse<GHNWard[]>
export type GHNCreateStoreResponse  = GHNBaseResponse<GHNCreateStoreData>
export type GHNServiceResponse      = GHNBaseResponse<GHNService[]>
export type GHNFeeResponse          = GHNBaseResponse<GHNFeeData>
export type GHNLeadTimeResponse     = GHNBaseResponse<GHNLeadTimeData>
export type GHNCreateOrderResponse  = GHNBaseResponse<GHNCreateOrderData>
export type GHNUpdateOrderResponse  = GHNBaseResponse<null>
export type GHNCancelOrderResponse  = GHNBaseResponse<GHNOrderStatusResult[]>
export type GHNReturnOrderResponse  = GHNBaseResponse<GHNOrderStatusResult[]>
