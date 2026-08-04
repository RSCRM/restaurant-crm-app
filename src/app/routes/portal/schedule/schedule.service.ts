import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { forkJoin, map, Observable } from 'rxjs';

import { PersonalScheduleResponse, ScheduleEmployeeResponse, ScheduleRangeCreationRequest } from './schedule.model';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.api['apiPrefix']}/erp/schedules`;

  getPersonalSchedule(from: string, to: string): Observable<PersonalScheduleResponse[]> {
    return this.http
      .get<ApiResponse<PersonalScheduleResponse[]>>(`${this.api}/me`, { params: { from, to } })
      .pipe(map(response => response.data));
  }

  getManagedSchedules(from: string, to: string): Observable<PersonalScheduleResponse[]> {
    return this.http
      .get<ApiResponse<PersonalScheduleResponse[]>>(`${this.api}/staff`, { params: { from, to } })
      .pipe(map(response => response.data));
  }

  getManagedEmployees(): Observable<ScheduleEmployeeResponse[]> {
    return this.http.get<ApiResponse<ScheduleEmployeeResponse[]>>(`${this.api}/staff/employees`).pipe(map(response => response.data));
  }

  createSchedules(request: ScheduleRangeCreationRequest): Observable<PersonalScheduleResponse[]> {
    const dates = this.datesBetween(request.from, request.to);
    return forkJoin(
      dates.map(workDate =>
        this.http
          .post<ApiResponse<PersonalScheduleResponse>>(this.api, {
            employeeId: request.employeeId,
            workDate,
            startTime: request.startTime,
            endTime: request.endTime,
            note: request.note
          })
          .pipe(map(response => response.data))
      )
    );
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
