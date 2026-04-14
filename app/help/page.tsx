import Link from "next/link"
import { StorefrontSimpleLayout } from "@/components/layout/storefront-simple-layout"

export const metadata = {
  title: "Trung tâm trợ giúp | EcomViet",
  description: "Hướng dẫn mua hàng, bán hàng và sử dụng EcomViet.",
}

export default function HelpPage() {
  return (
    <StorefrontSimpleLayout
      title="Trung tâm trợ giúp"
      subtitle="Tìm câu trả lời nhanh hoặc liên hệ đội ngũ hỗ trợ."
    >
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mua hàng</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Duyệt sản phẩm, thêm vào giỏ và thanh toán theo hướng dẫn trên trang thanh toán.</li>
          <li>Theo dõi đơn hàng trong mục Đơn mua sau khi đăng nhập.</li>
          <li>Cần đổi trả hoặc khiếu nại, hãy mở chi tiết đơn và làm theo bước trên giao diện.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Người bán</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Đăng ký trở thành người bán qua mục đăng ký trong tài khoản (nếu được mở).</li>
          <li>Quản lý sản phẩm, đơn hàng và ví trong trang quản trị dành cho shop.</li>
        </ul>
      </section>

      <section id="giao-hang" className="scroll-mt-24 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chính sách giao hàng</h2>
        <p className="text-muted-foreground">
          Thời gian giao hàng phụ thuộc khu vực và đơn vị vận chuyển. Phí ship (nếu có) hiển thị trước khi bạn xác nhận
          thanh toán. Theo dõi trạng thái vận chuyển trong chi tiết đơn hàng.
        </p>
      </section>

      <section id="doi-tra" className="scroll-mt-24 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Đổi trả & hoàn tiền</h2>
        <p className="text-muted-foreground">
          Yêu cầu đổi trả/hoàn tiền thực hiện trong thời hạn và điều kiện ghi trên đơn hoặc chính sách của shop. Mở khiếu
          nại qua trang đơn hàng nếu cần hỗ trợ từ nền tảng.
        </p>
      </section>

      <section className="rounded-xl border bg-white/80 dark:bg-card p-5 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cần hỗ trợ thêm?</h2>
        <p className="text-muted-foreground">
          Gửi yêu cầu qua trang{" "}
          <Link href="/contact" className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline">
            Liên hệ
          </Link>{" "}
          hoặc xem{" "}
          <Link href="/terms" className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline">
            Điều khoản dịch vụ
          </Link>{" "}
          và{" "}
          <Link href="/privacy" className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline">
            Chính sách bảo mật
          </Link>
          .
        </p>
      </section>
    </StorefrontSimpleLayout>
  )
}
