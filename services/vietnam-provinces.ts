import { ghnService } from '@/services/ghn'

import type { Province, District, Ward } from '@/types/vietnam-provinces'

export const vietnamProvincesService = {
  getProvinces: async (): Promise<Province[]> => {
    const data = await ghnService.getProvinces()
    return data.map((p) => ({
      code: p.ProvinceID,
      name: p.ProvinceName,
    }))
  },

  getDistricts: async (provinceCode: number): Promise<District[]> => {
    const data = await ghnService.getDistricts(provinceCode)
    return data.map((d) => ({
      code: d.DistrictID,
      name: d.DistrictName,
    }))
  },

  getWards: async (districtCode: number): Promise<Ward[]> => {
    const data = await ghnService.getWards(districtCode)
    return data.map((w) => ({
      code: w.WardCode,
      name: w.WardName,
    }))
  },
}
