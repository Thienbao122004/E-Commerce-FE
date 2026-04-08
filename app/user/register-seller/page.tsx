/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { profileService } from "@/services/profile";
import {
  vietnamProvincesService,
  type District,
  type Province,
  type Ward,
} from "@/services/vietnam-provinces";
import type {
  RegisterSellerRequest,
  UserProfileResponse,
} from "@/types/profile";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type Step = 1 | 2 | 3;

type SellerFormState = {
  shopName: string;
  shopDescription: string;
  phone: string;
  addressLine: string;
  wardCode: string;
  districtId: string;
  provinceId: string;
  city: string;
  businessLicenseNumber: string;
  taxCode: string;
  businessType: RegisterSellerRequest["businessType"];
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
};

const STEP_LABELS: Record<Step, string> = {
  1: "Thông tin shop",
  2: "Địa chỉ lấy hàng",
  3: "Hồ sơ doanh nghiệp",
};

const INITIAL_FORM: SellerFormState = {
  shopName: "",
  shopDescription: "",
  phone: "",
  addressLine: "",
  wardCode: "",
  districtId: "",
  provinceId: "",
  city: "",
  businessLicenseNumber: "",
  taxCode: "",
  businessType: "individual",
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",
};

export default function RegisterSellerPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [form, setForm] = useState<SellerFormState>(INITIAL_FORM);
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  const [loadingLocations, setLoadingLocations] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadProfile(), loadProvinces()]);
    };

    init();
  }, []);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await profileService.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        setForm((prev) => ({
          ...prev,
          phone: prev.phone || res.data.phone || "",
        }));
      }
    } catch {
      toast.error("Không thể tải thông tin hồ sơ");
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadProvinces = async () => {
    try {
      setLoadingLocations(true);
      const data = await vietnamProvincesService.getProvinces();
      setProvinces(data);
    } catch {
      toast.error("Không thể tải danh sách tỉnh/thành phố GHN");
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleProvinceChange = async (value: string) => {
    const provinceId = Number(value);
    const selected = provinces.find((p) => p.code === provinceId);

    setForm((prev) => ({
      ...prev,
      provinceId: value,
      city: selected?.name ?? "",
      districtId: "",
      wardCode: "",
    }));

    setDistricts([]);
    setWards([]);

    if (!provinceId) return;

    try {
      setLoadingLocations(true);
      const data = await vietnamProvincesService.getDistricts(provinceId);
      setDistricts(data);
    } catch {
      toast.error("Không thể tải danh sách quận/huyện GHN");
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleDistrictChange = async (value: string) => {
    const districtId = Number(value);

    setForm((prev) => ({
      ...prev,
      districtId: value,
      wardCode: "",
    }));

    setWards([]);

    if (!districtId) return;

    try {
      setLoadingLocations(true);
      const data = await vietnamProvincesService.getWards(districtId);
      setWards(data);
    } catch {
      toast.error("Không thể tải danh sách phường/xã GHN");
    } finally {
      setLoadingLocations(false);
    }
  };

  const validateStep = (targetStep: Step): boolean => {
    if (targetStep === 1) {
      if (!form.shopName.trim()) {
        toast.error("Vui lòng nhập tên shop");
        return false;
      }
      if (!form.businessType) {
        toast.error("Vui lòng chọn loại hình kinh doanh");
        return false;
      }
    }

    if (targetStep === 2) {
      if (!form.phone.trim()) {
        toast.error("Vui lòng nhập số điện thoại shop");
        return false;
      }
      if (!form.addressLine.trim()) {
        toast.error("Vui lòng nhập địa chỉ lấy hàng");
        return false;
      }
      if (!form.provinceId) {
        toast.error("Vui lòng chọn tỉnh/thành phố");
        return false;
      }
      if (!form.districtId) {
        toast.error("Vui lòng chọn quận/huyện");
        return false;
      }
      if (!form.wardCode) {
        toast.error("Vui lòng chọn phường/xã");
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    if (step < 3) setStep((prev) => (prev + 1) as Step);
  };

  const prevStep = () => {
    if (step > 1) setStep((prev) => (prev - 1) as Step);
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return;

    const provinceId = Number(form.provinceId);
    const districtId = Number(form.districtId);

    if (!Number.isInteger(provinceId) || provinceId <= 0) {
      toast.error("Province không hợp lệ");
      return;
    }

    if (!Number.isInteger(districtId) || districtId <= 0) {
      toast.error("District không hợp lệ");
      return;
    }

    const payload: RegisterSellerRequest = {
      shopName: form.shopName.trim(),
      shopDescription: form.shopDescription.trim() || null,
      phone: form.phone.trim(),
      addressLine: form.addressLine.trim(),
      wardCode: form.wardCode,
      districtId,
      provinceId,
      city: form.city.trim(),
      businessLicenseNumber: form.businessLicenseNumber.trim() || null,
      taxCode: form.taxCode.trim() || null,
      businessType: form.businessType,
      bankName: form.bankName.trim() || null,
      bankAccountNumber: form.bankAccountNumber.trim() || null,
      bankAccountName: form.bankAccountName.trim() || null,
    };

    try {
      setSubmitting(true);
      const res = await profileService.registerSeller(payload);
      if (!res.success) {
        toast.error(res.message ?? "Đăng ký seller thất bại");
        return;
      }

      toast.success(
        res.message ?? "Đăng ký seller thành công, vui lòng chờ admin duyệt",
      );
      router.push("/user/profile");
    } catch (err: any) {
      toast.error(err.message ?? "Có lỗi xảy ra khi gửi đăng ký");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDistrictName = useMemo(
    () => districts.find((d) => String(d.code) === form.districtId)?.name ?? "",
    [districts, form.districtId],
  );

  const selectedWardName = useMemo(
    () => wards.find((w) => w.code === form.wardCode)?.name ?? "",
    [wards, form.wardCode],
  );

  if (loadingProfile) {
    return (
      <Card className="border" style={{ borderColor: "#e5ded6" }}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-72 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile || profile.role !== "customer" || profile.shop) {
    return (
      <Card className="border" style={{ borderColor: "#e5ded6" }}>
        <CardHeader>
          <CardTitle>Đăng ký Seller</CardTitle>
          <CardDescription>
            Tài khoản hiện tại không cần thực hiện đăng ký seller mới.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild style={{ backgroundColor: "var(--color-primary)" }}>
            <Link href="/user/profile">Quay lại hồ sơ</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border" style={{ borderColor: "#e5ded6" }}>
      <CardHeader>
        <CardTitle>Đăng ký trở thành Seller</CardTitle>
        <CardDescription>
          Hoàn tất 3 bước để gửi yêu cầu duyệt. Sau khi admin duyệt, hệ thống sẽ
          tự tạo cửa hàng GHN.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((n) => (
            <Badge key={n} variant={step === n ? "default" : "outline"}>
              Bước {n}: {STEP_LABELS[n as Step]}
            </Badge>
          ))}
        </div>

        <Separator />

        {step === 1 && (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="shop-name">Tên shop *</Label>
                <Input
                  id="shop-name"
                  value={form.shopName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, shopName: e.target.value }))
                  }
                  placeholder="Ví dụ: Handmade Home"
                />
              </div>
              <div className="space-y-2 w-48">
                <Label htmlFor="business-type">Loại hình kinh doanh *</Label>
                <Select
                  value={form.businessType}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      businessType:
                        value as RegisterSellerRequest["businessType"],
                    }))
                  }
                >
                  <SelectTrigger id="business-type" className="w-full">
                    <SelectValue placeholder="Chọn loại hình kinh doanh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Cá nhân</SelectItem>
                    <SelectItem value="household">Hộ kinh doanh</SelectItem>
                    <SelectItem value="company">Công ty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shop-description">Mô tả shop</Label>
              <Textarea
                id="shop-description"
                value={form.shopDescription}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    shopDescription: e.target.value,
                  }))
                }
                placeholder="Mô tả ngắn về sản phẩm và thế mạnh của shop"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shop-phone">Số điện thoại shop *</Label>
              <Input
                id="shop-phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="09xxxxxxxx"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address-line">Địa chỉ lấy hàng *</Label>
              <Input
                id="address-line"
                value={form.addressLine}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, addressLine: e.target.value }))
                }
                placeholder="Số nhà, tên đường"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Tỉnh/Thành phố *</Label>
              <Select
                value={form.provinceId}
                onValueChange={handleProvinceChange}
                disabled={loadingLocations}
              >
                <SelectTrigger id="province" className="w-full">
                  <SelectValue placeholder="Chọn Tỉnh/Thành phố" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem
                      key={province.code}
                      value={String(province.code)}
                    >
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">Quận/Huyện *</Label>
              <Select
                value={form.districtId}
                onValueChange={handleDistrictChange}
                disabled={!form.provinceId || loadingLocations}
              >
                <SelectTrigger id="district" className="w-full">
                  <SelectValue placeholder="Chọn Quận/Huyện" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem
                      key={district.code}
                      value={String(district.code)}
                    >
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ward">Phường/Xã *</Label>
              <Select
                value={form.wardCode}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, wardCode: value }))
                }
                disabled={!form.districtId || loadingLocations}
              >
                <SelectTrigger id="ward" className="w-full">
                  <SelectValue placeholder="Chọn Phường/Xã" />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((ward) => (
                    <SelectItem key={ward.code} value={ward.code}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Thành phố</Label>
              <Input
                id="city"
                value={form.city}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="license">Số giấy phép kinh doanh</Label>
              <Input
                id="license"
                value={form.businessLicenseNumber}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    businessLicenseNumber: e.target.value,
                  }))
                }
                placeholder="Tùy chọn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax-code">Mã số thuế</Label>
              <Input
                id="tax-code"
                value={form.taxCode}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, taxCode: e.target.value }))
                }
                placeholder="Tùy chọn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank-name">Ngân hàng</Label>
              <Input
                id="bank-name"
                value={form.bankName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bankName: e.target.value }))
                }
                placeholder="Tùy chọn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank-number">Số tài khoản</Label>
              <Input
                id="bank-number"
                value={form.bankAccountNumber}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    bankAccountNumber: e.target.value,
                  }))
                }
                placeholder="Tùy chọn"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bank-owner">Tên chủ tài khoản</Label>
              <Input
                id="bank-owner"
                value={form.bankAccountName}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    bankAccountName: e.target.value,
                  }))
                }
                placeholder="Tùy chọn"
              />
            </div>

            <div
              className="md:col-span-2 rounded-md border p-3 text-sm"
              style={{ borderColor: "#e5ded6" }}
            >
              <p
                className="font-medium mb-2"
                style={{ color: "var(--color-text-main)" }}
              >
                Thông tin sẽ gửi:
              </p>
              <p className="text-muted-foreground">
                Shop: {form.shopName || "—"}
              </p>
              <p className="text-muted-foreground">
                Loại hình: {form.businessType}
              </p>
              <p className="text-muted-foreground">
                Địa chỉ GHN: {form.addressLine || "—"}
                {selectedWardName ? `, ${selectedWardName}` : ""}
                {selectedDistrictName ? `, ${selectedDistrictName}` : ""}
                {form.city ? `, ${form.city}` : ""}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between">
        <Button
          variant="outline"
          onClick={step === 1 ? () => router.push("/user/profile") : prevStep}
        >
          {step === 1 ? "Quay lại hồ sơ" : "Quay lại"}
        </Button>

        {step < 3 ? (
          <Button
            onClick={nextStep}
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Tiếp tục
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {submitting ? "Đang gửi..." : "Gửi yêu cầu duyệt"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
