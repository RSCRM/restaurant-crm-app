import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import { PersonalScheduleResponse, ScheduleBranchResponse, ScheduleEmployeeResponse, ScheduleRangeCreationRequest } from './schedule.model';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.api['apiPrefix']}/erp/schedules`;

  getPersonalSchedule(from: string, to: string): Observable<PersonalScheduleResponse[]> {
    return this.http
      .get<ApiResponse<PersonalScheduleResponse[]>>(`${this.api}/me`, { params: { from, to } })
      .pipe(map(response => response.data ?? []));
  }

  getManagedSchedules(from: string, to: string, branchId?: string): Observable<PersonalScheduleResponse[]> {
    const params: Record<string, string> = { from, to };
    if (branchId) params['branchId'] = branchId;
    return this.http
      .get<ApiResponse<PersonalScheduleResponse[]>>(`${this.api}/staff`, { params })
      .pipe(map(response => response.data ?? []));
  }

  getStaffSchedule(employeeId: string, from: string, to: string, branchId?: string): Observable<PersonalScheduleResponse[]> {
    const params: Record<string, string> = { from, to };
    if (branchId) params['branchId'] = branchId;
    return this.http
      .get<ApiResponse<PersonalScheduleResponse[]>>(`${this.api}/staff/${employeeId}`, { params })
      .pipe(map(response => response.data ?? []));
  }

  getManagedEmployees(branchId?: string): Observable<ScheduleEmployeeResponse[]> {
    return this.http
      .get<ApiResponse<ScheduleEmployeeResponse[]>>(`${this.api}/staff/employees`, { params: branchId ? { branchId } : {} })
      .pipe(map(response => response.data));
  }

  getOrganizationBranches(): Observable<ScheduleBranchResponse[]> {
    return this.http
      .get<ApiResponse<{ data: ScheduleBranchResponse[] }>>('/api/v1/erp/organization-branches', { params: { page: 1, size: 100 } })
      .pipe(map(response => response.data.data));
  }

  createSchedules(request: ScheduleRangeCreationRequest): Observable<PersonalScheduleResponse[]> {
    const dates = this.datesBetween(request.from, request.to);
    const requests: Array<Observable<PersonalScheduleResponse>> = [];

    for (const employeeId of request.employeeIds) {
      for (const workDate of dates) {
        requests.push(
          this.http
            .post<ApiResponse<PersonalScheduleResponse>>(this.api, {
              employeeId,
              workDate,
              startTime: request.startTime,
              endTime: request.endTime,
              note: request.note
            })
            .pipe(
              map(response => response.data),
              catchError(err => {
                if (err.status === 409) {
                  return of(null as unknown as PersonalScheduleResponse);
                }
                throw err;
              })
            )
        );
      }
    }

    return forkJoin(requests).pipe(map(results => results.filter(item => item !== null)));
  }

  private datesBetween(from: string, to: string): string[] {
    const [year, month, day] = from.split('-').map(Number);
    const end = new Date(`${to}T00:00:00`);
    const current = new Date(year, month - 1, day);
    const dates: string[] = [];
    while (current <= end) {
      dates.push(
        `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
      );
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }
}
