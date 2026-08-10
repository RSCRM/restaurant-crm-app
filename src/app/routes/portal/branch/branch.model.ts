export enum OrganizationBranchStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CLOSED = 'CLOSED'
}

export interface OrganizationBranchResponse {
  id: string;
  organizationId: string;
  managerId?: string | null;
  managerUserId?: string | null;
  managerName?: string | null;
  managerUsername?: string | null;
  managerEmail?: string | null;
  branchName: string;
  address: string | null;
  phone: string | null;
  status: OrganizationBranchStatus;
  createdAt: string;
  updatedAt: string;
}

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
}

export interface BranchSearchParams extends PagingParams {
  keyword?: string | null;
  status?: OrganizationBranchStatus | null;
}

export interface BranchMutationRequest {
  organizationId?: string | null;
  branchName: string;
  address?: string | null;
  phone?: string | null;
  status?: OrganizationBranchStatus | null;
}