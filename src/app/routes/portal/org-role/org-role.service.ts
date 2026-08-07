import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { map, Observable } from 'rxjs';

import { OrgPermissionResponse, OrgRoleRequest, OrgRoleResponse } from './org-role.model';
import { ApiResponse } from '../../auth/models/auth.model';

const API = environment.api['apiPrefix'];

@Injectable({ providedIn: 'root' })
export class OrgRoleService {
  private http = inject(HttpClient);

  private readonly ROLE_API = `${API}/erp/org-roles`;
  private readonly PERMISSION_API = `${API}/erp/org-permissions`;

  listPermissions(): Observable<OrgPermissionResponse[]> {
    return this.http.get<ApiResponse<OrgPermissionResponse[]>>(this.PERMISSION_API).pipe(map(res => res.data));
  }

  /** Backend đã loại role hệ thống OWNER khỏi danh sách trả về. */
  listRoles(): Observable<OrgRoleResponse[]> {
    return this.http.get<ApiResponse<OrgRoleResponse[]>>(this.ROLE_API).pipe(map(res => res.data));
  }

  getRole(id: string): Observable<OrgRoleResponse> {
    return this.http.get<ApiResponse<OrgRoleResponse>>(`${this.ROLE_API}/${id}`).pipe(map(res => res.data));
  }

  createRole(request: OrgRoleRequest): Observable<OrgRoleResponse> {
    return this.http.post<ApiResponse<OrgRoleResponse>>(this.ROLE_API, request).pipe(map(res => res.data));
  }

  updateRole(id: string, request: OrgRoleRequest): Observable<OrgRoleResponse> {
    return this.http.put<ApiResponse<OrgRoleResponse>>(`${this.ROLE_API}/${id}`, request).pipe(map(res => res.data));
  }
}
