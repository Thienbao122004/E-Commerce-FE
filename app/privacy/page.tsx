import { StorefrontSimpleLayout } from "@/components/layout/storefront-simple-layout"

export const metadata = {
  title: "Chính sách bảo mật | EcomViet",
  description: "Cách EcomViet thu thập và xử lý dữ liệu cá nhân.",
}

export default function PrivacyPage() {
  return (
    <StorefrontSimpleLayout
      title="Chính sách bảo mật"
      subtitle="Cam kết bảo vệ quyền riêng tư của người dùng."
    >
      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">1. Dữ liệu thu thập</h2>
          <p className="text-muted-foreground">
            Chúng tôi có thể thu thập thông tin bạn cung cấp khi đăng ký, đặt hàng hoặc liên hệ hỗ trợ (ví dụ: họ tên,
            email, số điện thoại, địa chỉ giao hàng) và dữ liệu kỹ thuật cần thiết để vận hành dịch vụ (ví dụ: nhật ký thiết
            bị, cookie theo cài đặt trình duyệt).
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">2. Mục đích sử dụng</h2>
          <p className="text-muted-foreground">
            Dữ liệu được dùng để xử lý đơn hàng, xác thực tài khoản, cải thiện trải nghiệm, gửi thông báo liên quan dịch vụ
            và tuân thủ nghĩa vụ pháp lý khi có yêu cầu.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">3. Chia sẻ dữ liệu</h2>
          <p className="text-muted-foreground">
            Thông tin cần thiết có thể được chia sẻ với người bán (để giao hàng), đơn vị vận chuyển/thanh toán khi bạn thực
            hiện giao dịch, hoặc cơ quan có thẩm quyền khi luật pháp yêu cầu.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4. Bảo mật</h2>
          <p className="text-muted-foreground">
            Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức hợp lý để bảo vệ dữ liệu. Bạn nên giữ bí mật mật khẩu và
            đăng xuất khi dùng thiết bị chung.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">5. Quyền của bạn</h2>
          <p className="text-muted-foreground">
            Bạn có thể yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân trong phạm vi luật áp dụng bằng cách liên hệ qua
            trang Liên hệ hoặc công cụ trong tài khoản (khi có).
          </p>
        </div>
      </section>
    </StorefrontSimpleLayout>
  )
}
