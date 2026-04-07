import { ghnService } from '@/services/ghn'

export interface Province {
  code: number     // = GHN ProvinceID
  name: string     // = GHN ProvinceName
}

export interface District {
  code: number     // = GHN DistrictID
  name: string     // = GHN DistrictName
}

export interface Ward {
  code: string     // = GHN WardCode (string, ví dụ "20308")
  name: string     // = GHN WardName
}

// ─── Service ─────────────────────────────────────────────────
export const vietnamProvincesService = {
  /** Lấy danh sách Tỉnh / Thành phố từ GHN */
  getProvinces: async (): Promise<Province[]> => {
    const data = await ghnService.getProvinces()
    return data.map((p) => ({
      code: p.ProvinceID,
      name: p.ProvinceName,
    }))
  },

  /** Lấy danh sách Quận / Huyện theo ProvinceID (= Province.code) */
  getDistricts: async (provinceCode: number): Promise<District[]> => {
    const data = await ghnService.getDistricts(provinceCode)
    return data.map((d) => ({
      code: d.DistrictID,
      name: d.DistrictName,
    }))
  },

  /** Lấy danh sách Phường / Xã theo DistrictID (= District.code) */
  getWards: async (districtCode: number): Promise<Ward[]> => {
    const data = await ghnService.getWards(districtCode)
    return data.map((w) => ({
      code: w.WardCode,   // GHN WardCode là string
      name: w.WardName,
    }))
  },
}
