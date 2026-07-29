export interface CustomerResponse {
  id: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface CustomerPointResponse {
  id: string;
  customerId: string;
  organizationId: string;
  currentPoints: number;
  lifetimePoints: number;
  updatedAt: string;
}

export interface CustomerPointHistoryResponse {
  id: string;
  customerId: string;
  organizationId: string;
  transactionType: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUSTMENT';
  pointsChanged: number;
  referenceId?: string;
  createdAt: string;
}

export interface VoucherResponse {
  id: string;
  branchId: string;
  title: string;
  discountPercent: number;
  minBillAmount: number;
  pointsRequired: number;
  isActive: number; // 0 or 1
  createdAt: string;
  expiredAt?: string;
}

export interface CustomerVoucherResponse {
  id: string;
  customerId: string;
  branchId: string;
  voucher: VoucherResponse;
  voucherSn: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  usedAt?: string;
  orderId?: string;
  createdAt: string;
}

export interface VoucherCreationRequest {
  branchId: string;
  title: string;
  discountPercent: number;
  minBillAmount: number;
  pointsRequired: number;
  isActive: number;
  expiredAt?: string;
}

export interface VoucherUpdateRequest {
  title: string;
  discountPercent: number;
  minBillAmount: number;
  pointsRequired: number;
  isActive: number;
  expiredAt?: string;
}

export interface VoucherRedeemRequest {
  customerId: string;
  branchId: string;
  voucherId: string;
}
