// === Enums ===

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

// === Request DTOs ===

export interface CreateOrganizationRequest {
  ownerId: string;
  organizationName: string;
  taxCode?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface UpdateOrganizationRequest {
  organizationName?: string;
  taxCode?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// === Response DTO ===

export interface OrganizationResponse {
  id: string;
  ownerId: string;
  organizationName: string;
  taxCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
}

// === Search/Filter DTO ===

export interface BranchSearchRequest {
  branchName?: string;
  phone?: string;
  status?: string;
}

export interface OrganizationSearchRequest {
  email?: string;
  organizationName?: string;
  phone?: string;
  taxCode?: string;
  ownerId?: string;
  status?: OrganizationStatus;
  address?: string;
}

// === Paging (matches backend PagingResponse) ===

export interface PagingResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElement: number;
  data: T[];
}
