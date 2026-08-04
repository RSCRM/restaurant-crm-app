import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { environment } from '@env/environment';
import { Observable, map, of, retry, tap } from 'rxjs';

import {
  AttendanceCheckInRequest,
  AttendanceBranchResponse,
  AttendanceQrResponse,
  AttendanceResponse,
  EmployeeAttendanceResponse,
  PagingResponse
} from './attendance.model';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(DA_SERVICE_TOKEN);
  private readonly apiRoot = `${environment.api.baseUrl}${environment.api['apiPrefix']}`;
  private readonly api = `${this.apiRoot}/erp/attendances`;
  private readonly qrCache = new Map<string, AttendanceQrResponse>();

  getCurrentQr(branchId?: string, force = false): Observable<AttendanceQrResponse> {
    const cacheKey = branchId ?? 'context-branch';
    const cached = this.qrCache.get(cacheKey);
    if (!force && cached && new Date(cached.expiresAt).getTime() > Date.now()) {
      return of(cached);
    }
    return this.http.get<ApiResponse<AttendanceQrResponse>>(`${this.api}/qr`, { params: branchId ? { branchId } : {} }).pipe(
      map(response => response.data),
      tap(qr => this.qrCache.set(cacheKey, qr))
    );
  }

  checkIn(request: AttendanceCheckInRequest): Observable<AttendanceResponse> {
    return this.http.post<ApiResponse<AttendanceResponse>>(`${this.api}/check-in`, request).pipe(map(response => response.data));
  }

  checkOut(): Observable<AttendanceResponse> {
    return this.http.post<ApiResponse<AttendanceResponse>>(`${this.api}/check-out`, {}).pipe(map(response => response.data));
  }

  checkOutWithQr(qrToken: string): Observable<AttendanceResponse> {
    return this.http.post<ApiResponse<AttendanceResponse>>(`${this.api}/check-out/qr`, { qrToken }).pipe(map(response => response.data));
  }

  getMyHistory(from: string | null, to: string | null, page = 1, size = 10): Observable<PagingResponse<AttendanceResponse>> {
    const params: Record<string, string | number> = { page, size };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http
      .get<ApiResponse<PagingResponse<AttendanceResponse>>>(`${this.api}/me`, { params })
      .pipe(map(response => response.data));
  }

  getBranchAttendance(date: string, branchId?: string): Observable<EmployeeAttendanceResponse[]> {
    return this.http
      .get<ApiResponse<EmployeeAttendanceResponse[]>>(`${this.api}/branch`, {
        params: branchId ? { date, branchId } : { date }
      })
      .pipe(map(response => response.data));
  }

  getOrganizationBranches(): Observable<AttendanceBranchResponse[]> {
    return this.http
      .get<ApiResponse<PagingResponse<AttendanceBranchResponse>>>(`${this.apiRoot}/erp/organization-branches`, {
        params: { page: 1, size: 100 }
      })
      .pipe(map(response => response.data.data));
  }

  getEmployeeHistory(
    employeeId: string,
    from: string | null,
    to: string | null,
    page = 1,
    size = 10,
    branchId?: string
  ): Observable<PagingResponse<AttendanceResponse>> {
    const params: Record<string, string | number> = { page, size };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (branchId) params['branchId'] = branchId;
    return this.http
      .get<ApiResponse<PagingResponse<AttendanceResponse>>>(`${this.api}/branch/employees/${employeeId}/history`, { params })
      .pipe(map(response => response.data));
  }

  getBranchHistory(
    employeeId: string | null,
    date: string | null,
    page = 1,
    size = 10,
    branchId?: string
  ): Observable<PagingResponse<AttendanceResponse>> {
    const params: Record<string, string | number> = { page, size };
    if (employeeId) params['employeeId'] = employeeId;
    if (date) params['date'] = date;
    if (branchId) params['branchId'] = branchId;
    return this.http
      .get<ApiResponse<PagingResponse<AttendanceResponse>>>(`${this.api}/branch/history`, { params })
      .pipe(map(response => response.data));
  }

  watchBranchAttendance(branchId: string): Observable<void> {
    return new Observable<void>(subscriber => {
      const controller = new AbortController();
      const token = this.tokenService.get()?.token;

      void (async () => {
        try {
          const response = await fetch(`${this.api}/subscribe?branchId=${encodeURIComponent(branchId)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            signal: controller.signal
          });
          if (!response.ok || !response.body) {
            throw new Error(`Attendance SSE failed: ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) throw new Error('Attendance SSE closed');
            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split(/\r?\n\r?\n/);
            buffer = events.pop() ?? '';
            if (events.some(event => /^event:\s*ATTENDANCE_UPDATED\s*$/m.test(event))) {
              subscriber.next();
            }
          }
        } catch (error) {
          if (!controller.signal.aborted) subscriber.error(error);
        }
      })();

      return () => controller.abort();
    }).pipe(retry({ delay: 3000 }));
  }
}
