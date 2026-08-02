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
