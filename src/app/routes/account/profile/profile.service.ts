import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { UserProfileResponse } from './profile.model';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  private readonly api = '/api/v1/users/me';

  getMyInfo(): Observable<UserProfileResponse> {
    return this.http.get<ApiResponse<UserProfileResponse>>(this.api).pipe(map(response => response.data));
  }
}
