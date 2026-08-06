export enum CustomerVoucherStatus {
  AVAILABLE = 'AVAILABLE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum PointTransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  DEDUCT = 'DEDUCT',
  EXPIRE = 'EXPIRE'
}

export interface CustomerResponse {
  id: string;
  phone: string;
  restaurantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PointWalletBalanceResponse {
  walletId: string;
  customerId: string;
  restaurantId: string;
  currentPoints: number;
  lifetimePoints: number;
}

export interface CustomerPointResponse {
  id: string;
  customerId: string;
  customerPhone: string;
  organizationId: string;
  currentPoints: number;
  lifetimePoints: number;
  updatedAt: string;
}

export interface PointTransactionResponse {
  id: string;
  walletId: string;
  type: PointTransactionType;
  amount: number;
  balanceAfter: number;
  source: string;
  referenceId: string | null;
  createdAt: string;
}

export interface VoucherResponse {
  id: string;
  branchId: string;
  title: string;
  description?: string | null;
  discountPercent: number;
  minBillAmount: number;
  pointsRequired: number;
  validDays?: number;
  isActive: number;
  expiredAt?: string | null;
  createdAt: string;
}

export interface CustomerVoucherResponse {
  id: string;
  customerId: string;
  branchId: string;
  voucher: VoucherResponse;
  voucherSn: string;
  status: CustomerVoucherStatus;
  usedAt: string | null;
  orderId: string | null;
  createdAt: string;
}

export interface IdentifyCustomerRequest {
  phone: string;
  restaurantId: string;
}

export interface CreateVoucherRequest {
  branchId: string;
  title: string;
  discountPercent: number;
  minBillAmount: number;
  pointsRequired: number;
}

export interface UpdateVoucherRequest {
  title: string;
  discountPercent: number;
  minBillAmount: number;
  pointsRequired: number;
  isActive: number;
}

export interface RedeemVoucherRequest {
  customerId: string;
  branchId: string;
  voucherId: string;
}

export interface GiveVoucherRequest {
  customerId: string;
  branchId: string;
  voucherId: string;
}

export interface PagingParams {
  page: number; // 1-based
  size: number;
  direction?: 'ASC' | 'DESC';
  field?: string;
}

export interface PagingResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElement: number;
  data: T[];
}
