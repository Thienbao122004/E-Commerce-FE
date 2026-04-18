"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ShoppingBag,
  X,
  Send,
  MapPin,
  Check,
  CircleCheck,
  ChevronDown,
  ChevronLeft,
  Plus,
  MessageSquare,
  Loader2,
  Search,
  MoreVertical,
  BellOff,
  Trash2,
  CheckCheck,
  Filter,
  List,
  Mail,
} from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { aiChatService, type AiChatSendResponse, type AiSessionSummary } from "@/services/ai-chat"
import { cartService } from "@/services/cart"
import { profileService } from "@/services/profile"
import { paymentsService } from "@/services/payments"
import { ordersService } from "@/services/orders"
import type { AddressResponse, AddAddressRequest } from "@/types/profile"
import {
  vietnamProvincesService,
} from "@/services/vietnam-provinces"
import type { Province, District, Ward } from "@/types/vietnam-provinces"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getProductById,
  type StorefrontProductDetail,
} from "@/services/storefront-products"
import {
  formatConversationTimeVN as formatSessionTime,
  formatPriceVND as formatPrice,
  formatTimeVN as formatTime,
} from "@/lib/formatters"
import {
  readAiChatUiCache,
  writeAiChatUiCache,
  removeAiChatUiCache,
} from "@/lib/ai-chat-ui-cache"
import { dedupeMergedChatMessages } from "@/lib/ai-chat-merge-messages"
import { mapHistoryMessageToUi } from "@/lib/ai-chat-map-history"

type PaymentMethod = "vnpay" | "momo"

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string; logo: string }> = [
  { id: "vnpay", label: "VNPay", logo: "/vnpay-logo.png" },
  { id: "momo", label: "MoMo", logo: "/momo-logo.png" },
]

const CART_UPDATED_EVENT = "cart:updated"

type UiMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt?: string
  responseMeta?: AiChatSendResponse
}

type ConfirmPreview = {
  id: string
  name: string
  imageUrl?: string
  basePrice: number
  quantity: number
}

type ProductSelection = {
  checked: boolean
  quantity: number
}

type ConfirmTargetState = {
  cartId?: string
  messageId: string
  preview?: ConfirmPreview
  previews?: ConfirmPreview[]
}

type SessionFilter = "all" | "unread" | "muted"

function truncateText(text: string, maxLength: number) {
  if (!text) return ""
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text
}

function getSessionFilterLabel(filter: SessionFilter) {
  if (filter === "unread") return "Chưa đọc"
  if (filter === "muted") return "Đã tắt thông báo"
  return "Tất cả"
}

