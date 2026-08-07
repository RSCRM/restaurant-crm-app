export interface PersonalScheduleResponse {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeFullName: string;
  branchId: string;
  branchName: string;
  workDate: string;
  startTime: string;
  endTime: string;
  note: string | null;
}

export interface ScheduleEmployeeResponse {
  id: string;
  name: string;
  fullName: string;
  email: string;
  branchName: string;
}

export interface ScheduleRangeCreationRequest {
  employeeIds: string[];
  from: string;
  to: string;
  startTime: string;
  endTime: string;
  note?: string;
}
