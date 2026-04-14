import { StorefrontSimpleLayout } from "@/components/layout/storefront-simple-layout"

export const metadata = {
  title: "Liên hệ | EcomViet",
  description: "Thông tin liên hệ EcomViet.",
}

export default function ContactPage() {
  return (
    <StorefrontSimpleLayout title="Liên hệ chúng tôi" subtitle="Chúng tôi phản hồi trong giờ làm việc.">
      <section className="space-y-4">
        <div className="rounded-xl border bg-white/80 dark:bg-card p-5 shadow-sm space-y-2">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Email</h2>
          <p>
            <a
              href="mailto:support@ecomviet.vn"
              className="text-[var(--color-primary)] font-medium hover:underline"
            >
              support@ecomviet.vn
            </a>
          </p>
          <p className="text-muted-foreground text-xs">Vui lòng ghi rõ mã đơn hoặc mã shop nếu liên quan.</p>
        </div>

        <div className="rounded-xl border bg-white/80 dark:bg-card p-5 shadow-sm space-y-2">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Thời gian hỗ trợ</h2>
          <p>Thứ Hai – Thứ Sáu: 8:00 – 18:00 (GMT+7)</p>
          <p className="text-muted-foreground text-xs">Ngày lễ có thể phản hồi chậm hơn.</p>
        </div>
      </section>
    </StorefrontSimpleLayout>
  )
}