function isOrderRequestText(text: string) {
  return /tạo đơn|đặt đơn|checkout|thanh toán|mua luôn|chốt đơn/i.test(text)
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full animate-bounce"
          style={{
            backgroundColor: "#c4b8aa",
            animationDelay: `${i * 0.15}s`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  )
}
function AddressFormModal({
  onSuccess,
  onClose,
}: {
  onSuccess: (address: AddressResponse) => void
  onClose: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | "">("")
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | "">("")
  const [selectedWardCode, setSelectedWardCode] = useState<string>("")

  const [form, setForm] = useState<AddAddressRequest>({
    fullName: "",
    phone: "",
    addressLine1: "",
    ward: "",
    district: "",
    city: "",
    isDefault: true,
  })

  const handleChange = (field: keyof AddAddressRequest, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  useEffect(() => {
    let mounted = true
    const loadProvinces = async () => {
      setLoadingProvinces(true)
      try {
        const list = await vietnamProvincesService.getProvinces()
        if (mounted) setProvinces(list)
      } catch {
        toast.error("Không thể tải danh sách tỉnh/thành phố")
      } finally {
        if (mounted) setLoadingProvinces(false)
      }
    }
    void loadProvinces()
    return () => { mounted = false }
  }, [])

  const handleSelectProvince = useCallback(async (value: string) => {
    const provinceCode = Number(value)
    if (!Number.isFinite(provinceCode)) return

    const selectedProvince = provinces.find((p) => p.code === provinceCode)
    setSelectedProvinceCode(provinceCode)
    setSelectedDistrictCode("")
    setSelectedWardCode("")
    setDistricts([])
    setWards([])
    setForm((prev) => ({
      ...prev,
      city: selectedProvince?.name ?? "",
      province: selectedProvince?.name ?? "",
      district: "",
      ward: "",
    }))

    setLoadingDistricts(true)
    try {
      const list = await vietnamProvincesService.getDistricts(provinceCode)
      setDistricts(list)
    } catch {
      toast.error("Không thể tải danh sách quận/huyện")
    } finally {
      setLoadingDistricts(false)
    }
  }, [provinces])

  const handleSelectDistrict = useCallback(async (value: string) => {
    const districtCode = Number(value)
    if (!Number.isFinite(districtCode)) return

    const selectedDistrict = districts.find((d) => d.code === districtCode)
    setSelectedDistrictCode(districtCode)
    setSelectedWardCode("")
    setWards([])
    setForm((prev) => ({
      ...prev,
      district: selectedDistrict?.name ?? "",
      ward: "",
    }))

    setLoadingWards(true)
    try {
      const list = await vietnamProvincesService.getWards(districtCode)
      setWards(list)
    } catch {
      toast.error("Không thể tải danh sách phường/xã")
    } finally {
      setLoadingWards(false)
    }
  }, [districts])

  const handleSelectWard = useCallback((value: string) => {
    const selectedWard = wards.find((w) => w.code === value)
    setSelectedWardCode(value)
    setForm((prev) => ({ ...prev, ward: selectedWard?.name ?? "" }))
  }, [wards])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName?.trim() || !form.addressLine1.trim() || !form.city.trim()) {
      toast.error("Vui lòng nhập đầy đủ họ tên, địa chỉ và tỉnh/thành phố")
      return
    }
    setSaving(true)
    try {
      const res = await profileService.addAddress(form)
      if (res.success && res.data) {
        toast.success("Đã thêm địa chỉ thành công")
        onSuccess(res.data as AddressResponse)
      } else {
        toast.error(res.message ?? "Không thể thêm địa chỉ")
      }
    } catch {
      toast.error("Không thể thêm địa chỉ. Vui lòng thử lại.")
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full h-8 rounded-lg border px-2.5 text-[11px] bg-white focus:outline-none"
  const inputStyle = { borderColor: "#e3d3b7", color: "var(--color-text-main)" }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/30"
        onClick={onClose}
      />
      <div
        className="relative z-[10001] flex flex-col rounded-2xl bg-white border shadow-2xl overflow-hidden"
        style={{
          width: "100%",
          maxWidth: "420px",
          maxHeight: "85vh",
          borderColor: "#e5ded6",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: "#e5ded6" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-main)" }}>Thêm địa chỉ giao hàng</p>
          <button type="button" onClick={onClose} className="flex items-center justify-center size-7 rounded-lg hover:bg-gray-100">
            <X size={14} style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>

        {/* Form */}
        <form id="address-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium" style={{ color: "#7a5b29" }}>Họ tên người nhận *</label>
            <input
              className={inputCls} style={inputStyle}
              placeholder="Nguyễn Văn A"
              value={form.fullName ?? ""} onChange={(e) => handleChange("fullName", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium" style={{ color: "#7a5b29" }}>Số điện thoại</label>
            <input
              className={inputCls} style={inputStyle} type="tel"
              placeholder="0901234567"
              value={form.phone ?? ""} onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium" style={{ color: "#7a5b29" }}>Địa chỉ (số nhà, đường) *</label>
            <input
              className={inputCls} style={inputStyle}
              placeholder="123 Đường Lê Lợi"
              value={form.addressLine1} onChange={(e) => handleChange("addressLine1", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium" style={{ color: "#7a5b29" }}>Tỉnh/Thành phố *</label>
            <select
              className={inputCls}
              style={inputStyle}
              value={selectedProvinceCode}
              onChange={(e) => void handleSelectProvince(e.target.value)}
              disabled={loadingProvinces}
            >
              <option value="">{loadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành"}</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium" style={{ color: "#7a5b29" }}>Quận/Huyện</label>
              <select
                className={inputCls}
                style={inputStyle}
                value={selectedDistrictCode}
                onChange={(e) => void handleSelectDistrict(e.target.value)}
                disabled={!selectedProvinceCode || loadingDistricts}
              >
                <option value="">{loadingDistricts ? "Đang tải..." : "Chọn quận/huyện"}</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium" style={{ color: "#7a5b29" }}>Phường/Xã</label>
              <select
                className={inputCls}
                style={inputStyle}
                value={selectedWardCode}
                onChange={(e) => handleSelectWard(e.target.value)}
                disabled={!selectedDistrictCode || loadingWards}
              >
                <option value="">{loadingWards ? "Đang tải..." : "Chọn phường/xã"}</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.code}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="size-3.5 rounded accent-orange-500"
              checked={form.isDefault ?? false}
              onChange={(e) => handleChange("isDefault", e.target.checked)}
            />
            <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>Đặt làm địa chỉ mặc định</span>
          </label>
        </form>

        {/* Footer */}
        <div className="px-4 py-3 border-t flex gap-2 shrink-0" style={{ borderColor: "#e5ded6" }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-2 rounded-xl border text-xs font-medium"
            style={{ borderColor: "#d9cdc0", color: "var(--color-text-secondary)" }}>
            Huỷ
          </button>
          <button type="submit" form="address-form" disabled={saving}
            className="flex-1 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{ backgroundColor: "var(--color-primary)" }}>
            {saving ? <><Loader2 size={12} className="animate-spin" /> Đang lưu...</> : "Lưu địa chỉ"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductQuickViewModal({
  productId,
  onClose,
}: {
  productId: string
  onClose: () => void
}) {
  const [product, setProduct] = useState<StorefrontProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)

  useEffect(() => {
    getProductById(productId)
      .then((res) => {
        if (res.success && res.product) {
          setProduct(res.product)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [productId])

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative z-[10001] flex flex-col rounded-2xl bg-white border shadow-2xl overflow-hidden w-full max-w-[720px] max-h-[85vh]"
        style={{ borderColor: "#e5ded6" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-gray-50/50" style={{ borderColor: "#e5ded6" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-main)" }}>Chi tiết sản phẩm</p>
          <button type="button" onClick={onClose} className="flex items-center justify-center size-7 rounded-lg hover:bg-gray-200 transition-colors">
            <X size={14} style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col md:flex-row gap-5 md:gap-6">
          {loading ? (
            <div className="flex justify-center w-full py-20"><Loader2 className="size-8 animate-spin text-gray-400" /></div>
          ) : !product ? (
            <p className="text-center w-full text-sm text-gray-500 py-20">Không tìm thấy sản phẩm</p>
          ) : (
             <>
               {/* Cột trái: Ảnh sản phẩm */}
               <div className="w-full md:w-5/12 shrink-0 flex flex-col gap-2.5">
                 <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden border shadow-sm" style={{ borderColor: "#e5ded6" }}>
                   {product.imageUrls?.[selectedImageIdx] ? (
                      <img src={product.imageUrls[selectedImageIdx]} alt={product.name} className="size-full object-cover transition-opacity duration-200" />
                   ) : (
                      <div className="size-full flex items-center justify-center"><ShoppingBag className="text-gray-300" size={40} /></div>
                   )}
                 </div>
                 {/* Ảnh thu nhỏ sơ bộ */}
                 {product.imageUrls && product.imageUrls.length > 1 && (
                   <div className="flex gap-2 overflow-x-auto pb-1 pb-2 custom-scrollbar">
                     {product.imageUrls.slice(0, 6).map((url, idx) => (
                       <button
                         key={idx}
                         type="button"
                         onClick={() => setSelectedImageIdx(idx)}
                         className="size-14 rounded-lg overflow-hidden border shadow-sm shrink-0 transition-opacity"
                         style={{ 
                           borderColor: selectedImageIdx === idx ? "var(--color-primary)" : "#e5ded6",
                           borderWidth: selectedImageIdx === idx ? 2 : 1,
                           opacity: selectedImageIdx === idx ? 1 : 0.6
                         }}
                       >
                         <img src={url} alt={`${product.name}-${idx}`} className="size-full object-cover" />
                       </button>
                     ))}
                   </div>
                 )}
               </div>
               
               {/* Cột phải: Chi tiết thông tin */}
               <div className="flex flex-col gap-3 flex-1 min-w-0">
                 <div>
                   <p className="text-[11px] font-semibold tracking-wider uppercase mb-1.5" style={{ color: "#a58553" }}>
                     {product.shopName} {product.categoryName ? `• ${product.categoryName}` : ""}
                   </p>
                   <p className="font-bold text-lg leading-snug" style={{ color: "var(--color-text-main)" }}>{product.name}</p>
                 </div>

                 <div className="flex items-center gap-2 text-sm mt-0.5">
                   {product.averageRating > 0 && (
                     <>
                       <div className="flex items-center gap-1">
                         <span className="font-bold text-orange-500">{product.averageRating.toFixed(1)}</span>
                         <span className="text-yellow-400 text-sm leading-none pb-0.5">★</span>
                         <span className="text-gray-400 text-xs ml-0.5">({product.reviewCount} đánh giá)</span>
                       </div>
                       <span className="text-gray-300">|</span>
                     </>
                   )}
                   <span className="text-gray-500 text-xs">Đã bán {product.soldCount}</span>
                 </div>
                 
                 <div className="mt-1 bg-orange-50/60 p-3.5 rounded-xl border" style={{ borderColor: "#fbe5ce" }}>
                   <span className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>{formatPrice(product.basePrice)}</span>
                 </div>

                 {product.variants && product.variants.length > 0 && (
                   <div className="mt-2">
                     <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-main)" }}>Phân loại / Tùy chọn:</p>
                     <div className="flex flex-wrap gap-2">
                       {product.variants.map((v) => (
                         <span key={v.id} className="px-2.5 py-1.5 text-[11px] bg-white border rounded-md shadow-sm" style={{ borderColor: "#e5ded6", color: "var(--color-text-main)" }}>
                           {v.variantName}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}

                 {product.tags && product.tags.length > 0 && (
                   <div className="mt-2 text-xs">
                     <p className="font-semibold mb-1.5" style={{ color: "var(--color-text-main)" }}>Từ khóa (Tags):</p>
                     <div className="flex flex-wrap gap-1.5">
                       {product.tags.map(t => (
                         <span key={t} className="px-2 py-0.5 rounded border" style={{ backgroundColor: "#faf6f0", borderColor: "#e5ded6", color: "#8a6a36" }}>#{t}</span>
                       ))}
                     </div>
                   </div>
                 )}

                 {product.materials && product.materials.length > 0 && (
                   <div className="mt-2 text-xs">
                     <p className="font-semibold mb-1.5" style={{ color: "var(--color-text-main)" }}>Chất liệu:</p>
                     <div className="flex flex-wrap gap-1.5">
                       {product.materials.map(m => (
                         <span key={m} className="px-2 py-0.5 rounded border" style={{ backgroundColor: "#f3f4f6", borderColor: "#e5e7eb", color: "#4b5563" }}>{m}</span>
                       ))}
                     </div>
                   </div>
                 )}

                 <div className="text-xs text-gray-600 border-t pt-3 mt-1 flex-1 flex flex-col" style={{ borderColor: "#e5ded6" }}>
                   <p className="font-semibold mb-2 text-[13px]" style={{ color: "var(--color-text-main)" }}>Chi tiết mô tả:</p>
                   <div className="overflow-y-auto max-h-[160px] pr-2 custom-scrollbar">
                     <p className="whitespace-pre-wrap leading-relaxed opacity-90">{product.description || "Không có nội dung mô tả"}</p>
                   </div>
                 </div>
               </div>
             </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t shrink-0 flex justify-end gap-2.5 bg-gray-50" style={{ borderColor: "#e5ded6" }}>
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border text-xs font-semibold hover:bg-gray-200 transition-colors" style={{ borderColor: "#d9cdc0", color: "var(--color-text-main)" }}>
            Đóng
          </button>
          <Link href={`/products/${product?.slug || productId}`} target="_blank" className="px-5 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center justify-center transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: "var(--color-primary)" }}>
            Xem toàn bộ trang
          </Link>
        </div>
      </div>
    </div>
  )
}

function ShopioAvatar({ size = "sm" }: { size?: "xs" | "sm" | "md" }) {
  const sizeClass = size === "xs" ? "size-6" : size === "sm" ? "size-8" : "size-10"
  const iconSize = size === "xs" ? 12 : size === "sm" ? 16 : 20
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center shrink-0`}
      style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #f59c2a 100%)" }}
    >
      <ShoppingBag size={iconSize} className="text-white" />
    </div>
  )
}

export function ShopioAssistantWidget() {
  const { session, isLoading: authLoading } = useAuth()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<"list" | "chat">("list")
  const [sessions, setSessions] = useState<AiSessionSummary[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionSearch, setSessionSearch] = useState("")
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>("all")

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState("")
  const [bootLoading, setBootLoading] = useState(false)
  const [booted, setBooted] = useState(false)
  const [sending, setSending] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [showAddressPicker, setShowAddressPicker] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vnpay")
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [selectedProductsByMessageId, setSelectedProductsByMessageId] = useState<
    Record<string, Record<string, ProductSelection>>
  >({})
  const [applyingSelectionMessageId, setApplyingSelectionMessageId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTargetState | null>(null)
  const [quickViewProductId, setQuickViewProductId] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) ?? addresses[0] ?? null,
    [addresses]
  )
  const effectiveAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? defaultAddress,
    [addresses, selectedAddressId, defaultAddress]
  )

  const visibleSessions = useMemo(() => {
    const keyword = sessionSearch.trim().toLowerCase()
    return sessions
      .filter((s) => {
        if (!keyword) return true
        const title = s.title?.toLowerCase() ?? ""
        const preview = s.lastMessage?.content?.toLowerCase() ?? ""
        return title.includes(keyword) || preview.includes(keyword)
      })
      .filter((s) => {
        if (sessionFilter === "unread") return (s.unreadCount ?? 0) > 0
        if (sessionFilter === "muted") return !!s.isMuted
        return true
      })
  }, [sessions, sessionSearch, sessionFilter])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (!listRef.current) return
      listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }, [])

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const res = await aiChatService.listSessions()
      if (res.success) setSessions(res.sessions)
    } catch { /* non-blocking */ }
    finally { setSessionsLoading(false) }
  }, [])

  const loadAddresses = useCallback(async () => {
    try {
      const res = await profileService.getAddresses()
      if (res.success) {
        const list = res.data ?? []
        setAddresses(list)
        setSelectedAddressId((prev) => {
          if (prev && list.some((a) => a.id === prev)) return prev
          return list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? ""
        })
      }
    } catch { /* non-blocking */ }
  }, [])

  // Boot session only once when widget opens
  const boot = useCallback(async () => {
    if (booted || bootLoading) return
    setBootLoading(true)
    try {
      const session = await aiChatService.getOrCreateSession()
      setSessionId(session.sessionId)

      const beMessages: UiMessage[] = (session.history ?? []).map((m) =>
        mapHistoryMessageToUi(session.sessionId, {
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
          products: m.products,
        })
      )

      // Load cache
      const cachedRaw = readAiChatUiCache(session.sessionId)
      let cachedMessages: UiMessage[] = []
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as {
            messages?: UiMessage[]
            confirmTarget?: ConfirmTargetState | null
            selectedAddressId?: string
            selectedProductsByMessageId?: Record<string, Record<string, ProductSelection>>
          }
          if (cached.messages?.length) cachedMessages = cached.messages
          if (cached.confirmTarget) setConfirmTarget(cached.confirmTarget)
          if (cached.selectedAddressId) setSelectedAddressId(cached.selectedAddressId)
          if (cached.selectedProductsByMessageId) setSelectedProductsByMessageId(cached.selectedProductsByMessageId)
        } catch { /* ignore */ }
      }

      // Merge: dùng cached nếu có (vì có responseMeta/products), bổ sung BE messages còn thiếu
      // BE messages có id dạng số "1", "2"... — cached có "u-xxx", "a-xxx"
      if (cachedMessages.length > 0) {
        const cachedIds = new Set(cachedMessages.map((m) => m.id))
        const extraFromBe = beMessages.filter((m) => !cachedIds.has(m.id))
        const merged = dedupeMergedChatMessages([...cachedMessages, ...extraFromBe])
        setMessages(merged)
      } else {
        setMessages(dedupeMergedChatMessages(beMessages))
      }

      await loadAddresses()
      setBooted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể kết nối trợ lý")
    } finally {
      setBootLoading(false)
    }
  }, [booted, bootLoading, loadAddresses])

  useEffect(() => {
    if (open && !booted) void boot()
    if (open) void loadSessions()
  }, [open, booted, boot, loadSessions])

  useEffect(() => { if (open) scrollToBottom() }, [messages, open, scrollToBottom])

  // Cache đầy đủ: messages + UI state (để khôi phục sau khi redirect VNPay/MoMo)
  useEffect(() => {
    if (!sessionId) return
    writeAiChatUiCache(
      sessionId,
      JSON.stringify({ messages, confirmTarget, selectedAddressId, selectedProductsByMessageId })
    )
  }, [sessionId, messages, confirmTarget, selectedAddressId, selectedProductsByMessageId])

  const buildConfirmFromCart = useCallback(async (messageId: string, preferredProductId?: string, quantity = 1) => {
    const cart = await cartService.getMyCart().catch(() => null)
    if (!cart?.id || !cart.items?.length) return false
    const matched = preferredProductId
      ? cart.items.find((i) => i.productId === preferredProductId)
      : cart.items[0]
    if (!matched) return false
    setConfirmTarget({
      cartId: cart.id, messageId,
      preview: { id: matched.productId, name: matched.productName, imageUrl: matched.productImage, basePrice: matched.unitPrice, quantity },
      previews: [{ id: matched.productId, name: matched.productName, imageUrl: matched.productImage, basePrice: matched.unitPrice, quantity }],
    })
    return true
  }, [])

  const getSelectedProducts = useCallback(
    (messageId: string, products: NonNullable<UiMessage["responseMeta"]>["products"]) => {
      const selections = selectedProductsByMessageId[messageId] ?? {}
      return products
        .map((p) => {
          const sel = selections[p.id]
          if (!sel?.checked) return null
          return { ...p, quantity: Math.max(1, Number(sel.quantity) || 1) }
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    },
    [selectedProductsByMessageId]
  )

  const handleApplySelectedProducts = useCallback(async (message: UiMessage) => {
    const products = message.responseMeta?.products ?? []
    if (!products.length) return
    const selectedItems = getSelectedProducts(message.id, products)
    if (!selectedItems.length) { toast.message("Bạn hãy tick ít nhất 1 sản phẩm trước khi bấm OK."); return }

    setApplyingSelectionMessageId(message.id)
    try {
      for (const item of selectedItems) {
        await cartService.addItem({ productId: item.id, quantity: item.quantity })
      }
      const cart = await cartService.getMyCart()
      window.dispatchEvent(new Event(CART_UPDATED_EVENT))
      const first = selectedItems[0]
      const confirmMsgId = `a-bulk-confirm-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        {
          id: confirmMsgId, role: "assistant",
          content: selectedItems.length === 1
            ? `Mình đã thêm ${first.quantity} x "${first.name}" vào giỏ. Bạn có muốn tạo đơn ngay không?`
            : `Mình đã thêm ${selectedItems.length} sản phẩm bạn tick vào giỏ. Bạn có muốn tạo đơn ngay không?`,
          createdAt: new Date().toISOString(),
        },
      ])
      setConfirmTarget({
        cartId: cart.id, messageId: confirmMsgId,
        preview: { id: first.id, name: first.name, imageUrl: first.imageUrl, basePrice: first.basePrice, quantity: first.quantity },
        previews: selectedItems.map((item) => ({ id: item.id, name: item.name, imageUrl: item.imageUrl, basePrice: item.basePrice, quantity: item.quantity })),
      })
      toast.success(selectedItems.length === 1 ? "Đã thêm sản phẩm đã chọn vào giỏ" : `Đã thêm ${selectedItems.length} sản phẩm vào giỏ`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể thêm sản phẩm vào giỏ")
    } finally {
      setApplyingSelectionMessageId(null)
    }
  }, [getSelectedProducts])

  const handleSend = useCallback(async () => {
    if (!sessionId || !input.trim() || sending) return
    const msg = input.trim()
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: msg, createdAt: new Date().toISOString() }])
    setInput("")
    setSending(true)
    try {
      const res = await aiChatService.sendMessage(sessionId, msg)
      const fallback = (res.products?.length ?? 0) > 0
        ? "Mình đã tìm thấy sản phẩm phù hợp ở bên dưới."
        : "Mình chưa tìm thấy sản phẩm phù hợp. Bạn thử thêm từ khóa ngành hàng, mức giá hoặc thương hiệu nhé."
      const assistantMsg: UiMessage = {
        id: `a-${Date.now()}`, role: "assistant",
        content: res.reply?.trim() || fallback,
        createdAt: new Date().toISOString(),
        responseMeta: { ...res, cartId: res.cartId },
      }
      setMessages((prev) => [...prev, assistantMsg])

      if (res.products?.length) {
        setSelectedProductsByMessageId((prev) => {
          const oldMap = prev[assistantMsg.id] ?? {}
          const nextMap = res.products.reduce<Record<string, ProductSelection>>((acc, p) => {
            acc[p.id] = { checked: oldMap[p.id]?.checked ?? false, quantity: oldMap[p.id]?.quantity ?? 1 }
            return acc
          }, {})
          return { ...prev, [assistantMsg.id]: nextMap }
        })
      }

      const shouldConfirm =
        (res.needsConfirmation && res.intent === "checkout") || res.intent === "checkout" ||
        isOrderRequestText(msg) || /bạn có muốn.*tạo đơn|xác nhận.*đơn|tạo đơn hàng/i.test(res.reply)

      if (shouldConfirm) {
        if (res.cartId) {
          setConfirmTarget({ cartId: res.cartId, messageId: assistantMsg.id })
        } else {
          const ok = await buildConfirmFromCart(assistantMsg.id)
          if (!ok && isOrderRequestText(msg)) toast.error("Hiện chưa có sản phẩm trong giỏ để tạo đơn")
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể gửi tin nhắn")
    } finally {
      setSending(false)
    }
  }, [sessionId, input, sending, buildConfirmFromCart])

  const handleConfirmOrder = useCallback(async () => {
    if (!sessionId) { toast.message("Phiên chưa sẵn sàng."); return }
    setOrderLoading(true)
    let didComplete = false
    try {
      // Re-fetch địa chỉ mới nhất (quan trọng: user có thể vừa thêm)
      const latestRes = await profileService.getAddresses().catch(() => null)
      const latest = latestRes?.success ? (latestRes.data ?? []) : []
      if (latest.length) setAddresses(latest)

      const resolved =
        latest.find((a) => a.id === selectedAddressId) ??
        latest.find((a) => a.isDefault) ??
        latest[0] ??
        effectiveAddress

      if (!resolved) {
        toast.message("Bạn chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ.")
        setShowAddressModal(true)
        return
      }
      if (resolved.id !== selectedAddressId) setSelectedAddressId(resolved.id)

      let cartId = confirmTarget?.cartId
      if (!cartId) { const c = await cartService.getMyCart().catch(() => null); cartId = c?.id }
      if (!cartId) { toast.message("Giỏ hàng đang trống."); return }

      const res = await aiChatService.confirmOrder(sessionId, cartId, resolved.id)

      if (res.success && res.orderId) {
        const providerLabel = paymentMethod === "momo" ? "MoMo" : "VNPay"
        const payFn = paymentMethod === "momo"
          ? paymentsService.createMoMoPayment
          : paymentsService.createVNPayPayment

        const payRes = await payFn(res.orderId).catch(() => null)

        if (payRes?.success && payRes.paymentUrl) {
          setMessages((prev) => [...prev, {
            id: `a-confirm-${Date.now()}`, role: "assistant",
            content: `Đơn hàng đã được tạo! Đang chuyển bạn đến trang thanh toán ${providerLabel}...`,
            createdAt: new Date().toISOString(),
          }])
          toast.success(`Đơn hàng đã tạo — đang chuyển đến ${providerLabel}`)
          didComplete = true
          setTimeout(() => { window.location.href = payRes.paymentUrl! }, 800)
        } else {
          await ordersService.cancelPendingOrder(res.orderId).catch(() => null)
          toast.error(`Không thể khởi tạo thanh toán ${providerLabel}. Đơn hàng đã bị huỷ. Vui lòng thử lại.`)
          // Không set didComplete → confirmTarget giữ nguyên để retry
        }
      } else if (res.success) {
        setMessages((prev) => [...prev, {
          id: `a-confirm-${Date.now()}`, role: "assistant",
          content: res.message,
          createdAt: new Date().toISOString(),
        }])
        toast.success("Tạo đơn hàng thành công")
        didComplete = true
      } else {
        toast.error(res.message || "Không thể tạo đơn hàng")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xác nhận đơn hàng")
    } finally {
      setOrderLoading(false)
      if (didComplete) setConfirmTarget(null)
    }
  }, [sessionId, confirmTarget, effectiveAddress, selectedAddressId, paymentMethod])

  const handleRejectOrder = useCallback(async () => {
    setConfirmTarget(null)
    if (!sessionId) return
    try {
      const res = await aiChatService.sendMessage(sessionId, "Tôi không muốn tạo đơn hàng lúc này")
      setMessages((prev) => [
        ...prev,
        { id: `u-reject-${Date.now()}`, role: "user", content: "Tôi không muốn tạo đơn hàng lúc này", createdAt: new Date().toISOString() },
        { id: `a-reject-${Date.now()}`, role: "assistant", content: res.reply, createdAt: new Date().toISOString(), responseMeta: res },
      ])
    } catch {
      toast.message("Đã bỏ qua bước xác nhận")
    }
  }, [sessionId])

  const handleNewConversation = useCallback(async () => {
    // Xoá cache session cũ
    if (sessionId) removeAiChatUiCache(sessionId)

    // Reset UI ngay lập tức
    setMessages([])
    setConfirmTarget(null)
    setSelectedProductsByMessageId({})
    setInput("")
    setView("chat")

    // Gọi BE tạo session mới thật sự
    setBootLoading(true)
    try {
      const newSession = await aiChatService.createNewSession()
      setSessionId(newSession.sessionId)
      setBooted(true)
      // Refresh danh sách sessions
      void loadSessions()
    } catch {
      toast.error("Không thể tạo cuộc trò chuyện mới")
      setBooted(false)
    } finally {
      setBootLoading(false)
    }
  }, [sessionId, loadSessions])

  const openSession = useCallback(async (sid: string) => {
    setView("chat")
    setSessions((prev) => prev.map((s) => s.sessionId === sid ? { ...s, unreadCount: 0 } : s))
    void aiChatService.markSessionRead(sid).catch(() => null)
    // Nếu đây là session hiện tại, không fetch lại
    if (sid === sessionId) return

    setBootLoading(true)
    try {
      const res = await aiChatService.getSessionMessages(sid)
      if (res.success) {
        const cachedRaw = readAiChatUiCache(sid)
        let cachedMessages: UiMessage[] = []
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as { messages?: UiMessage[] }
            if (cached.messages?.length) cachedMessages = cached.messages
          } catch { /* ignore */ }
        }

        const beMessages: UiMessage[] = res.messages.map((m) =>
          mapHistoryMessageToUi(sid, {
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
            products: m.products,
          })
        )

        if (cachedMessages.length > 0) {
          const cachedIds = new Set(cachedMessages.map((m) => m.id))
          const extra = beMessages.filter((m) => !cachedIds.has(m.id))
          const merged = dedupeMergedChatMessages([...cachedMessages, ...extra])
          setMessages(merged)
        } else {
          setMessages(dedupeMergedChatMessages(beMessages))
        }

        setSessionId(sid)
        setConfirmTarget(null)
        setSelectedProductsByMessageId({})
        setBooted(true)
      }
    } catch { toast.error("Không thể tải cuộc trò chuyện") }
    finally { setBootLoading(false) }
  }, [sessionId])

  const handleMarkSessionRead = useCallback(async (sid: string) => {
    try {
      await aiChatService.markSessionRead(sid)
      setSessions((prev) => prev.map((s) => s.sessionId === sid ? { ...s, unreadCount: 0 } : s))
      toast.success("Đã đánh dấu đã đọc")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể đánh dấu đã đọc")
    }
  }, [])

  const handleToggleMuteSession = useCallback(async (sid: string) => {
    const current = sessions.find((s) => s.sessionId === sid)
    const nextMuted = !current?.isMuted
    try {
      await aiChatService.setSessionMuted(sid, nextMuted)
      setSessions((prev) => prev.map((s) => s.sessionId === sid ? { ...s, isMuted: nextMuted } : s))
      toast.success(nextMuted ? "Đã tắt thông báo cuộc trò chuyện" : "Đã bật lại thông báo")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật thông báo")
    }
  }, [sessions])

  const handleDeleteSession = useCallback((sid: string) => {
    toast('Xóa cuộc trò chuyện này?', {
      description: 'Hành động này không thể hoàn tác.',
      action: {
        label: 'Xóa',
        onClick: async () => {
          try {
            await aiChatService.deleteSession(sid)
            setSessions((prev) => prev.filter((s) => s.sessionId !== sid))

            if (sid === sessionId) {
              removeAiChatUiCache(sid)
              setSessionId(null)
              setMessages([])
              setConfirmTarget(null)
              setSelectedProductsByMessageId({})
              setView('list')
              setBooted(false)
            }

            toast.success('Đã xóa cuộc trò chuyện')
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Không thể xóa cuộc trò chuyện')
          }
        },
      },
      cancel: {
        label: 'Hủy',
        onClick: () => {},
      },
    })
  }, [sessionId])

  useEffect(() => {
    if (confirmTarget) setShowAddressPicker(false)
  }, [confirmTarget])

  // Reload địa chỉ khi user quay lại tab/trang (ví dụ sau khi thêm địa chỉ)
  useEffect(() => {
    if (!open) return
    const handler = () => {
      if (!document.hidden) void loadAddresses()
    }
    document.addEventListener("visibilitychange", handler)
    window.addEventListener("focus", handler)
    return () => {
      document.removeEventListener("visibilitychange", handler)
      window.removeEventListener("focus", handler)
    }
  }, [open, loadAddresses])

  const handleAddressAdded = useCallback((newAddr: AddressResponse) => {
    setAddresses((prev) => {
      const updated = newAddr.isDefault
        ? prev.map((a) => ({ ...a, isDefault: false }))
        : [...prev]
      return [newAddr, ...updated.filter((a) => a.id !== newAddr.id)]
    })
    setSelectedAddressId(newAddr.id)
    setShowAddressModal(false)
  }, [])

  // Hide widget when loading auth or logged out (must run after all hooks)
  if (authLoading || !session) return null

  return (
    <>
      {/* Address form modal (renders outside widget panel) */}
      {showAddressModal && (
        <AddressFormModal
          onSuccess={handleAddressAdded}
          onClose={() => setShowAddressModal(false)}
        />
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-[9998] flex items-center justify-center size-14 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          style={{
            bottom: "88px",
            right: "8px",
            background: "linear-gradient(135deg, var(--color-primary) 0%, #f59c2a 100%)",
          }}
          title="Trợ lý mua hàng"
        >
          <ShoppingBag className="text-white" size={22} />
        </button>
      )}

      {/* ── Chat Panel ── */}
      {open && (
        <div
          className="fixed z-[9998] flex flex-col rounded-2xl bg-white border shadow-2xl overflow-hidden min-h-0"
          style={{
            bottom: "88px",
            right: "8px",
            width: view === "chat" ? "390px" : "310px",
            height: "560px",
            maxHeight: "80vh",
            borderColor: "#e5ded6",
            transition: "width 0.2s ease",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between gap-2 px-3 py-2.5 border-b shrink-0"
            style={{ borderColor: "#e5ded6" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {view === "chat" && (
                <button
                  type="button"
                  onClick={() => { setView("list"); void loadSessions() }}
                  className="flex items-center justify-center size-7 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                  title="Danh sách cuộc trò chuyện"
                >
                  <ChevronLeft size={15} />
                </button>
              )}
              <ShopioAvatar size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-main)" }}>
                  {view === "list" ? "Trợ lý mua hàng" : "Trợ lý mua hàng"}
                </p>
                {view === "chat" && (
                  <div className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-green-500 inline-block" />
                    <span className="text-[10px] text-muted-foreground">Luôn sẵn sàng hỗ trợ</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {view === "list" && (
                <button
                  type="button"
                  onClick={() => void handleNewConversation()}
                  title="Cuộc trò chuyện mới"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors hover:bg-[#fdf6ee]"
                  style={{ borderColor: "#e0d2c2", color: "var(--color-primary)" }}
                >
                  <Plus size={12} /> Mới
                </button>
              )}
              {view === "chat" && (
                <button
                  type="button"
                  onClick={() => { setView("list"); void loadSessions() }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border transition-colors hover:bg-[#f5f1ec]"
                  style={{ borderColor: "#e0d2c2", color: "var(--color-text-secondary)" }}
                  title="Thu nhỏ"
                >
                  <ChevronDown size={12} /> Thu nhỏ
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center size-7 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                title="Đóng"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          <>
              {/* ── Sessions list view ── */}
              {view === "list" && (
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" style={{ background: "#faf8f6" }}>
                  <div className="sticky top-0 z-10 border-b px-3 py-2.5 flex items-center gap-2" style={{ background: "#faf8f6", borderColor: "#f0e8de" }}>
                    <div className="flex items-center gap-1.5 rounded-xl border px-2.5 h-10 flex-1 bg-white" style={{ borderColor: "#e5ded6" }}>
                      <Search size={13} className="text-gray-400 shrink-0" />
                      <input
                        value={sessionSearch}
                        onChange={(e) => setSessionSearch(e.target.value)}
                        placeholder="Tìm theo tiêu đề hoặc nội dung"
                        className="w-full bg-transparent text-xs focus:outline-none placeholder:text-gray-400"
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-10 min-w-32 rounded-xl border bg-white px-2.5 flex items-center gap-1.5"
                          style={{ borderColor: "#e5ded6", color: "var(--color-text-main)" }}
                          aria-label="Lọc cuộc trò chuyện"
                        >
                          <Filter size={13} className="text-gray-400 shrink-0" />
                          <span className="text-xs font-medium truncate flex-1 text-left">{getSessionFilterLabel(sessionFilter)}</span>
                          <ChevronDown size={13} className="text-gray-400 shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        side="bottom"
                        sideOffset={6}
                        className="w-44"
                        style={{ zIndex: 10020 }}
                      >
                        <DropdownMenuItem onSelect={() => setSessionFilter("all")} className="text-xs">
                          <List size={14} />
                          Tất cả
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setSessionFilter("unread")} className="text-xs">
                          <Mail size={14} />
                          Chưa đọc
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setSessionFilter("muted")} className="text-xs">
                          <BellOff size={14} />
                          Đã tắt thông báo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {sessionsLoading ? (
                    <div className="flex items-center justify-center h-32 gap-2">
                      <div className="size-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
                      <span className="text-xs text-muted-foreground">Đang tải...</span>
                    </div>
                  ) : visibleSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3 px-4">
                      <MessageSquare size={32} className="text-gray-300" />
                      <p className="text-sm text-muted-foreground text-center">
                        {sessions.length === 0 ? "Chưa có cuộc trò chuyện nào" : "Không có cuộc trò chuyện phù hợp bộ lọc"}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleNewConversation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        <Plus size={13} /> Bắt đầu trò chuyện
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {visibleSessions.map((s) => {
                        const unreadCount = Math.max(0, s.unreadCount ?? 0)
                        const isUnread = unreadCount > 0
                        const isMuted = !!s.isMuted
                        return (
                        <div
                          key={s.sessionId}
                          className={`flex items-start gap-3 px-3 py-3 text-left border-b hover:bg-white transition-colors ${
                            s.sessionId === sessionId ? "bg-[#fdf6ee]" : ""
                          }`}
                          style={{ borderColor: "#f0e8de" }}
                        >
                          <ShopioAvatar size="xs" />
                          <button
                            type="button"
                            onClick={() => void openSession(s.sessionId)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="text-xs font-semibold leading-snug truncate" style={{ color: "var(--color-text-main)" }}>
                              {truncateText(s.title, 28)}
                            </p>
                            {s.lastMessage && (
                              <p className="text-[11px] truncate mt-0.5 text-muted-foreground">
                                {s.lastMessage.role === "user" ? "Bạn: " : "Trợ lý: "}
                                {truncateText(s.lastMessage.content, 38)}
                              </p>
                            )}
                          </button>
                          <div className="w-24 shrink-0 flex items-center justify-end gap-1">
                            {isMuted && (
                              <BellOff size={11} style={{ color: "#9e8f7f" }} />
                            )}
                            <span className="inline-flex size-4 items-center justify-center">
                              {isUnread && (
                                <span className="size-4 rounded-full bg-red-500 text-white text-[9px] font-semibold flex items-center justify-center">
                                  {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground w-14 text-right">
                              {formatSessionTime(s.updatedAt ?? s.createdAt)}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="size-6 rounded-md flex items-center justify-center hover:bg-[#f3ebe2]"
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label="Tùy chọn cuộc trò chuyện"
                                >
                                  <MoreVertical size={16} strokeWidth={2.5} style={{ color: "#8f7d6a" }} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                side="bottom"
                                sideOffset={6}
                                className="w-52"
                                style={{ zIndex: 10020 }}
                              >
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleMarkSessionRead(s.sessionId)
                                  }}
                                  className="text-xs"
                                >
                                  <CheckCheck size={14} />
                                  Đánh dấu đã đọc
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleToggleMuteSession(s.sessionId)
                                  }}
                                  className="text-xs"
                                >
                                  <BellOff size={14} />
                                  {isMuted ? "Bật thông báo" : "Tắt thông báo"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleDeleteSession(s.sessionId)
                                  }}
                                  className="text-xs"
                                >
                                  <Trash2 size={14} />
                                  Xóa trò chuyện
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Chat view ── */}
              {view === "chat" && (
              <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
              {/* Messages */}
              <div
                ref={listRef}
                className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3"
                style={{ background: "#faf8f6" }}
              >
                {bootLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <div className="size-6 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
                    <p className="text-xs text-muted-foreground">Đang kết nối...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 px-2">
                    <ShopioAvatar size="md" />
                    <p className="text-center text-sm font-medium" style={{ color: "var(--color-text-main)" }}>
                      Xin chào! Mình là trợ lý mua hàng.
                    </p>
                    <p className="text-center text-xs text-muted-foreground">
                      Mô tả món đồ bạn muốn, mình sẽ gợi ý sản phẩm phù hợp!
                    </p>
                    <div className="grid grid-cols-1 gap-1.5 w-full">
                      {[
                        "Áo thun nam dưới 200k",
                        "Son môi đỏ đẹp",
                        "Laptop gaming tầm 15 triệu",
                      ].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setInput(s)}
                          className="w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors hover:bg-[#fdf6ee]"
                          style={{ borderColor: "#e7ddd2", color: "var(--color-text-secondary)" }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 w-full min-w-0 max-w-full">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex gap-2 w-full min-w-0 max-w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {m.role === "assistant" && <ShopioAvatar size="xs" />}
                        <div
                          className={`flex flex-col gap-0.5 min-w-0 ${
                            m.role === "user" ? "max-w-[min(100%,18.5rem)] items-end" : "flex-1 max-w-full items-stretch pr-0.5"
                          }`}
                        >
                          <div
                            className={`rounded-2xl px-3 py-2 text-xs leading-relaxed w-full min-w-0 max-w-full ${
                              m.role === "user" ? "rounded-br-sm text-white" : "rounded-bl-sm bg-white border"
                            }`}
                            style={
                              m.role === "user"
                                ? { backgroundColor: "var(--color-primary)" }
                                : { borderColor: "#e8e0d6", color: "var(--color-text-main)" }
                            }
                          >
                            {/* Text */}
                            {!(m.role === "assistant" && m.responseMeta?.products?.length) && (
                              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{m.content}</p>
                            )}

                            {/* Product cards */}
                            {m.responseMeta?.products?.length ? (
                              <div className="flex flex-col gap-1.5 w-full min-w-0 max-w-full">
                                {m.responseMeta.products.map((p) => {
                                  const sel = selectedProductsByMessageId[m.id]?.[p.id]
                                  const checked = sel?.checked ?? false
                                  const quantity = Math.max(1, Number(sel?.quantity) || 1)
                                  return (
                                    <div
                                      key={p.id}
                                      className="rounded-lg border bg-white overflow-hidden w-full min-w-0 max-w-full"
                                      style={{ borderColor: checked ? "#f3c97b" : "#ede5db" }}
                                    >
                                      <div className="flex items-start gap-2 p-2 min-w-0">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSelectedProductsByMessageId((prev) => {
                                              const mm = prev[m.id] ?? {}
                                              const cur = mm[p.id] ?? { checked: false, quantity: 1 }
                                              return { ...prev, [m.id]: { ...mm, [p.id]: { checked: !cur.checked, quantity: Math.max(1, Number(cur.quantity) || 1) } } }
                                            })
                                          }
                                          className="mt-0.5 size-3.5 rounded border shrink-0 flex items-center justify-center"
                                          style={{
                                            borderColor: checked ? "var(--color-primary)" : "#c8bdb1",
                                            backgroundColor: checked ? "var(--color-primary)" : "transparent",
                                          }}
                                        >
                                          {checked && <Check size={8} className="text-white" strokeWidth={3} />}
                                        </button>
                                        <div className="size-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                          {p.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={p.imageUrl} alt={p.name} className="size-full object-cover" />
                                          ) : (
                                            <div className="size-full flex items-center justify-center">
                                              <ShoppingBag size={12} className="text-gray-300" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1 flex flex-col gap-1">
                                          <p className="text-[11px] font-semibold leading-snug break-words line-clamp-3" style={{ color: "#2f2f2f" }}>{p.name}</p>
                                          <p className="text-[10px] text-muted-foreground line-clamp-2 break-words">{p.categoryName ?? "Sản phẩm gợi ý"}</p>
                                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span className="text-[11px] font-bold shrink-0" style={{ color: "var(--color-primary)" }}>
                                              {formatPrice(p.basePrice)}
                                            </span>
                                            <div className="flex items-center gap-1 shrink-0">
                                              <span className="text-[10px] text-muted-foreground">SL</span>
                                              <input
                                                type="number" min={1} value={quantity}
                                                onChange={(e) => {
                                                  const nextQty = Math.max(1, Math.floor(Number(e.target.value) || 1))
                                                  setSelectedProductsByMessageId((prev) => {
                                                    const mm = prev[m.id] ?? {}
                                                    const cur = mm[p.id] ?? { checked: false, quantity: 1 }
                                                    return { ...prev, [m.id]: { ...mm, [p.id]: { checked: cur.checked, quantity: nextQty } } }
                                                  })
                                                }}
                                                className="h-5 w-11 rounded border px-1 text-[10px] focus:outline-none text-center"
                                                style={{ borderColor: "#e3d3b7" }}
                                              />
                                            </div>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.preventDefault()
                                                setQuickViewProductId(p.id)
                                              }}
                                              className="text-[10px] font-medium underline shrink-0 ml-auto"
                                              style={{ color: "var(--color-primary)" }}
                                            >
                                              Chi tiết
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                                {/* OK button */}
                                <div className="flex items-center justify-between gap-1 pt-0.5">
                                  <p className="text-[10px]" style={{ color: "#8a6a36" }}>
                                    Đã chọn {getSelectedProducts(m.id, m.responseMeta.products).length}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => void handleApplySelectedProducts(m)}
                                    disabled={applyingSelectionMessageId === m.id || getSelectedProducts(m.id, m.responseMeta.products).length === 0}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-[10px] font-medium disabled:opacity-50"
                                    style={{ backgroundColor: "var(--color-primary)" }}
                                  >
                                    {applyingSelectionMessageId === m.id ? "Đang xử lý..." : <><CircleCheck size={10} /> Thêm vào giỏ</>}
                                  </button>
                                </div>
                                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-xs pt-1 border-t" style={{ borderColor: "#f0ebe3" }}>{m.content}</p>
                              </div>
                            ) : null}

                            {/* Confirm order */}
                            {confirmTarget?.messageId === m.id && (
                              <div
                                className="mt-2 rounded-xl border p-2.5 flex flex-col gap-1.5"
                                style={{ borderColor: "#f3d7ad", backgroundColor: "#fffcf5" }}
                              >
                                <div className="flex items-center gap-1.5">
                                  <CircleCheck size={13} style={{ color: "#b07d2a" }} />
                                  <p className="text-[11px] font-semibold" style={{ color: "#7a5b29" }}>Xác nhận tạo đơn</p>
                                </div>
                                {(() => {
                                  const previews = confirmTarget.previews?.length ? confirmTarget.previews : confirmTarget.preview ? [confirmTarget.preview] : []
                                  if (!previews.length) return null
                                  return (
                                    <div className="rounded-lg border p-1.5 flex flex-col gap-1.5" style={{ borderColor: "#efddbf", backgroundColor: "white" }}>
                                      {previews.map((item, idx) => (
                                        <div key={`${item.id}-${idx}`} className="flex items-center gap-1.5">
                                          <div className="size-8 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                            {item.imageUrl ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                                            ) : (
                                              <div className="size-full flex items-center justify-center"><ShoppingBag size={10} className="text-gray-300" /></div>
                                            )}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-medium truncate" style={{ color: "#3d3d3d" }}>{item.name}</p>
                                            <p className="text-[10px]" style={{ color: "#8a6a36" }}>SL: {item.quantity} · {formatPrice(item.basePrice)}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )
                                })()}
                                {effectiveAddress && (
                                  <div>
                                    <div className="flex items-start gap-1" style={{ color: "#7a5b29" }}>
                                      <MapPin size={10} className="mt-0.5 shrink-0" />
                                      <p className="text-[10px] leading-snug">
                                        {effectiveAddress.fullName} — {effectiveAddress.addressLine1}, {effectiveAddress.city}
                                      </p>
                                    </div>
                                    <button type="button" onClick={() => setShowAddressPicker((v) => !v)}
                                      className="flex items-center gap-0.5 text-[10px] font-medium mt-0.5" style={{ color: "var(--color-primary)" }}>
                                      <ChevronDown size={10} className={showAddressPicker ? "rotate-180" : ""} />
                                      {showAddressPicker ? "Ẩn" : "Đổi địa chỉ"}
                                    </button>
                                  </div>
                                )}
                                {!effectiveAddress && (
                                  <p className="text-[10px]" style={{ color: "#9b6a20" }}>
                                    Chưa có địa chỉ.{" "}
                                    <button type="button" onClick={() => setShowAddressModal(true)} className="underline font-medium" style={{ color: "var(--color-primary)" }}>
                                      Thêm ngay
                                    </button>
                                  </p>
                                )}
                                {showAddressPicker && addresses.length > 0 && (
                                  <select value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}
                                    className="w-full h-7 rounded-lg border px-2 text-[10px] bg-white" style={{ borderColor: "#e3d3b7" }}>
                                    {addresses.map((a) => (
                                      <option key={a.id} value={a.id}>
                                        {a.fullName} — {a.addressLine1}, {a.city}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                {/* Payment method selection */}
                                <div className="flex flex-col gap-1">
                                  <p className="text-[10px] font-semibold" style={{ color: "#7a5b29" }}>
                                    Phương thức thanh toán
                                  </p>
                                  <div className="flex gap-1.5">
                                    {PAYMENT_METHODS.map((pm) => {
                                      const active = paymentMethod === pm.id
                                      return (
                                        <button
                                          key={pm.id}
                                          type="button"
                                          onClick={() => setPaymentMethod(pm.id)}
                                          className="flex items-center gap-1.5 flex-1 rounded-lg border px-2 py-1.5 transition-colors"
                                          style={{
                                            borderColor: active ? "var(--color-primary)" : "#e0d2c2",
                                            backgroundColor: active ? "rgba(236,127,19,0.08)" : "white",
                                          }}
                                        >
                                          <div className="size-5 rounded overflow-hidden border bg-white shrink-0" style={{ borderColor: "#e8ddd1" }}>
                                            <Image src={pm.logo} alt={pm.label} width={20} height={20} className="size-full object-contain" />
                                          </div>
                                          <span className="text-[10px] font-semibold" style={{ color: active ? "var(--color-primary)" : "#5a4a3a" }}>
                                            {pm.label}
                                          </span>
                                          {active && <Check size={9} className="ml-auto shrink-0" style={{ color: "var(--color-primary)" }} />}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <button type="button" onClick={handleConfirmOrder} disabled={orderLoading}
                                    className="flex-1 py-1.5 rounded-lg text-white text-[10px] font-semibold disabled:opacity-50"
                                    style={{ backgroundColor: "var(--color-primary)" }}>
                                    {orderLoading ? "Đang xử lý..." : "Đặt hàng & Thanh toán"}
                                  </button>
                                  <button type="button" onClick={handleRejectOrder} disabled={orderLoading}
                                    className="flex-1 py-1.5 rounded-lg border text-[10px]"
                                    style={{ borderColor: "#d9cdc0", color: "var(--color-text-secondary)" }}>
                                    Huỷ
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          {m.createdAt && (
                            <span className="text-[10px] text-muted-foreground px-1">{formatTime(m.createdAt)}</span>
                          )}
                        </div>
                        {m.role === "user" && (
                          <div className="size-6 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-semibold"
                            style={{ backgroundColor: "#b07d2a" }}>
                            B
                          </div>
                        )}
                      </div>
                    ))}
                    {sending && (
                      <div className="flex gap-2 justify-start w-full min-w-0 max-w-full">
                        <ShopioAvatar size="xs" />
                        <div className="rounded-2xl rounded-bl-sm bg-white border min-w-0 max-w-[85%]" style={{ borderColor: "#e8e0d6" }}>
                          <TypingDots />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t px-3 py-2.5 shrink-0" style={{ borderColor: "#e5ded6", background: "white" }}>
                <div
                  className="flex items-center gap-2 rounded-xl border px-3 py-1.5"
                  style={{ borderColor: "#d9cdc0" }}
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend() }
                    }}
                    placeholder="Nhập nhu cầu mua sắm..."
                    className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-gray-400"
                    style={{ color: "var(--color-text-main)" }}
                    disabled={sending || !sessionId || bootLoading}
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={sending || !input.trim() || !sessionId || bootLoading}
                    className="flex items-center justify-center size-7 rounded-lg text-white disabled:opacity-40 transition-opacity"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>
              </div>
              )}
            </>
        </div>
      )}
      {quickViewProductId && (
        <ProductQuickViewModal productId={quickViewProductId} onClose={() => setQuickViewProductId(null)} />
      )}
    </>
  )
}
