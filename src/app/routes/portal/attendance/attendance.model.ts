export enum AttendanceStatus {
  ON_TIME = 'ON_TIME',
  LATE = 'LATE'
}

export interface AttendanceResponse {
  id: string;
  employeeId: string;
  employeeName?: string;
  branchId: string;
  shiftAssignmentId: string;
  workDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: AttendanceStatus;
}

export interface AttendanceQrResponse {
  qrToken: string;
  qrSessionId: string;
  issuedAt: string;
  expiresAt: string;
}

export interface AttendanceCheckInRequest {
  qrToken: string;
}

export interface EmployeeAttendanceResponse {
  employeeId: string;
  employeeName: string;
  username: string;
  workDate: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: AttendanceStatus | null;
  working: boolean;
}

export interface AttendanceBranchResponse {
  id: string;
  organizationId: string;
  branchName: string;
}

export interface PagingResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElement: number;
  data: T[];
}
