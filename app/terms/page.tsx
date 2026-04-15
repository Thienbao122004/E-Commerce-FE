import { StorefrontSimpleLayout } from "@/components/layout/storefront-simple-layout"

export const metadata = {
  title: "Điều khoản dịch vụ | EcomViet",
  description: "Điều khoản sử dụng nền tảng EcomViet.",
}

export default function TermsPage() {
  return (
    <StorefrontSimpleLayout
      title="Điều khoản dịch vụ"
      subtitle="Vui lòng đọc kỹ trước khi sử dụng dịch vụ. Nội dung có thể được cập nhật theo thời gian."
    >
      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">1. Chấp nhận điều khoản</h2>
          <p className="text-muted-foreground">
            Bằng việc truy cập hoặc sử dụng website và dịch vụ EcomViet, bạn đồng ý bị ràng buộc bởi các điều khoản này.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">2. Tài khoản</h2>
          <p className="text-muted-foreground">
            Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động diễn ra dưới tài khoản của mình. Thông tin
            đăng ký cần chính xác và được cập nhật khi thay đổi.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">3. Hành vi cấm</h2>
          <p className="text-muted-foreground">
            Nghiêm cấm lạm dụng nền tảng, gian lận, xâm phạm quyền của người khác, hoặc phát tán nội dung trái pháp luật.
            Vi phạm có thể dẫn đến khóa tài khoản hoặc chấm dứt quyền sử dụng.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4. Đơn hàng và thanh toán</h2>
          <p className="text-muted-foreground">
            Giá và khả dụng sản phẩm do người bán niêm yết. Điều kiện giao hàng, đổi trả và hoàn tiền được thực hiện theo
            chính sách hiển thị tại thời điểm đặt hàng và quy định pháp luật áp dụng.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">5. Giới hạn trách nhiệm</h2>
          <p className="text-muted-foreground">
            EcomViet vận hành nền tảng kết nối người mua và người bán. Tranh chấp giữa các bên sẽ được hỗ trợ theo quy trình
            khiếu nại và chính sách hiện hành của nền tảng.
          </p>
        </div>
      </section>
    </StorefrontSimpleLayout>
  )
}
