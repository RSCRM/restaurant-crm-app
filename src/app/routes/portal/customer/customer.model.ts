export enum CustomerVoucherStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED'
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
  restaurantId: string;
  title: string;
  description: string | null;
  discountPercent: number;
  minOrderAmount: number;
  pointCost: number;
  validDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerVoucherResponse {
  id: string;
  customerId: string;
  voucherId: string;
  restaurantId: string;
  voucherTitle: string;
  discountPercent: number;
  minOrderAmount: number;
  status: CustomerVoucherStatus;
  redeemedAt: string;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface IdentifyCustomerRequest {
  phone: string;
  restaurantId: string;
}

export interface CreateVoucherRequest {
  restaurantId: string;
  title: string;
  description?: string | null;
  discountPercent: number;
  minOrderAmount: number;
  pointCost: number;
  validDays: number;
  isActive?: boolean;
}

export interface UpdateVoucherRequest {
  title?: string;
  description?: string | null;
  discountPercent?: number;
  minOrderAmount?: number;
  pointCost?: number;
  validDays?: number;
  isActive?: boolean;
}

export interface RedeemVoucherRequest {
  customerId: string;
  voucherId: string;
  restaurantId: string;
}

export interface GiveVoucherRequest {
  customerId: string;
  voucherId: string;
  restaurantId: string;
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
