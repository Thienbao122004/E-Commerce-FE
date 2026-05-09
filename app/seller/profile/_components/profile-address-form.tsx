"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  IconMapPin,
  IconLoader2,
  IconDeviceFloppy,
  IconAlertTriangle,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { vietnamProvincesService } from "@/services/vietnam-provinces"
import {
  isVietnamPhoneLocal,
  normalizeVietnamPhone,
} from "@/lib/phone-vn"
import type { Province, District, Ward } from "@/types/vietnam-provinces"
import type {
  SellerShopInfo,
  UpdateShopPayload,
} from "@/types/seller-dashboard"

type Props = {
  shop: SellerShopInfo | null
  loading: boolean
  saving: boolean
  onSave: (dto: UpdateShopPayload) => Promise<boolean>
}

function FormSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b">
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent className="grid gap-5 pt-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid gap-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ProfileAddressForm({ shop, loading, saving, onSave }: Props) {
  const [phone, setPhone] = useState("")
  const [addressLine, setAddressLine] = useState("")
  const [provinceId, setProvinceId] = useState<string>("")
  const [districtId, setDistrictId] = useState<string>("")
  const [wardCode, setWardCode] = useState<string>("")

  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])

  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)

  // Tránh reset district / ward khi tự động khởi tạo theo dữ liệu shop ban đầu.
  const hydratedRef = useRef(false)

  useEffect(() => {
    let mounted = true
    setLoadingProvinces(true)
    vietnamProvincesService
      .getProvinces()
      .then((data) => {
        if (mounted) setProvinces(data)
      })
      .catch(() => {
        if (mounted) toast.error("Không thể tải danh sách tỉnh/thành phố")
      })
      .finally(() => {
        if (mounted) setLoadingProvinces(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  // Khởi tạo dữ liệu form từ shop (chạy 1 lần khi shop có giá trị).
  useEffect(() => {
    if (!shop || hydratedRef.current) return
    hydratedRef.current = true

    setPhone(normalizeVietnamPhone(shop.phone) || "")
    setAddressLine(shop.addressLine ?? "")

    const initProvinceId = shop.provinceId ? String(shop.provinceId) : ""
    const initDistrictId = shop.districtId ? String(shop.districtId) : ""
    const initWardCode = shop.wardCode ?? ""

    setProvinceId(initProvinceId)
    setDistrictId(initDistrictId)
    setWardCode(initWardCode)

    // Tải dropdown phụ thuộc theo dữ liệu sẵn có.
    const init = async () => {
      try {
        if (shop.provinceId) {
          setLoadingDistricts(true)
          const ds = await vietnamProvincesService.getDistricts(shop.provinceId)
          setDistricts(ds)
        }
        if (shop.districtId) {
          setLoadingWards(true)
          const ws = await vietnamProvincesService.getWards(shop.districtId)
          setWards(ws)
        }
      } catch {
        toast.error("Không thể tải dữ liệu địa chỉ")
      } finally {
        setLoadingDistricts(false)
        setLoadingWards(false)
      }
    }
    void init()
  }, [shop])

  const handleProvinceChange = async (value: string) => {
    setProvinceId(value)
    setDistrictId("")
    setWardCode("")
    setDistricts([])
    setWards([])
    if (!value) return
    try {
      setLoadingDistricts(true)
      const data = await vietnamProvincesService.getDistricts(Number(value))
      setDistricts(data)
    } catch {
      toast.error("Không thể tải danh sách quận/huyện")
    } finally {
      setLoadingDistricts(false)
    }
  }

  const handleDistrictChange = async (value: string) => {
    setDistrictId(value)
    setWardCode("")
    setWards([])
    if (!value) return
    try {
      setLoadingWards(true)
      const data = await vietnamProvincesService.getWards(Number(value))
      setWards(data)
    } catch {
      toast.error("Không thể tải danh sách phường/xã")
    } finally {
      setLoadingWards(false)
    }
  }

  const provinceName = useMemo(
    () => provinces.find((p) => String(p.code) === provinceId)?.name ?? "",
    [provinces, provinceId]
  )

  const hasChanges = useMemo(() => {
    if (!shop) return false
    const initialPhone = normalizeVietnamPhone(shop.phone) || ""
    const initialProvince = shop.provinceId ? String(shop.provinceId) : ""
    const initialDistrict = shop.districtId ? String(shop.districtId) : ""
    const initialWard = shop.wardCode ?? ""
    return (
      phone !== initialPhone ||
      (addressLine ?? "") !== (shop.addressLine ?? "") ||
      provinceId !== initialProvince ||
      districtId !== initialDistrict ||
      wardCode !== initialWard
    )
  }, [shop, phone, addressLine, provinceId, districtId, wardCode])

  // Đổi quận/huyện hoặc tỉnh khác sẽ làm GHN shop ID hiện tại không còn map đúng
  // → hiển thị cảnh báo cho seller biết phí ship có thể bị ảnh hưởng.
  const districtChanged = useMemo(() => {
    if (!shop) return false
    return shop.districtId != null && districtId !== String(shop.districtId)
  }, [shop, districtId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop) return
    if (!hasChanges) return

    if (!addressLine.trim()) {
      toast.error("Vui lòng nhập địa chỉ chi tiết")
      return
    }
    if (!provinceId || !districtId || !wardCode) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã")
      return
    }

    const phoneNorm = normalizeVietnamPhone(phone)
    if (phone.trim() && !isVietnamPhoneLocal(phoneNorm)) {
      toast.error("Số điện thoại không hợp lệ (đầu 0, 10–11 số)")
      return
    }

    const dto: UpdateShopPayload = {}
    if (phoneNorm !== (normalizeVietnamPhone(shop.phone) || ""))
      dto.phone = phoneNorm
    if ((addressLine ?? "") !== (shop.addressLine ?? ""))
      dto.addressLine = addressLine.trim()
    if (provinceId !== String(shop.provinceId ?? "")) {
      dto.provinceId = Number(provinceId)
      dto.city = provinceName
    }
    if (districtId !== String(shop.districtId ?? ""))
      dto.districtId = Number(districtId)
    if (wardCode !== (shop.wardCode ?? ""))
      dto.wardCode = wardCode

    if (Object.keys(dto).length === 0) return
    await onSave(dto)
  }

  if (loading) return <FormSkeleton />

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-muted">
            <IconMapPin className="size-3.5 text-muted-foreground" />
          </div>
          Địa chỉ &amp; liên hệ cửa hàng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="shop-phone" className="text-xs font-medium">
              Số điện thoại liên hệ
            </Label>
            <Input
              id="shop-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901 234 567"
              maxLength={11}
              className="text-sm"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address-line" className="text-xs font-medium">
              Địa chỉ chi tiết
            </Label>
            <Input
              id="address-line"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="Số nhà, tên đường"
              maxLength={500}
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="province" className="text-xs font-medium">
                Tỉnh/Thành phố
              </Label>
              <Select
                value={provinceId}
                onValueChange={handleProvinceChange}
                disabled={loadingProvinces}
              >
                <SelectTrigger id="province" className="w-full text-sm">
                  <SelectValue placeholder="Chọn Tỉnh/Thành" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p.code} value={String(p.code)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="district" className="text-xs font-medium">
                Quận/Huyện
              </Label>
              <Select
                value={districtId}
                onValueChange={handleDistrictChange}
                disabled={!provinceId || loadingDistricts}
              >
                <SelectTrigger id="district" className="w-full text-sm">
                  <SelectValue placeholder="Chọn Quận/Huyện" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.code} value={String(d.code)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ward" className="text-xs font-medium">
                Phường/Xã
              </Label>
              <Select
                value={wardCode}
                onValueChange={setWardCode}
                disabled={!districtId || loadingWards}
              >
                <SelectTrigger id="ward" className="w-full text-sm">
                  <SelectValue placeholder="Chọn Phường/Xã" />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((w) => (
                    <SelectItem key={w.code} value={w.code}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {districtChanged && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
              <IconAlertTriangle className="size-4 shrink-0" />
              <p>
                Đổi Quận/Huyện sẽ thay đổi điểm lấy hàng và có thể ảnh hưởng đến
                phí vận chuyển GHN. Hãy kiểm tra lại đơn đang chuẩn bị giao.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={saving || !hasChanges}
              className="min-w-[160px]"
            >
              {saving ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <IconDeviceFloppy className="mr-2 size-4" />
                  Lưu địa chỉ
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
