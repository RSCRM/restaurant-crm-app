import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ALLOW_ANONYMOUS, DA_SERVICE_TOKEN } from '@delon/auth';
import { environment } from '@env/environment';
import { Observable, map } from 'rxjs';

import { ApiResponse, ContextSelectionRequest, ContextSelectionResponse, LoginRequest, LoginResponse } from '../models/auth.model';
import { ContextInfo } from '../store/auth.state';

const API = environment.api['apiPrefix'];
export interface PendingAttendanceAction {
  action: 'check-in' | 'check-out';
  qrToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(DA_SERVICE_TOKEN);
  private readonly pendingAttendanceKey = 'pending_attendance_action';

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${API}/auth/login`, request, {
        context: new HttpContext().set(ALLOW_ANONYMOUS, true)
      })
      .pipe(map(res => res.data));
  }

  selectContext(request: ContextSelectionRequest, accessToken: string): Observable<ContextSelectionResponse> {
    return this.http
      .post<ApiResponse<ContextSelectionResponse>>(`${API}/auth/context`, request, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .pipe(map(res => res.data));
  }

  logout(): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${API}/auth/logout`, {}).pipe(map(() => undefined));
  }

  setToken(token: string, expiresInMs: number): void {
    this.tokenService.set({ token, time: +new Date() + expiresInMs });
  }

  getToken(): string | null {
    return this.tokenService.get()?.token ?? null;
  }

  clearToken(): void {
    this.tokenService.clear();
  }

  setSystemRoles(roles: string[]): void {
    localStorage.setItem('auth_systemRoles', JSON.stringify(roles));
  }

  getSystemRoles(): string[] {
    try {
      const raw = localStorage.getItem('auth_systemRoles');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  setContextToken(token: string): void {
    localStorage.setItem('auth_contextToken', token);
  }

  getContextToken(): string | null {
    return localStorage.getItem('auth_contextToken');
  }

  setAccessToken(token: string): void {
    localStorage.setItem('auth_accessToken', token);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('auth_accessToken');
  }

  setContexts(contexts: ContextInfo[]): void {
    localStorage.setItem('auth_contexts', JSON.stringify(contexts));
  }

  getContexts(): ContextInfo[] {
    try {
      const raw = localStorage.getItem('auth_contexts');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  clearPersistedAuth(): void {
    localStorage.removeItem('auth_systemRoles');
    localStorage.removeItem('auth_contextToken');
    localStorage.removeItem('auth_accessToken');
    localStorage.removeItem('auth_contexts');
  }

  capturePendingAttendance(): void {
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    const action = params.get('attendanceAction');
    const qrToken = params.get('qrToken');
    if ((action === 'check-in' || action === 'check-out') && qrToken) {
      sessionStorage.setItem(this.pendingAttendanceKey, JSON.stringify({ action, qrToken }));
    }
  }

  hasPendingAttendance(): boolean {
    return sessionStorage.getItem(this.pendingAttendanceKey) !== null;
  }

  consumePendingAttendance(): PendingAttendanceAction | null {
    const raw = sessionStorage.getItem(this.pendingAttendanceKey);
    sessionStorage.removeItem(this.pendingAttendanceKey);
    if (!raw) return null;
    try {
      const pending = JSON.parse(raw) as PendingAttendanceAction;
      return (pending.action === 'check-in' || pending.action === 'check-out') && pending.qrToken ? pending : null;
    } catch {
      return null;
    }
  }

  clearPendingAttendance(): void {
    sessionStorage.removeItem(this.pendingAttendanceKey);
  }

  parseJwtPayload(token: string): Record<string, unknown> {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return {};
    }
  }
}
