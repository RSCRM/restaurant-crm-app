import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, map } from 'rxjs';

import {
  PagingResponse,
  RoleResponse,
  UserCreationRequest,
  UserResponse,
  UserRolesUpdateRequest,
  UserSearchRequest
} from './user.model';
import { ApiResponse } from '../../../routes/auth/models/auth.model';

const API = environment.api['apiPrefix'];

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  private readonly USER_API = `${API}/users`;
  private readonly ROLE_API = `${API}/roles`;

  getRoles(): Observable<RoleResponse[]> {
    return this.http
      .get<ApiResponse<any>>(this.ROLE_API)
      .pipe(map(res => {
        const d = res.data;
        // API có thể trả về array trực tiếp hoặc paging object { data: [...] }
        return Array.isArray(d) ? d : (d?.data ?? []);
      }));
  }

  searchUsers(
    filter: UserSearchRequest,
    page = 1,
    size = 10,
    direction = 'DESC',
    field = 'createdAt'
  ): Observable<PagingResponse<UserResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('direction', direction)
      .set('field', field);

    return this.http
      .post<ApiResponse<PagingResponse<UserResponse>>>(`${this.USER_API}/search`, filter, { params })
      .pipe(map(res => res.data));
  }

  createUser(request: UserCreationRequest): Observable<UserResponse> {
    return this.http.post<ApiResponse<UserResponse>>(this.USER_API, request).pipe(map(res => res.data));
  }

  getUserById(userId: string): Observable<UserResponse> {
    return this.http.get<ApiResponse<UserResponse>>(`${this.USER_API}/${userId}`).pipe(map(res => res.data));
  }

  updateUserRoles(userId: string, roleIds: string[]): Observable<UserResponse> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.USER_API}/${userId}/roles`, { roleIds }).pipe(map(res => res.data));
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.USER_API}/${userId}`).pipe(map(() => undefined));
  }
}
