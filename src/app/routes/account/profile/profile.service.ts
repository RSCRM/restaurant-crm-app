import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { PagingResponse, ProfileUpdateRequest, StaffProfileUpdateRequest, UserProfileResponse } from './profile.model';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  private readonly api = '/api/v1/profile';

  getMyInfo(): Observable<UserProfileResponse> {
    return this.http.get<ApiResponse<UserProfileResponse>>(`${this.api}/me`).pipe(map(response => response.data));
  }

  getAll(page = 1, size = 10): Observable<PagingResponse<UserProfileResponse>> {
    return this.http
      .get<ApiResponse<PagingResponse<UserProfileResponse>>>(this.api, { params: { page, size } })
      .pipe(map(response => response.data));
  }

  getById(profileId: string): Observable<UserProfileResponse> {
    return this.http.get<ApiResponse<UserProfileResponse>>(`${this.api}/${profileId}`).pipe(map(response => response.data));
  }

  updateMyInfo(request: ProfileUpdateRequest): Observable<UserProfileResponse> {
    return this.http.put<ApiResponse<UserProfileResponse>>(`${this.api}/me`, request).pipe(map(response => response.data));
  }

  updateStaff(employeeId: string, request: StaffProfileUpdateRequest): Observable<UserProfileResponse> {
    return this.http.put<ApiResponse<UserProfileResponse>>(`${this.api}/staff/${employeeId}`, request).pipe(map(response => response.data));
  }
}
