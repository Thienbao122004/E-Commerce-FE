/**
 * Chuẩn hóa số VN: luôn bắt đầu bằng 0, 10–11 chữ số.
 * Nhận: +84…, 84…, 0…, 9 chữ số (bỏ 0)
 */

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

export function normalizeVietnamPhone(phone: string | null | undefined): string {
  if (phone == null) return ''
  const raw = String(phone).trim()
  if (!raw) return ''
  const d = digitsOnly(raw)
  if (!d) return raw

  if (d.startsWith('84') && d.length >= 10) {
    const end = Math.min(12, d.length)
    const rest = d.slice(2, end)
    if (rest.length >= 9) {
      if (rest[0] === '0' && (rest.length === 10 || rest.length === 11)) {
        return rest
      }
      return '0' + rest
    }
  }
  if (d[0] === '0' && (d.length === 10 || d.length === 11)) {
    return d
  }
  if (d.length === 9 && /^[3-9]/.test(d)) {
    return '0' + d
  }
  return d[0] === '0' ? d : raw
}

/** Hiển thị: 0xxx xxx xxxx (10 số) hoặc 0xxx xxxx xxxx nếu 11 số */
export function formatPhoneVn(phone: string | null | undefined, emptyLabel = ''): string {
  const n = normalizeVietnamPhone(phone)
  if (!n) return emptyLabel
  if (n.length === 10) {
    return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`
  }
  if (n.length === 11) {
    return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`
  }
  return n
}

/** Validate sau khi đã normalize: 0 + 9–10 chữ số nữa */
export function isVietnamPhoneLocal(n: string): boolean {
  return /^0[0-9]{9,10}$/.test(n)
}
