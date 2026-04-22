export interface ShopInfo {
  shopId: string
  shopName: string
  shopSlug: string
  shopDescription: string | null
  shopLogo: string | null
  verificationStatus?: number   // 0=pending, 1=approved, 2=rejected
  rejectionReason?: string | null
  /** Danh mục gốc khi đăng ký — giới hạn sản phẩm cùng nhánh */
  primaryCategoryId?: number | null
  primaryCategoryName?: string | null
}

export interface UserProfileResponse {
  id: string
  userCode: string
  email: string | null
  fullName: string | null
  phone: string | null
  role: string
  createdAt: string
  updatedAt: string
  shop: ShopInfo | null
}

export interface AddressResponse {
  id: string
  label: string | null
  fullName: string | null
  phone: string | null
  addressLine1: string
  addressLine2: string | null
  ward: string | null
  district: string | null
  city: string
  province: string | null
  postalCode: string | null
  country: string
  isDefault: boolean
  createdAt: string
}

export interface UpdateProfileRequest {
  fullName?: string | null
  phone?: string | null
}

export interface ShopDocumentInput {
  /** Chỉ business_license | tax_cert — ảnh CCCD không upload storage */
  docType: string
  fileUrl: string
}

/** Thông tin định danh từ CCCD (lưu JSON trên server) — không gửi file ảnh thẻ */
export interface SellerIdentityInfo {
  fullName: string
  idNumber?: string | null
  dateOfBirth?: string | null
  sex?: string | null
  nationality?: string | null
  homeTown?: string | null
  permanentAddress?: string | null
  addrProvince?: string | null
  addrDistrict?: string | null
  addrWard?: string | null
  addrStreet?: string | null
  dateOfExpiry?: string | null
  cardType?: string | null
  issueDate?: string | null
  issuePlace?: string | null
  religion?: string | null
  ethnicity?: string | null
  features?: string | null
}

export interface RegisterSellerRequest {
  shopName: string
  shopDescription?: string | null
  phone: string
  addressLine: string
  wardCode: string
  districtId: number
  provinceId: number
  city: string
  businessLicenseNumber?: string | null
  taxCode?: string | null
  businessType: 'individual' | 'company' | 'household'
  /** ID danh mục cấp 1 (gốc) trên sàn — shop chỉ được bán trong nhánh này */
  primaryCategoryId: number
  bankName?: string | null
  bankAccountNumber?: string | null
  bankAccountName?: string | null
  /** Bắt buộc — nội dung từ form CCCD, không lưu ảnh */
  identity: SellerIdentityInfo
  /** Chỉ file GPKD / giấy tờ tùy chọn, không gồm ảnh CCCD */
  documents?: ShopDocumentInput[]
}

export interface AddAddressRequest {
  label?: string
  fullName?: string
  phone?: string
  addressLine1: string
  addressLine2?: string
  ward?: string
  district?: string
  city: string
  province?: string
  postalCode?: string
  country?: string
  isDefault?: boolean
}

export interface UpdateAddressRequest {
  label?: string | null
  fullName?: string | null
  phone?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  ward?: string | null
  district?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
  country?: string | null
  isDefault?: boolean | null
}
