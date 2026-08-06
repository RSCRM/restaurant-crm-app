// === Enums ===

export enum LicenseStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED'
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

// === License DTOs ===

export interface CreateLicenseRequest {
  code: string;
  name: string;
  description?: string;
  price: number;
  billingCycle: BillingCycle;
  maxBranch: number;
  maxEmployee: number;
}

export interface UpdateLicenseRequest {
  code?: string;
  description?: string;
  price: number;
  billingCycle: BillingCycle;
  maxBranch: number;
  maxEmployee: number;
  status: LicenseStatus;
}

export interface LicenseResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  billingCycle: BillingCycle;
  maxBranch: number;
  maxEmployee: number;
  status: LicenseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DeleteLicenseResponse {
  id: string;
  deletedAt: string;
}

// === Subscription DTOs ===

export interface GrantSubscriptionRequest {
  organizationId: string;
  licenseId: string;
  startDate?: string;
}

export interface LicenseInfo {
  id: string;
  code: string;
  name: string;
}

export interface SubscriptionResponse {
  id: string;
  license: LicenseInfo;
  organizationId: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  price: number;
  billingCycle: BillingCycle;
  maxBranch: number;
  maxEmployee: number;
  createdAt: string;
  updatedAt: string;
}

// === Detail DTOs ===

export interface LicenseDetailResponse {
  license: LicenseResponse;
  organizations: OrganizationSubscriptionResponse[];
  pagination: PaginationResponse;
}

export interface OrganizationSubscriptionResponse {
  organization: OrganizationSummary;
  subscription: SubscriptionResponse;
}

export interface OrganizationSummary {
  id: string;
  name: string;
}

export interface PaginationResponse {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// === Paging (matches backend PagingResponse) ===

export interface PagingResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElement: number;
  data: T[];
}

export interface PagingParams {
  page: number;
  size: number;
  direction?: 'ASC' | 'DESC';
  field?: string;

  search?: string;
}

// === Search/Filter DTOs ===

export interface LicenseSearchRequest {
  name?: string;
  priceFrom?: number;
  priceTo?: number;
  billingCycle?: BillingCycle;
  maxBranchFrom?: number;
  maxBranchTo?: number;
  maxEmployeeFrom?: number;
  maxEmployeeTo?: number;
  createdAtFrom?: string;
  createdAtTo?: string;
  status?: LicenseStatus;
}
