/**
 * Đường dẫn storefront `/shop/{slug}` — chỉ dùng slug thật (từ API) hoặc slug suy từ tên,
 * không dùng Guid trong URL.
 */
function slugifyShopName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function getShopStorefrontPath(shopSlug: string | undefined | null, shopName: string): string | null {
  const fromApi = shopSlug?.trim()
  if (fromApi) {
    return `/shop/${encodeURIComponent(fromApi)}`
  }
  const fromName = slugifyShopName(shopName)
  if (fromName) {
    return `/shop/${encodeURIComponent(fromName)}`
  }
  return null
}
