import { getAccessToken } from "@/lib/auth"

function getEcommerceApiUrl(path: string): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5153").trim().replace(/\/$/, "")
  const origin = raw.replace(/\/api$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${origin}/api${p}`
}
export type VnmIdOcrData = {
  type?: string | null
  /** phân lớp chi tiết: cmnd_12_front, cccd_12_front, ... */
  typeNew?: string | null
  id?: string | null
  name?: string | null
  dob?: string | null
  sex?: string | null
  nationality?: string | null
  home?: string | null
  address?: string | null
  addressEntities?: {
    province?: string | null
    district?: string | null
    ward?: string | null
    street?: string | null
  } | null
  issueDate?: string | null
  issueLoc?: string | null
  doe?: string | null
  religion?: string | null
  ethnicity?: string | null
  features?: string | null
}

export type VnmIdOcrResponse = {
  success: boolean
  errorCode?: number
  message?: string | null
  data?: VnmIdOcrData | null
}

/**
 * Gửi ảnh CCCD/CMND lên backend — backend gọi FPT.AI (api-key không lộ ra trình duyệt).
 */
export async function recognizeVietnamIdCard(imageFile: File): Promise<VnmIdOcrResponse> {
  const token = await getAccessToken()
  if (!token) {
    throw new Error("Vui lòng đăng nhập")
  }
  const fd = new FormData()
  fd.append("image", imageFile)
  const res = await fetch(getEcommerceApiUrl("/ocr/vnm-id-card"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  })
  const json = (await res.json().catch(() => ({}))) as VnmIdOcrResponse
  if (!res.ok) {
    const msg = (json as { message?: string }).message ?? res.statusText
    throw new Error(msg || "Không đọc được thông tin")
  }
  return json
}
