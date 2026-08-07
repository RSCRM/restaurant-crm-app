export enum OrganizationBranchStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CLOSED = 'CLOSED'
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED'
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

export interface BranchManagerResponse {
  branchId: string;
  branchName: string;
  branchAddress?: string | null;
  branchPhone?: string | null;
  branchStatus?: string | null;
  employeeId: string | null;
  managerId?: string | null;
  userId: string | null;
  managerUserId?: string | null;
  username: string | null;
  managerName?: string | null;
  email: string | null;
  enabled: boolean;
  phone: string | null;
  status: EmployeeStatus | null;
  startDate: string | null;
  endDate: string | null;
  orgRoleId: string | null;
  orgRoleName: string | null;
  role?: string | null;
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

export interface BranchMutationRequest {
  organizationId?: string | null;
  branchName: string;
  address?: string | null;
  phone?: string | null;
  status?: OrganizationBranchStatus | null;
}
