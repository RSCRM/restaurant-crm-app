import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { map, Observable } from 'rxjs';

import { PersonalScheduleResponse } from './schedule.model';
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
}
