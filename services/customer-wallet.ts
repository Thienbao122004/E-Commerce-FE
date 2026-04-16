import { api } from '@/lib/api-client'
import type {
  CustomerWalletLedgerResponse,
  CreateCustomerWithdrawalDto,
  CustomerWithdrawalResponse,
  CustomerWithdrawalListResponse,
  CustomerWalletApiResponse,
} from '@/types/customer-wallet'

export const customerWalletService = {
  getWallet: () =>
    api.get<CustomerWalletApiResponse>('/api/customer-wallet'),

  getTransactions: (page = 1, pageSize = 20) =>
    api.get<CustomerWalletLedgerResponse>(
      `/api/customer-wallet/transactions?page=${page}&pageSize=${pageSize}`
    ),

  createWithdrawalRequest: (dto: CreateCustomerWithdrawalDto) =>
    api.post<CustomerWithdrawalResponse>('/api/customer-wallet/withdrawal-requests', dto),

  getWithdrawalRequests: (page = 1, pageSize = 20) =>
    api.get<CustomerWithdrawalListResponse>(
      `/api/customer-wallet/withdrawal-requests?page=${page}&pageSize=${pageSize}`
    ),
}
