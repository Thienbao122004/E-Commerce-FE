import { api } from '@/lib/api-client'
import type {
  UserProfileResponse,
  AddressResponse,
  UpdateProfileRequest,
  RegisterSellerRequest,
  AddAddressRequest,
  UpdateAddressRequest,
} from '@/types/profile'
import type { ApiDataResponse } from '@/types/api'

export const profileService = {
  getProfile: () =>
    api.get<ApiDataResponse<UserProfileResponse>>('/api/user/profile'),

  updateProfile: (data: UpdateProfileRequest) =>
    api.put<ApiDataResponse<null>>('/api/user/profile', data),

  registerSeller: (data: RegisterSellerRequest) =>
    api.post<ApiDataResponse<null>>('/api/user/register-seller', data),

  requestEmailChange: (newEmail: string) =>
    api.post<ApiDataResponse<null>>('/api/user/profile/request-email-change', { newEmail }),

  confirmEmailChange: (newEmail: string, otp: string) =>
    api.post<ApiDataResponse<null>>('/api/user/profile/confirm-email-change', { newEmail, otp }),

  /**
   * Yêu cầu BE xóa cache snapshot Supabase Auth của user hiện tại.
   * Dùng sau khi đổi avatar / email / metadata để các nơi khác (review,
   * chat, ...) đọc thấy dữ liệu mới ngay thay vì chờ TTL cache hết.
   */
  refreshAuthCache: () =>
    api.post<{ success: boolean }>('/api/user/profile/refresh-auth-cache'),

  getAddresses: () =>
    api.get<ApiDataResponse<AddressResponse[]>>('/api/user/addresses'),

  addAddress: (data: AddAddressRequest) =>
    api.post<ApiDataResponse<AddressResponse>>('/api/user/addresses', data),

  updateAddress: (addressId: string, data: UpdateAddressRequest) =>
    api.put<ApiDataResponse<null>>(`/api/user/addresses/${addressId}`, data),

  deleteAddress: (addressId: string) =>
    api.delete<ApiDataResponse<null>>(`/api/user/addresses/${addressId}`),

  setDefaultAddress: (addressId: string) =>
    api.post<ApiDataResponse<null>>(`/api/user/addresses/${addressId}/set-default`),
}
