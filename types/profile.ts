export interface ShopInfo {
  shopId: string
  shopName: string
  shopSlug: string
  shopDescription: string | null
  shopLogo: string | null
  verificationStatus?: number   // 0=pending, 1=approved, 2=rejected
  rejectionReason?: string | null
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
  /** cccd_front | cccd_back | business_license | tax_cert */
  docType: string
  fileUrl: string
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
  bankName?: string | null
  bankAccountNumber?: string | null
  bankAccountName?: string | null
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
