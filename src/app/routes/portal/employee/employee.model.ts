export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED'
}

export interface EmployeeResponse {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  branchId: string;
  orgRoleName: string | null;
  salary: number | null;
  status: EmployeeStatus;
  startDate: string;
}

/** B1 — không nhận `orgRoleId`; gán role là hành động riêng gọi sau. */
export interface CreateEmployeeRequest {
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  branchId: string;
  startDate: string;
  salary?: number;
}

/** B2 — patch-style: field nào không gửi (hoặc gửi null) thì backend giữ nguyên. */
export interface UpdateEmployeeRequest {
  fullName?: string;
  phone?: string;
  status?: EmployeeStatus;
  startDate?: string;
  endDate?: string;
}

export interface BranchOptionResponse {
  id: string;
  organizationId: string;
  branchName: string;
}
