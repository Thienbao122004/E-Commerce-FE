"use client"

import Link from "next/link"
import { toast } from "sonner"

const SHOP_LINKS: { label: string; href: string }[] = [
  { label: "Tất cả danh mục", href: "/categories" },
  { label: "Thời trang & Lụa", href: "/search?q=th%E1%BB%9Di+trang" },
  { label: "Trang trí nhà", href: "/search?q=trang+tr%C3%AD" },
  { label: "Cà phê đặc sản", href: "/search?q=c%C3%A0+ph%C3%AA" },
  { label: "Thực phẩm khô", href: "/search?q=th%E1%BB%B1c+ph%E1%BA%A9m" },
]

const SUPPORT_LINKS: { label: string; href: string }[] = [
  { label: "Trung tâm trợ giúp", href: "/help" },
  { label: "Chính sách giao hàng", href: "/help#giao-hang" },
  { label: "Đổi trả & hoàn tiền", href: "/help#doi-tra" },
  { label: "Trở thành người bán", href: "/user/register-seller" },
  { label: "Liên hệ chúng tôi", href: "/contact" },
]

export function StorefrontFooter() {
  return (
    <footer className="border-t border-gray-200 bg-[#faf9f8] pt-12 pb-10 mt-auto">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <span className="material-symbols-outlined text-3xl" style={{ color: "var(--color-primary)" }}>
                local_florist
              </span>
              <span className="text-2xl font-bold" style={{ color: "var(--color-text-main, #1a1a1a)" }}>
                EcomViet
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              Kết nối bạn với trái tim Việt Nam. Khám phá hàng thủ công xác thực, thời trang và đặc sản từ khắp mọi miền
              đất nước.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4" style={{ color: "var(--color-text-main, #1a1a1a)" }}>
              Mua sắm
            </h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              {SHOP_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-gray-500 hover:text-[var(--color-primary)] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4" style={{ color: "var(--color-text-main, #1a1a1a)" }}>
              Hỗ trợ khách hàng
            </h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              {SUPPORT_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-gray-500 hover:text-[var(--color-primary)] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4" style={{ color: "var(--color-text-main, #1a1a1a)" }}>
              Cập nhật mới nhất
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Đăng ký nhận thông tin về sản phẩm mới và ưu đãi độc quyền.
            </p>
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                toast.info("Cảm ơn bạn! Tính năng đăng ký nhận tin sẽ sớm được kích hoạt.")
              }}
            >
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Địa chỉ email của bạn"
                className="border border-gray-300 bg-white rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
              <button
                type="submit"
                className="text-white font-semibold py-3 px-4 rounded-lg transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Đăng ký
              </button>
            </form>
          </div>
        </div>

        <div
          className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500"
        >
          <p>© {new Date().getFullYear()} EcomViet Marketplace. Tất cả quyền được bảo lưu.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">
              Điều khoản dịch vụ
            </Link>
            <Link href="/help" className="hover:text-gray-900 transition-colors">
              Trợ giúp
            </Link>
            <Link href="/contact" className="hover:text-gray-900 transition-colors">
              Liên hệ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
