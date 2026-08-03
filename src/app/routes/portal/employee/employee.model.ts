export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED'
}

export enum EmployeeUserStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED'
}

export interface EmployeeResponse {
  id: string;
  employeeId?: string | null;
  employeeCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName: string | null;
  userId?: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  organizationId?: string | null;
  branchId: string | null;
  branchName: string | null;
  orgRoleId: string | null;
  orgRoleName: string | null;
  role?: string | null;
  status: EmployeeStatus | string | null;
  enabled: boolean;
  userStatus?: EmployeeUserStatus | string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface EmployeeListParams {
  organizationId?: string | null;
  branchId?: string | null;
  keyword?: string | null;
  role?: string | null;
  status?: string | null;
  page: number;
  size: number;
  field?: string | null;
  direction?: 'ASC' | 'DESC' | null;
}

export interface EmployeeMutationRequest {
  username: string;
  email: string;
  phone: string;
  branchId: string;
  orgRoleId?: string | null;
  status: EmployeeStatus | string;
  startDate: string;
  endDate?: string | null;
}

export interface EmployeeRoleOption {
  id: string;
  name: string;
  dataScope?: string | null;
}

export interface PagingResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElement: number;
  data: T[];
}
