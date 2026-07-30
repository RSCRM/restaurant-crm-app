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
  branchName: string;
  branchAddress: string | null;
  branchPhone: string | null;
  branchStatus: OrganizationBranchStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface BranchManagerResponse {
  branchId: string;
  branchName: string;
  branchAddress: string | null;
  branchPhone: string | null;
  branchStatus: OrganizationBranchStatus | null;
  branchStauts?: OrganizationBranchStatus | null;
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

export interface EmployeeBranchAssignmentRequest {
  managerId: string;
}

export type AssignBranchManagerRequest = EmployeeBranchAssignmentRequest;

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
