/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { profileService } from "@/services/profile";
import { vietnamProvincesService } from "@/services/vietnam-provinces";
import { recognizeVietnamIdCard, type VnmIdOcrData } from "@/services/vnm-id-ocr";
import type {
  RegisterSellerRequest,
  SellerIdentityInfo,
  ShopDocumentInput,
  UserProfileResponse,
} from "@/types/profile";
import type { Province, District, Ward } from "@/types/vietnam-provinces";
import { createClient } from "@/lib/supabase";
import { isVietnamPhoneLocal, normalizeVietnamPhone } from "@/lib/phone-vn";
import { cn } from "@/lib/utils";

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
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",
};

const DOC_SLOTS_BASE: DocSlot[] = [
  {
    docType: "cccd_front",
    label: "CCCD mặt trước",
    required: true,
    hint: "Bắt buộc — tối đa 5MB",
  },
  {
    docType: "cccd_back",
    label: "CCCD mặt sau",
    required: true,
    hint: "Bắt buộc — tối đa 5MB",
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

type IdCardFormState = {
  name: string;
  idNumber: string;
  dob: string;
  sex: string;
  nationality: string;
  home: string;
  address: string;
  addrProvince: string;
  addrDistrict: string;
  addrWard: string;
  addrStreet: string;
  doe: string;
  cardType: string;
  issueDate: string;
  issueLoc: string;
  religion: string;
  ethnicity: string;
  features: string;
};

const INITIAL_ID_CARD: IdCardFormState = {
  name: "",
  idNumber: "",
  dob: "",
  sex: "",
  nationality: "",
  home: "",
  address: "",
  addrProvince: "",
  addrDistrict: "",
  addrWard: "",
  addrStreet: "",
  doe: "",
  cardType: "",
  issueDate: "",
  issueLoc: "",
  religion: "",
  ethnicity: "",
  features: "",
};

function cleanOcrValue(v: string | null | undefined): string {
  if (v == null) return "";
  const t = String(v).trim();
  if (!t || t.toUpperCase() === "N/A") return "";
  return t;
}

function clearFrontOcrPart(prev: IdCardFormState): IdCardFormState {
  return {
    ...prev,
    name: "",
    idNumber: "",
    dob: "",
    sex: "",
    nationality: "",
    home: "",
    address: "",
    addrProvince: "",
    addrDistrict: "",
    addrWard: "",
    addrStreet: "",
    doe: "",
    cardType: "",
  };
}

function clearBackOcrPart(prev: IdCardFormState): IdCardFormState {
  return {
    ...prev,
    issueDate: "",
    issueLoc: "",
    religion: "",
    ethnicity: "",
    features: "",
  };
}

function mergeOcrIntoIdForm(prev: IdCardFormState, d: VnmIdOcrData): IdCardFormState {
  const n = { ...prev };
  const set = (k: keyof IdCardFormState, v: string | null | undefined) => {
    const t = cleanOcrValue(v);
    if (t) (n as Record<string, string>)[k] = t;
  };
  set("name", d.name);
  set("idNumber", d.id);
  set("dob", d.dob);
  set("sex", d.sex);
  set("nationality", d.nationality);
  set("home", d.home);
  set("address", d.address);
  if (d.addressEntities) {
    set("addrProvince", d.addressEntities.province);
    set("addrDistrict", d.addressEntities.district);
    set("addrWard", d.addressEntities.ward);
    set("addrStreet", d.addressEntities.street);
  }
  set("doe", d.doe);
  const tParts = [cleanOcrValue(d.type), cleanOcrValue(d.typeNew)].filter(Boolean);
  if (tParts.length) n.cardType = tParts.join(" · ");
  set("issueDate", d.issueDate);
  set("issueLoc", d.issueLoc);
  set("religion", d.religion);
  set("ethnicity", d.ethnicity);
  set("features", d.features);
  return n;
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
  const [ocrLoadingFront, setOcrLoadingFront] = useState(false);
  const [ocrLoadingBack, setOcrLoadingBack] = useState(false);
  const [ocrAnalyzing, setOcrAnalyzing] = useState(false);
  const [idCardForm, setIdCardForm] = useState<IdCardFormState>(INITIAL_ID_CARD);

  // Document uploads state: map docType → DocFile
  const [docFiles, setDocFiles] = useState<Record<string, DocFile>>({});
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>(
    {},
  );
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const docSlots = useMemo(() => getDocSlots("individual"), []);

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
          phone: prev.phone || normalizeVietnamPhone(res.data.phone) || "",
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
    if (docType === "cccd_front") {
      setIdCardForm((p) => clearFrontOcrPart(p));
    } else if (docType === "cccd_back") {
      setIdCardForm((p) => clearBackOcrPart(p));
    }
  };

  const analyzeIdCards = async () => {
    const front = docFiles.cccd_front?.file;
    const back = docFiles.cccd_back?.file;
    if (!front && !back) {
      toast.error("Vui lòng chọn ảnh mặt trước và/hoặc mặt sau, rồi bấm phân tích");
      return;
    }
    setOcrAnalyzing(true);
    try {
      if (front) {
        await runCccdOcr("front", front, { skipSuccessToast: true });
      }
      if (back) {
        await runCccdOcr("back", back, { skipSuccessToast: true });
      }
      toast.success("Đã phân tích xong — vui lòng kiểm tra lại nội dung form");
    } finally {
      setOcrAnalyzing(false);
    }
  };

  const runCccdOcr = async (
    side: "front" | "back",
    file: File,
    opts?: { skipSuccessToast?: boolean },
  ) => {
    if (side === "front") {
      setOcrLoadingFront(true);
      setIdCardForm((p) => clearFrontOcrPart(p));
    } else {
      setOcrLoadingBack(true);
      setIdCardForm((p) => clearBackOcrPart(p));
    }
    try {
      const res = await recognizeVietnamIdCard(file);
      if (!res.success || !res.data) {
        toast.error(res.message ?? "Không đọc được thông tin từ ảnh");
        return;
      }
      const d = res.data;
      setIdCardForm((prev) => mergeOcrIntoIdForm(prev, d));
      if (d.address && side === "front") {
        setForm((prev) => ({
          ...prev,
          addressLine: prev.addressLine.trim() ? prev.addressLine : d.address!,
        }));
      }
      if (!opts?.skipSuccessToast) {
        toast.success(
          side === "front"
            ? "Đã điền thông tin từ mặt trước (kiểm tra lại nội dung)"
            : "Đã điền thông tin từ mặt sau (kiểm tra lại nội dung)",
        );
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Lỗi khi gọi dịch vụ đọc CCCD");
    } finally {
      if (side === "front") setOcrLoadingFront(false);
      else setOcrLoadingBack(false);
    }
  };

  const applyOcrNameToProfile = async () => {
    const name = idCardForm.name.trim();
    if (!name) return;
    try {
      const r = await profileService.updateProfile({ fullName: name });
      if (r.success) {
        setProfile((p) => (p ? { ...p, fullName: name } : p));
        toast.success("Đã cập nhật họ tên tài khoản theo CCCD");
      } else {
        toast.error(r.message ?? "Cập nhật thất bại");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Cập nhật thất bại");
    }
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
      if (!form.phone.trim()) {
        toast.error("Vui lòng nhập số điện thoại shop");
        return false;
      }
      if (!isVietnamPhoneLocal(normalizeVietnamPhone(form.phone))) {
        toast.error("Số điện thoại shop không hợp lệ (dùng đầu 0, 10–11 số)");
        return false;
      }
    }
    if (targetStep === 2) {
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
      if (!idCardForm.name.trim()) {
        toast.error('Vui lòng phân tích mặt trước CCCD để có họ tên (bấm nút "Phân tích căn cước")');
        return false;
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

      const fileDocTypes = new Set(["business_license", "tax_cert"]);
      const documents: ShopDocumentInput[] = [];
      for (const slot of docSlots) {
        if (!fileDocTypes.has(slot.docType)) continue;
        if (!docFiles[slot.docType]) continue;
        const fileUrl = await uploadDoc(slot.docType, userId);
        documents.push({ docType: slot.docType, fileUrl });
      }

      const identity: SellerIdentityInfo = {
        fullName: idCardForm.name.trim(),
        idNumber: idCardForm.idNumber.trim() || null,
        dateOfBirth: idCardForm.dob.trim() || null,
        sex: idCardForm.sex.trim() || null,
        nationality: idCardForm.nationality.trim() || null,
        homeTown: idCardForm.home.trim() || null,
        permanentAddress: idCardForm.address.trim() || null,
        addrProvince: idCardForm.addrProvince.trim() || null,
        addrDistrict: idCardForm.addrDistrict.trim() || null,
        addrWard: idCardForm.addrWard.trim() || null,
        addrStreet: idCardForm.addrStreet.trim() || null,
        dateOfExpiry: idCardForm.doe.trim() || null,
        cardType: idCardForm.cardType.trim() || null,
        issueDate: idCardForm.issueDate.trim() || null,
        issuePlace: idCardForm.issueLoc.trim() || null,
        religion: idCardForm.religion.trim() || null,
        ethnicity: idCardForm.ethnicity.trim() || null,
        features: idCardForm.features.trim() || null,
      };

      const payload: RegisterSellerRequest = {
        shopName: form.shopName.trim(),
        shopDescription: form.shopDescription.trim() || null,
        phone: normalizeVietnamPhone(form.phone),
        addressLine: form.addressLine.trim(),
        wardCode: form.wardCode,
        districtId,
        provinceId,
        city: form.city.trim(),
        businessLicenseNumber: form.businessLicenseNumber.trim() || null,
        taxCode: form.taxCode.trim() || null,
        bankName: form.bankName.trim() || null,
        bankAccountNumber: form.bankAccountNumber.trim() || null,
        bankAccountName: form.bankAccountName.trim() || null,
        identity,
        documents: documents.length ? documents : undefined,
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
      <Card className="border rounded" style={{ borderColor: "#e5ded6" }}>
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

  // Đã là seller / admin
  if (!profile || profile.role === "seller" || profile.role === "admin") {
    return (
      <Card className="border" style={{ borderColor: "#e5ded6" }}>
        <CardHeader>
          <CardTitle>Đăng ký Seller</CardTitle>
          <CardDescription>Tài khoản của bạn đã có quyền Seller hoặc Admin.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild style={{ backgroundColor: "var(--color-primary)" }}>
            <Link href="/user/profile">Quay lại hồ sơ</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Đang chờ duyệt
  if (profile.shop && (profile.shop as any).verificationStatus === 0) {
    return (
      <Card className="border" style={{ borderColor: "#e5ded6" }}>
        <CardHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-amber-600">hourglass_top</span>
            </div>
            <div>
              <CardTitle>Đang chờ xét duyệt</CardTitle>
              <CardDescription className="mt-0.5">
                Đơn đăng ký của bạn đã được gửi và đang chờ admin phê duyệt.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border p-3 text-sm text-muted-foreground" style={{ borderColor: "#e5ded6" }}>
            <p>Tên shop: <span className="font-medium text-foreground">{(profile.shop as any).name ?? "—"}</span></p>
            <p className="mt-1">Bạn sẽ nhận được thông báo khi có kết quả.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline">
            <Link href="/user/profile">Quay lại hồ sơ</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Bị từ chối → cho phép đăng ký lại
  if (profile.shop && (profile.shop as any).verificationStatus === 2) {
    const reason = (profile.shop as any).rejectionReason as string | null | undefined;
    return (
      <Card className="border" style={{ borderColor: "#e5ded6" }}>
        <CardHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-red-600">cancel</span>
            </div>
            <div>
              <CardTitle>Đơn đăng ký bị từ chối</CardTitle>
              <CardDescription className="mt-0.5">
                Admin đã từ chối đơn đăng ký seller của bạn.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {reason && (
            <div className="rounded-md border p-3 text-sm" style={{ borderColor: "#fca5a5", backgroundColor: "#fff5f5" }}>
              <p className="font-medium text-red-700 mb-1">Lý do từ chối:</p>
              <p className="text-red-600">{reason}</p>
            </div>
          )}
          <div className="rounded-md border p-3 text-sm text-muted-foreground" style={{ borderColor: "#e5ded6" }}>
            <p>Bạn có thể chỉnh sửa thông tin và gửi lại đơn đăng ký.</p>
          </div>
        </CardContent>
        <CardFooter className="gap-3">
          <Button asChild variant="outline">
            <Link href="/user/profile">Quay lại hồ sơ</Link>
          </Button>
          <Button
            onClick={() => {
              // Xóa guard bằng cách patch profile.shop về null tạm thời
              setProfile((prev) => prev ? { ...prev, shop: null } : prev);
              setStep(1);
            }}
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Đăng ký lại
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Đã approved nhưng role vẫn là customer (chờ re-login) → handled by profile page banner
  // Trường hợp shop tồn tại nhưng không phải 3 case trên
  if (profile.shop) {
    return (
      <Card className="border" style={{ borderColor: "#e5ded6" }}>
        <CardHeader>
          <CardTitle>Đăng ký Seller</CardTitle>
          <CardDescription>Tài khoản hiện tại không cần thực hiện đăng ký seller mới.</CardDescription>
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
    <Card className="border rounded" style={{ borderColor: "#e5ded6" }}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-3">
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
                  Chọn ảnh mặt trước/mặt sau, sau đó bấm <strong>Phân tích căn cước</strong>
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
                      if (slot.docType === "cccd_front") {
                        setIdCardForm((p) => clearFrontOcrPart(p));
                      }
                      if (slot.docType === "cccd_back") {
                        setIdCardForm((p) => clearBackOcrPart(p));
                      }
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

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={analyzeIdCards}
                disabled={
                  ocrAnalyzing ||
                  ocrLoadingFront ||
                  ocrLoadingBack ||
                  (!docFiles.cccd_front?.file && !docFiles.cccd_back?.file)
                }
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {ocrAnalyzing || ocrLoadingFront || ocrLoadingBack
                  ? "Đang phân tích…"
                  : "Phân tích căn cước"}
              </Button>
              <p className="text-xs text-muted-foreground max-w-md">
                Gọi sau khi đã chọn ảnh. Có cả mặt trước và mặt sau sẽ đọc mặt trước, mặt sau.
              </p>
            </div>

            {/* Form thông tin CCCD — chỉ đọc, điền từ phân tích AI */}
            <div
              className="rounded-lg border p-4 space-y-4"
              style={{ borderColor: "#e5ded6", backgroundColor: "#fafafa" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-main)" }}>
                  Thông tin trên CCCD/CMND (chỉ xem — không chỉnh sửa)
                </p>
                {idCardForm.name.trim().length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyOcrNameToProfile}
                    disabled={ocrAnalyzing}
                  >
                    Ghi họ tên vào tài khoản
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Mặt trước
                  {ocrLoadingFront && (
                    <span className="ml-2 text-amber-600 normal-case">— Đang đọc ảnh…</span>
                  )}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <IdField
                    label="Họ và tên"
                    value={idCardForm.name}
                    disabled={ocrLoadingFront || ocrAnalyzing}
                    readOnly
                  />
                  <IdField
                    label="Số CCCD/CMND"
                    value={idCardForm.idNumber}
                    disabled={ocrLoadingFront || ocrAnalyzing}
                    readOnly
                  />
                  <IdField
                    label="Ngày sinh"
                    value={idCardForm.dob}
                    disabled={ocrLoadingFront || ocrAnalyzing}
                    readOnly
                  />
                  <IdField
                    label="Giới tính"
                    value={idCardForm.sex}
                    disabled={ocrLoadingFront || ocrAnalyzing}
                    readOnly
                  />
                  <IdField
                    label="Quốc tịch / ghi chú thẻ"
                    value={idCardForm.nationality}
                    disabled={ocrLoadingFront || ocrAnalyzing}
                    readOnly
                  />
                  <IdField
                    label="Quê quán"
                    value={idCardForm.home}
                    disabled={ocrLoadingFront || ocrAnalyzing}
                    readOnly
                  />
                  <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                    <Label className="text-xs">Nơi thường trú / Địa chỉ (dòng trên thẻ)</Label>
                    <Textarea
                      value={idCardForm.address}
                      readOnly
                      rows={2}
                      disabled={ocrLoadingFront || ocrAnalyzing}
                      className={cn(
                        "min-h-[64px] text-sm cursor-default resize-none",
                        "bg-muted/50 border-muted-foreground/20",
                      )}
                    />
                  </div>
                  <IdField
                    label="Tỉnh/TP (address_entities)"
                    value={idCardForm.addrProvince}
                    disabled={ocrLoadingFront || ocrAnalyzing}
                    readOnly
                  />
                  <IdField
                    label="Quận/Huyện"
                    value={idCardForm.addrDistrict}
                    disabled={ocrLoadingFront || ocrAnalyzing}
                    readOnly
                  />
                  <IdField
                    label="Phường/Xã"
                    value={idCardForm.addrWard}
                    disabled={ocrLoadingFront || ocrAnalyzing}
                    readOnly
                  />
                  <IdField
                    label="Số nhà, đường"
                    value={idCardForm.addrStreet}
                    disabled={ocrLoadingFront || ocrAnalyzing}
                    readOnly
                  />
                  <IdField
                    label="Ngày hết hạn (nếu có)"
                    value={idCardForm.doe}
                    disabled={ocrLoadingFront || ocrAnalyzing}
                    readOnly
                  />
                  <IdField
                    label="Loại thẻ (API trả về)"
                    value={idCardForm.cardType}
                    disabled={ocrLoadingFront || ocrAnalyzing}
                    readOnly
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Mặt sau
                  {ocrLoadingBack && (
                    <span className="ml-2 text-amber-600 normal-case">— Đang đọc ảnh…</span>
                  )}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <IdField
                    label="Ngày cấp"
                    value={idCardForm.issueDate}
                    disabled={ocrLoadingBack || ocrAnalyzing}
                    readOnly
                  />
                  <IdField
                    label="Nơi cấp"
                    value={idCardForm.issueLoc}
                    disabled={ocrLoadingBack || ocrAnalyzing}
                    readOnly
                  />
                  <IdField
                    label="Tôn giáo"
                    value={idCardForm.religion}
                    disabled={ocrLoadingBack || ocrAnalyzing}
                    readOnly
                  />
                  <IdField
                    label="Dân tộc"
                    value={idCardForm.ethnicity}
                    disabled={ocrLoadingBack || ocrAnalyzing}
                    readOnly
                  />
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Đặc điểm nhận dạng</Label>
                    <Textarea
                      value={idCardForm.features}
                      readOnly
                      rows={2}
                      disabled={ocrLoadingBack || ocrAnalyzing}
                      className={cn(
                        "min-h-[56px] text-sm cursor-default resize-none",
                        "bg-muted/50 border-muted-foreground/20",
                      )}
                    />
                  </div>
                </div>
              </div>
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

function IdField({
  label,
  value,
  disabled,
  readOnly,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        readOnly={readOnly}
        disabled={disabled}
        className={cn(
          "text-sm h-9",
          readOnly && "cursor-default bg-muted/50 border-muted-foreground/20",
        )}
      />
    </div>
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
