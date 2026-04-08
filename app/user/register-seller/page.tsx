/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  ShopDocumentInput,
  UserProfileResponse,
} from "@/types/profile";
import { createClient } from "@/lib/supabase";

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

type Step = 1 | 2 | 3 | 4;

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

type DocSlot = {
  docType: string;
  label: string;
  required: boolean;
  hint: string;
};

type DocFile = {
  file: File;
  previewUrl: string;
  uploaded: boolean;
  fileUrl: string;
};

const STEP_LABELS: Record<Step, string> = {
  1: "Thông tin shop",
  2: "Địa chỉ lấy hàng",
  3: "Hồ sơ doanh nghiệp",
  4: "Xác minh danh tính",
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

const DOC_SLOTS_BASE: DocSlot[] = [
  {
    docType: "cccd_front",
    label: "CCCD / CMND mặt trước",
    required: true,
    hint: "Ảnh rõ ràng, không bị che khuất",
  },
  {
    docType: "cccd_back",
    label: "CCCD / CMND mặt sau",
    required: true,
    hint: "Ảnh rõ ràng, không bị che khuất",
  },
];

const DOC_SLOT_BUSINESS: DocSlot = {
  docType: "business_license",
  label: "Giấy phép kinh doanh",
  required: true,
  hint: "Bắt buộc với hộ kinh doanh và công ty",
};

function getDocSlots(businessType: string): DocSlot[] {
  const slots = [...DOC_SLOTS_BASE];
  if (businessType === "company" || businessType === "household") {
    slots.push(DOC_SLOT_BUSINESS);
  }
  return slots;
}

export default function RegisterSellerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [form, setForm] = useState<SellerFormState>(INITIAL_FORM);
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  const [loadingLocations, setLoadingLocations] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Document uploads state: map docType → DocFile
  const [docFiles, setDocFiles] = useState<Record<string, DocFile>>({});
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>(
    {},
  );
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const docSlots = useMemo(
    () => getDocSlots(form.businessType),
    [form.businessType],
  );

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
    setForm((prev) => ({ ...prev, districtId: value, wardCode: "" }));
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

  // ── File pick ──────────────────────────────────────────────────────────────
  const handleDocFilePick = (docType: string, file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Chỉ hỗ trợ ảnh JPEG, PNG, WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5 MB");
      return;
    }
    // Revoke previous preview if any
    const prev = docFiles[docType];
    if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);

    setDocFiles((d) => ({
      ...d,
      [docType]: {
        file,
        previewUrl: URL.createObjectURL(file),
        uploaded: false,
        fileUrl: "",
      },
    }));
  };

  // ── Upload single doc to Supabase Storage ─────────────────────────────────
  const uploadDoc = async (
    docType: string,
    userId: string,
  ): Promise<string> => {
    const doc = docFiles[docType];
    if (!doc) throw new Error(`Chưa chọn file cho ${docType}`);
    if (doc.uploaded) return doc.fileUrl;

    setUploadingDocs((u) => ({ ...u, [docType]: true }));
    try {
      const ext = doc.file.type.split("/")[1] ?? "jpg";
      const path = `shop-docs/${userId}/${Date.now()}_${docType}.${ext}`;
      const { error } = await supabase.storage
        .from("image")
        .upload(path, doc.file, { upsert: true, cacheControl: "0" });
      if (error) throw error;

      const { data: pub } = supabase.storage.from("image").getPublicUrl(path);
      const fileUrl = pub.publicUrl;

      setDocFiles((d) => ({
        ...d,
        [docType]: { ...d[docType], uploaded: true, fileUrl },
      }));
      return fileUrl;
    } finally {
      setUploadingDocs((u) => ({ ...u, [docType]: false }));
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────────
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
    if (targetStep === 4) {
      const required = docSlots.filter((s) => s.required);
      for (const slot of required) {
        if (!docFiles[slot.docType]) {
          toast.error(`Vui lòng tải lên: ${slot.label}`);
          return false;
        }
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    if (step < 4) setStep((prev) => (prev + 1) as Step);
  };

  const prevStep = () => {
    if (step > 1) setStep((prev) => (prev - 1) as Step);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(4)) return;

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

    const userId = profile?.id;
    if (!userId) {
      toast.error("Không xác định được tài khoản");
      return;
    }

    try {
      setSubmitting(true);

      // Upload tất cả docs chưa upload
      const documents: ShopDocumentInput[] = [];
      for (const slot of docSlots) {
        if (!docFiles[slot.docType]) continue;
        const fileUrl = await uploadDoc(slot.docType, userId);
        documents.push({ docType: slot.docType, fileUrl });
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
        documents,
      };

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

  // ── Loading / guard ────────────────────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Card className="border" style={{ borderColor: "#e5ded6" }}>
      <CardHeader>
        <CardTitle>Đăng ký trở thành Seller</CardTitle>
        <CardDescription>
          Hoàn tất 4 bước để gửi yêu cầu duyệt. Sau khi admin duyệt, hệ thống
          sẽ tự tạo cửa hàng GHN.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Step indicators */}
        <div className="flex flex-wrap gap-2">
          {([1, 2, 3, 4] as Step[]).map((n) => (
            <Badge key={n} variant={step === n ? "default" : "outline"}>
              Bước {n}: {STEP_LABELS[n]}
            </Badge>
          ))}
        </div>

        <Separator />

        {/* ── Step 1: Shop info ─────────────────────────────────────────── */}
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
                    <SelectValue placeholder="Chọn loại hình" />
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

        {/* ── Step 2: Address ───────────────────────────────────────────── */}
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
                  setForm((prev) => ({
                    ...prev,
                    addressLine: e.target.value,
                  }))
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

        {/* ── Step 3: Business info ─────────────────────────────────────── */}
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
          </div>
        )}

        {/* ── Step 4: Verification documents ───────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            {/* Info banner */}
            <div
              className="rounded-md border p-3 text-sm flex gap-2"
              style={{ borderColor: "#d4b896", backgroundColor: "#fdf8f3" }}
            >
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }}>
                info
              </span>
              <div style={{ color: "var(--color-text-main)" }}>
                <p className="font-medium">Hồ sơ xác minh danh tính</p>
                <p className="text-muted-foreground mt-0.5">
                  Ảnh được lưu trữ bảo mật và chỉ dùng để xét duyệt. Yêu cầu
                  ảnh rõ nét, đủ ánh sáng, không bị cắt xén.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {docSlots.map((slot) => {
                const doc = docFiles[slot.docType];
                const isUploading = uploadingDocs[slot.docType];
                return (
                  <DocUploadCard
                    key={slot.docType}
                    slot={slot}
                    doc={doc}
                    isUploading={isUploading}
                    inputRef={(el) => {
                      fileInputRefs.current[slot.docType] = el;
                    }}
                    onPickFile={(file) =>
                      handleDocFilePick(slot.docType, file)
                    }
                    onRemove={() => {
                      const prev = docFiles[slot.docType];
                      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
                      setDocFiles((d) => {
                        const copy = { ...d };
                        delete copy[slot.docType];
                        return copy;
                      });
                    }}
                  />
                );
              })}
            </div>

            {/* Summary */}
            <div
              className="rounded-md border p-3 text-sm"
              style={{ borderColor: "#e5ded6" }}
            >
              <p className="font-medium mb-2" style={{ color: "var(--color-text-main)" }}>
                Thông tin sẽ gửi:
              </p>
              <p className="text-muted-foreground">Shop: {form.shopName || "—"}</p>
              <p className="text-muted-foreground">Loại hình: {form.businessType}</p>
              <p className="text-muted-foreground">
                Địa chỉ GHN: {form.addressLine || "—"}
                {selectedWardName ? `, ${selectedWardName}` : ""}
                {selectedDistrictName ? `, ${selectedDistrictName}` : ""}
                {form.city ? `, ${form.city}` : ""}
              </p>
              <p className="text-muted-foreground mt-1">
                Tài liệu:{" "}
                {docSlots
                  .map((s) =>
                    docFiles[s.docType]
                      ? `✓ ${s.label}`
                      : `✗ ${s.label}${s.required ? " (bắt buộc)" : ""}`,
                  )
                  .join(" · ")}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between">
        <Button
          variant="outline"
          onClick={step === 1 ? () => router.push("/user/profile") : prevStep}
          disabled={submitting}
        >
          {step === 1 ? "Quay lại hồ sơ" : "Quay lại"}
        </Button>

        {step < 4 ? (
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

// ── DocUploadCard ────────────────────────────────────────────────────────────
interface DocUploadCardProps {
  slot: DocSlot;
  doc: DocFile | undefined;
  isUploading: boolean | undefined;
  inputRef: (el: HTMLInputElement | null) => void;
  onPickFile: (file: File) => void;
  onRemove: () => void;
}

function DocUploadCard({
  slot,
  doc,
  isUploading,
  inputRef,
  onPickFile,
  onRemove,
}: DocUploadCardProps) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: "#e5ded6" }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ backgroundColor: "#fdf8f3" }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--color-text-main)" }}>
          {slot.label}
          {slot.required && (
            <span className="ml-1 text-red-500 text-xs">*</span>
          )}
        </span>
        {doc && (
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-red-500 transition-colors"
            title="Xoá ảnh"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Preview / Drop zone */}
      {doc ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={doc.previewUrl}
            alt={slot.label}
            className="w-full h-36 object-cover"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs">Đang tải lên…</span>
            </div>
          )}
          {doc.uploaded && (
            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-0.5">
              <span className="material-symbols-outlined text-[14px]">check</span>
            </div>
          )}
        </div>
      ) : (
        <label
          className="flex flex-col items-center justify-center h-36 cursor-pointer hover:bg-muted/30 transition-colors gap-1"
          style={{ color: "var(--color-text-main)" }}
        >
          <span className="material-symbols-outlined text-[32px] text-muted-foreground">
            add_photo_alternate
          </span>
          <span className="text-xs text-muted-foreground text-center px-2">
            {slot.hint}
          </span>
          <span className="text-xs text-muted-foreground">
            JPEG · PNG · WEBP · tối đa 5 MB
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            ref={inputRef}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickFile(f);
              e.target.value = "";
            }}
          />
        </label>
      )}

      {/* Change button when already selected */}
      {doc && (
        <label
          className="flex items-center justify-center gap-1 py-1.5 text-xs cursor-pointer hover:bg-muted/30 transition-colors border-t"
          style={{ borderColor: "#e5ded6", color: "var(--color-primary)" }}
        >
          <span className="material-symbols-outlined text-[15px]">
            photo_camera
          </span>
          Đổi ảnh
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            ref={inputRef}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickFile(f);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}
