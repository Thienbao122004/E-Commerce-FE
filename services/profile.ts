import { api } from '@/lib/api-client'
import type {
  UserProfileResponse,
  AddressResponse,
  UpdateProfileRequest,
  AddAddressRequest,
  UpdateAddressRequest,
} from '@/types/profile'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export const profileService = {
  getProfile: () =>
    api.get<ApiResponse<UserProfileResponse>>('/api/user/profile'),

  updateProfile: (data: UpdateProfileRequest) =>
    api.put<ApiResponse<null>>('/api/user/profile', data),

  requestEmailChange: (newEmail: string) =>
    api.post<ApiResponse<null>>('/api/user/profile/request-email-change', { newEmail }),

  confirmEmailChange: (newEmail: string, otp: string) =>
    api.post<ApiResponse<null>>('/api/user/profile/confirm-email-change', { newEmail, otp }),

  getAddresses: () =>
    api.get<ApiResponse<AddressResponse[]>>('/api/user/addresses'),

  addAddress: (data: AddAddressRequest) =>
    api.post<ApiResponse<AddressResponse>>('/api/user/addresses', data),

  updateAddress: (addressId: string, data: UpdateAddressRequest) =>
    api.put<ApiResponse<null>>(`/api/user/addresses/${addressId}`, data),

  deleteAddress: (addressId: string) =>
    api.delete<ApiResponse<null>>(`/api/user/addresses/${addressId}`),

  setDefaultAddress: (addressId: string) =>
    api.post<ApiResponse<null>>(`/api/user/addresses/${addressId}/set-default`),
}
