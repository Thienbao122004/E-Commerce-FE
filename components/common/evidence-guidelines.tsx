"use client"

import React, { useState } from "react"
import { DisputeType } from "@/types/dispute"

interface GuidelineItem {
  icon: string
  text: string
}

const GUIDELINES: Record<number, { title: string; tips: GuidelineItem[]; note?: string }> = {
  [DisputeType.Damaged]: {
    title: "Hướng dẫn bằng chứng — Hàng hư hỏng",
    tips: [
      { icon: "photo_camera", text: "Chụp rõ phần hư hỏng trên sản phẩm (nhiều góc)" },
      { icon: "inventory_2", text: "Chụp bao bì bên ngoài kiện hàng (nếu bị móp, rách)" },
      { icon: "receipt_long", text: "Chụp phiếu giao hàng / mã vận đơn" },
      { icon: "videocam", text: "Quay video mở hộp (nếu có) — bằng chứng mạnh nhất" },
    ],
    note: "Bằng chứng video mở hộp sẽ giúp khiếu nại được xử lý nhanh hơn.",
  },
  [DisputeType.WrongItem]: {
    title: "Hướng dẫn bằng chứng — Sai hàng",
    tips: [
      { icon: "compare", text: "Chụp sản phẩm nhận được bên cạnh ảnh đơn hàng gốc để so sánh" },
      { icon: "label", text: "Chụp nhãn / tem sản phẩm, mã SKU nếu có" },
      { icon: "receipt_long", text: "Chụp ảnh màn hình đơn hàng (tên + mô tả sản phẩm đã đặt)" },
      { icon: "inventory_2", text: "Chụp bao bì giao hàng kèm phiếu giao" },
    ],
  },
  [DisputeType.QualityIssue]: {
    title: "Hướng dẫn bằng chứng — Chất lượng không đảm bảo",
    tips: [
      { icon: "photo_camera", text: "Chụp rõ vấn đề chất lượng (vết bẩn, lỗi may, biến dạng...)" },
      { icon: "videocam", text: "Quay video thể hiện sản phẩm lỗi khi sử dụng (nếu áp dụng)" },
      { icon: "compare", text: "So sánh với mô tả / hình ảnh trên trang sản phẩm" },
      { icon: "receipt_long", text: "Chụp mã đơn hàng / phiếu giao" },
    ],
  },
  [DisputeType.Return]: {
    title: "Hướng dẫn bằng chứng — Trả hàng",
    tips: [
      { icon: "photo_camera", text: "Chụp ảnh sản phẩm hiện tại (giữ nguyên trạng, chưa sử dụng nếu có thể)" },
      { icon: "inventory_2", text: "Giữ nguyên bao bì gốc và phụ kiện kèm theo" },
      { icon: "receipt_long", text: "Chụp phiếu giao hàng / hoá đơn" },
      { icon: "videocam", text: "Quay video tổng thể sản phẩm trước khi đóng gói trả" },
    ],
    note: "Sản phẩm cần giữ nguyên trạng ban đầu để được chấp nhận trả hàng.",
  },
  [DisputeType.Refund]: {
    title: "Hướng dẫn bằng chứng — Hoàn tiền",
    tips: [
      { icon: "photo_camera", text: "Chụp ảnh sản phẩm liên quan đến yêu cầu hoàn tiền" },
      { icon: "screenshot_monitor", text: "Ảnh chụp màn hình đơn hàng và chi tiết thanh toán" },
      { icon: "description", text: "Mô tả rõ lý do yêu cầu hoàn tiền" },
    ],
  },
  [DisputeType.NotReceived]: {
    title: "Hướng dẫn bằng chứng — Không nhận được hàng",
    tips: [
      { icon: "screenshot_monitor", text: "Ảnh chụp màn hình tracking cho thấy đã giao nhưng bạn không nhận được" },
      { icon: "location_on", text: "Xác nhận địa chỉ giao hàng đúng hay không" },
      { icon: "contact_phone", text: "Ghi lại thông tin liên hệ shipper (nếu có)" },
      { icon: "videocam", text: "Video vị trí nhận hàng không có kiện nào (nếu có thể)" },
    ],
    note: "Nếu shipper để hàng sai vị trí, hãy mô tả chi tiết trong phần lý do.",
  },
  [DisputeType.Other]: {
    title: "Hướng dẫn bằng chứng",
    tips: [
      { icon: "photo_camera", text: "Chụp ảnh hoặc quay video liên quan đến vấn đề" },
      { icon: "description", text: "Mô tả chi tiết vấn đề gặp phải" },
      { icon: "receipt_long", text: "Đính kèm thông tin đơn hàng, phiếu giao" },
    ],
  },
}

/** Hướng dẫn cho Seller khi từ chối / phản bác khiếu nại. */
const SELLER_GUIDELINES: { title: string; tips: GuidelineItem[]; note?: string } = {
  title: "Hướng dẫn cung cấp bằng chứng đối soát",
  tips: [
    { icon: "inventory_2", text: "Ảnh/video kiểm tra & đóng gói sản phẩm trước khi giao cho vận chuyển" },
    { icon: "local_shipping", text: "Ảnh biên nhận giao hàng cho đơn vị vận chuyển" },
    { icon: "receipt_long", text: "Hoá đơn / chứng từ mua hàng gốc (nếu có)" },
    { icon: "photo_camera", text: "Ảnh sản phẩm trước khi gửi (chứng minh tình trạng tốt)" },
    { icon: "videocam", text: "Video quy trình đóng gói (bằng chứng mạnh nhất)" },
    { icon: "chat", text: "Ảnh chụp tin nhắn trao đổi với khách (nếu liên quan)" },
  ],
  note: "Nếu không cung cấp đủ bằng chứng, Admin có thể phán quyết có lợi cho khách hàng.",
}

interface EvidenceGuidelinesProps {
  /** Loại khiếu nại — dùng cho customer */
  disputeType?: number
  /** true = hiện hướng dẫn cho seller (phản bác/từ chối) */
  forSeller?: boolean
  /** Có thể ẩn được không (mặc định: true) */
  dismissible?: boolean
}

export function EvidenceGuidelines({
  disputeType,
  forSeller = false,
  dismissible = true,
}: EvidenceGuidelinesProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const guideline = forSeller
    ? SELLER_GUIDELINES
    : (disputeType !== undefined ? GUIDELINES[disputeType] : null)

  if (!guideline) return null

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 relative">
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute top-2.5 right-2.5 size-6 flex items-center justify-center rounded-full hover:bg-blue-100 transition-colors"
          title="Ẩn hướng dẫn"
        >
          <span className="material-symbols-outlined text-sm text-blue-400">close</span>
        </button>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-lg text-blue-600">lightbulb</span>
        <h4 className="text-sm font-bold text-blue-800">{guideline.title}</h4>
      </div>

      <ul className="space-y-2">
        {guideline.tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-base text-blue-500 mt-0.5 shrink-0">
              {tip.icon}
            </span>
            <span className="text-sm text-blue-900 leading-snug">{tip.text}</span>
          </li>
        ))}
      </ul>

      {guideline.note && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <span className="material-symbols-outlined text-sm text-amber-600 mt-0.5 shrink-0">info</span>
          <p className="text-xs text-amber-800 leading-relaxed">{guideline.note}</p>
        </div>
      )}
    </div>
  )
}
