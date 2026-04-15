import { ghnService } from '@/services/ghn'

export function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
}

export function fuzzyMatch(candidate: string, query: string): boolean {
  const c = normalize(candidate)
  const words = normalize(query).split(/\s+/).filter(Boolean)
  return words.every((w) => c.includes(w))
}

export async function parseAddressToGHNIds(fullAddress: string) {
  const parts = fullAddress.split(',').map((s) => s.trim())
  if (parts.length < 3) {
    throw new Error('Địa chỉ không đủ thông tin Phường/Xã, Quận/Huyện, Tỉnh/Thành')
  }

  const provinceStr = parts[parts.length - 1]
  const districtStr = parts[parts.length - 2]
  const wardStr = parts[parts.length - 3]

  const provinces = await ghnService.getProvinces()
  const matchedProvince = provinces.find(
    (p) =>
      fuzzyMatch(p.ProvinceName, provinceStr) ||
      (p.NameExtension ?? []).some((ext) => fuzzyMatch(ext, provinceStr)),
  )
  if (!matchedProvince) throw new Error(`Không tìm thấy Tỉnh/Thành phố "${provinceStr}" trên GHN.`)

  const districts = await ghnService.getDistricts(matchedProvince.ProvinceID)
  const matchedDistrict = districts.find(
    (d) =>
      fuzzyMatch(d.DistrictName, districtStr) ||
      (d.NameExtension ?? []).some((ext) => fuzzyMatch(ext, districtStr)),
  )
  if (!matchedDistrict) throw new Error(`Không tìm thấy Quận/Huyện "${districtStr}" trên GHN.`)

  const wards = await ghnService.getWards(matchedDistrict.DistrictID)
  const matchedWard = wards.find(
    (w) =>
      fuzzyMatch(w.WardName, wardStr) ||
      (w.NameExtension ?? []).some((ext) => fuzzyMatch(ext, wardStr)),
  )
  if (!matchedWard) throw new Error(`Không tìm thấy Phường/Xã "${wardStr}" trên GHN.`)

  return {
    provinceId: matchedProvince.ProvinceID,
    districtId: matchedDistrict.DistrictID,
    wardCode: matchedWard.WardCode,
  }
}
