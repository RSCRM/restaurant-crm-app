export interface PersonalScheduleResponse {
  id: string;
  employeeId: string;
  employeeName: string;
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
  branchName: string;
}

export interface ScheduleRangeCreationRequest {
  employeeId: string;
  from: string;
  to: string;
  startTime: string;
  endTime: string;
  note?: string;
}
