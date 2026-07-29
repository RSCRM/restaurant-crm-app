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

export interface AssignBranchManagerRequest {
  managerId: string;
}

export type BranchManagerFormMode = 'assign' | 'replace';

export interface BranchManagerRow {
  id: string;
  branchName: string;
  manager: BranchManagerResponse | null;
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
