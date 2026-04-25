"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { createDispute } from "@/services/disputes"
import { ordersService } from "@/services/orders"
import { DisputeType } from "@/types/dispute"
import { EvidenceUploader } from "@/components/common/evidence-uploader"

const TYPE_OPTIONS = [
  { value: String(DisputeType.Refund), label: "Hoàn tiền" },
  { value: String(DisputeType.Return), label: "Trả hàng" },
  { value: String(DisputeType.Damaged), label: "Hàng hư hỏng" },
  { value: String(DisputeType.NotReceived), label: "Không nhận được" },
  { value: String(DisputeType.WrongItem), label: "Sai hàng" },
  { value: String(DisputeType.QualityIssue), label: "Chất lượng không đảm bảo" },
  { value: String(DisputeType.Other), label: "Khác" },
]

export default function NewDisputePage() {
  const { session, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    orderId: "",
    type: String(DisputeType.Refund),
    title: "",
    reason: "",
    requestedAmount: "",
  })
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])

  useEffect(() => {
    if (authLoading) return
    if (!session) router.push("/login?redirect=/user/disputes/new")
  }, [authLoading, session, router])

  const handleCreate = async () => {
    let actualOrderId = form.orderId.trim();
    if (!actualOrderId) { toast.error("Vui lòng nhập mã đơn hàng"); return }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(actualOrderId)) {
      setCreating(true);
      try {
        const res = await ordersService.getMyOrders(1, 100);
        const matchedItem = res.orders.find(o => o.orderCode?.trim().toUpperCase() === actualOrderId.toUpperCase());
        if (matchedItem) {
          actualOrderId = matchedItem.id;
        } else {
          toast.error("Không tìm thấy đơn hàng bạn nhập trong danh sách gần đây. Hãy vào Đơn mua -> Chi tiết đơn -> bấm Khiếu nại để thử lại.");
          setCreating(false);
          return;
        }
      } catch {
        toast.error("Lỗi khi kiểm tra mã đơn hàng.");
        setCreating(false);
        return;
      }
    }

    if (!form.title.trim()) { toast.error("Vui lòng nhập tiêu đề"); setCreating(false); return }
    if (form.reason.trim().length < 20) { toast.error("Lý do phải có ít nhất 20 ký tự"); setCreating(false); return }
    if (Number(form.type) === DisputeType.Refund && (!form.requestedAmount || Number(form.requestedAmount) <= 0)) {
      toast.error("Với loại hoàn tiền, vui lòng nhập số tiền lớn hơn 0")
      setCreating(false)
      return
    }

    setCreating(true)
    try {
      const detail = await ordersService.getOrderById(actualOrderId)
      if (!detail.success || !detail.order) {
        toast.error(detail.message ?? "Không tải được chi tiết đơn hàng")
        setCreating(false)
        return
      }
      const o = detail.order
      if (o.items.length === 0) {
        toast.error("Đơn không có sản phẩm")
        setCreating(false)
        return
      }
      let disputeItems: { orderItemId: string; quantity: number }[]
      if (o.items.length === 1) {
        disputeItems = [{ orderItemId: o.items[0].id, quantity: o.items[0].quantity }]
      } else {
        toast.error(
          "Đơn có nhiều sản phẩm — vui lòng vào Đơn mua → Chi tiết đơn → Khiếu nại để chọn đúng món bị lỗi.",
        )
        setCreating(false)
        return
      }

      const res = await createDispute({
        orderId: actualOrderId,
        type: Number(form.type),
        title: form.title.trim(),
        reason: form.reason.trim(),
        requestedAmount: form.requestedAmount ? Number(form.requestedAmount) : 0,
        evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
        items: disputeItems,
      })
      if (res.success) {
        toast.success("Đã tạo khiếu nại thành công")
        router.push("/user/disputes") // redirect immediately
      } else {
        toast.error(res.message ?? "Lỗi tạo khiếu nại")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tạo khiếu nại")
    } finally {
      setCreating(false)
    }
  }

  if (authLoading || !session) return null

  return (
    <div className="w-full max-w-[700px] mx-auto py-4">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[var(--color-primary)] transition-colors"
        >
          <span className="material-symbols-outlined text-base">home</span>
          Trang chủ
        </Link>
        <span className="text-gray-300">/</span>
        <Link href="/user/disputes" className="text-sm text-gray-500 hover:text-[var(--color-primary)] transition-colors">
          Khiếu nại của tôi
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">
          Tạo khiếu nại mới
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-main)" }}>Tạo khiếu nại mới</h1>
          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="text-sm font-semibold text-amber-800 mb-1">Điều kiện để khiếu nại:</p>
            <ul className="list-disc list-inside text-xs space-y-0.5 text-amber-700">
              <li>Đơn hàng phải ở trạng thái <strong>Đã giao</strong> hoặc <strong>Hoàn thành</strong></li>
              <li>Trong vòng <strong>7 ngày</strong> kể từ khi đơn được giao/hoàn thành</li>
              <li>Mỗi đơn hàng chỉ được khiếu nại <strong>một lần</strong></li>
            </ul>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="orderId">Mã đơn hàng (ID) <span className="text-red-500">*</span></Label>
            <Input
              id="orderId"
              placeholder="Ví dụ: 3767D68F260418"
              value={form.orderId}
              onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
              className="font-mono text-sm max-w-md"
              disabled={creating}
            />
            <p className="text-xs text-gray-400">
              Vào{" "}
              <Link href="/user/purchase" className="text-[var(--color-primary)] underline" target="_blank">
                Đơn mua của tôi
              </Link>
              {" "}→ mở chi tiết đơn → nhấn nút "Khiếu nại" để tự điền mã.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Loại khiếu nại <span className="text-red-500">*</span></Label>
            <Select disabled={creating} value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger id="type" className="max-w-md"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Tiêu đề <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              placeholder="Ví dụ: Sản phẩm bị hỏng khi nhận hàng"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={255}
              disabled={creating}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Lý do chi tiết <span className="text-red-500">*</span></Label>
            <Textarea
              id="reason"
              placeholder="Mô tả rõ ràng vấn đề bạn gặp phải, tình trạng sản phẩm, thời điểm phát hiện... (tối thiểu 20 ký tự)"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className="min-h-[120px]"
              maxLength={2000}
              disabled={creating}
            />
            <p className={`text-xs ${form.reason.length < 20 && form.reason.length > 0 ? "text-red-400" : "text-gray-400"}`}>
              {form.reason.length}/2000 ký tự {form.reason.length > 0 && form.reason.length < 20 && `(còn thiếu ${20 - form.reason.length})`}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>
              Bằng chứng
              <span className="ml-1.5 text-xs text-gray-400 font-normal">ảnh / video từ thiết bị, tối đa 10</span>
            </Label>
            <EvidenceUploader
              urls={evidenceUrls}
              onChange={setEvidenceUrls}
              disabled={creating}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Số tiền yêu cầu hoàn (₫)</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              placeholder="0"
              value={form.requestedAmount}
              onChange={(e) => setForm((f) => ({ ...f, requestedAmount: e.target.value }))}
              className="max-w-[200px]"
              disabled={creating}
            />
            <p className="text-xs text-gray-400">Để trống hoặc nhập 0 nếu chỉ yêu cầu đổi/trả hàng</p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <Button variant="outline" onClick={() => router.push("/user/disputes")} disabled={creating}>Hủy</Button>
          <Button onClick={handleCreate} disabled={creating}
            style={{ backgroundColor: "var(--color-primary)", color: "white" }}>
            {creating ? "Đang xử lý..." : "Gửi khiếu nại"}
          </Button>
        </div>
      </div>
    </div>
  )
}
