"use client"

import { IconHelp, IconLifebuoy, IconMail, IconMessageCircle } from "@tabler/icons-react"

const SUPPORT_ITEMS = [
  {
    title: "Trung tâm hỗ trợ",
    description: "Hướng dẫn bán hàng, đơn hàng, thanh toán và xử lý khiếu nại.",
    icon: IconHelp,
  },
  {
    title: "Chat với hỗ trợ",
    description: "Nhận hỗ trợ trực tiếp từ đội ngũ vận hành sản phẩm.",
    icon: IconMessageCircle,
  },
  {
    title: "Liên hệ qua email",
    description: "Gửi yêu cầu đến support@ecomviet.vn và nhận phản hồi sớm nhất.",
    icon: IconMail,
  },
]

export default function SellerSupportPage() {
  return (
    <div className="flex flex-1 flex-col p-6 md:p-8 gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hỗ trợ</h1>
        <p className="text-muted-foreground mt-1">Kênh hỗ trợ dành cho người bán.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {SUPPORT_ITEMS.map((item) => (
          <div key={item.title} className="rounded-xl border bg-card p-5">
            <div className="inline-flex size-10 items-center justify-center rounded-lg bg-muted mb-3">
              <item.icon className="size-5" />
            </div>
            <h2 className="font-semibold">{item.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-5 bg-card">
        <div className="flex items-center gap-2 mb-2">
          <IconLifebuoy className="size-5" />
          <h2 className="font-semibold">Cần ưu tiên xử lý?</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Vui lòng cung cấp mã đơn hàng, mã shop và mô tả ngắn gọn vấn đề để đội ngũ hỗ trợ xử lý nhanh hơn.
        </p>
      </div>
    </div>
  )
}
