import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse } from '../../auth/models/auth.model';
import { EmployeeListParams, EmployeeMutationRequest, EmployeeResponse, PagingResponse } from './employee.model';

type EmployeeApiResponse = Partial<EmployeeResponse> & {
  employeeName?: string | null;
  name?: string | null;
  branch?: { id?: string | null; branchName?: string | null; name?: string | null } | null;
  orgRole?: { id?: string | null; roleName?: string | null; name?: string | null } | null;
  user?: { id?: string | null; username?: string | null; email?: string | null; enabled?: boolean | null; status?: string | null } | null;
};

type PagingApiResponse<T> =
  | PagingResponse<T>
  | {
      content?: T[];
      items?: T[];
      page?: number;
      size?: number;
      totalElements?: number;
      totalPages?: number;
    };

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);

  private readonly EMPLOYEE_API = '/api/v1/erp/employees';

  getEmployees(params: EmployeeListParams): Observable<PagingResponse<EmployeeResponse>> {
    let httpParams = new HttpParams().set('page', params.page.toString()).set('size', params.size.toString());

    if (params.organizationId) httpParams = httpParams.set('organizationId', params.organizationId);
    if (params.branchId) httpParams = httpParams.set('branchId', params.branchId);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.field) httpParams = httpParams.set('field', params.field);
    if (params.direction) httpParams = httpParams.set('direction', params.direction);

    return this.http.get<ApiResponse<PagingApiResponse<EmployeeApiResponse>>>(this.EMPLOYEE_API, { params: httpParams }).pipe(
      map(res => this.normalizePaging(res.data, params)),
      map(res => ({ ...res, data: res.data.map(employee => this.normalizeEmployee(employee)) }))
    );
  }

  searchEmployees(params: EmployeeListParams): Observable<PagingResponse<EmployeeResponse>> {
    return this.getEmployees(params);
  }

  getEmployee(employeeId: string): Observable<EmployeeResponse> {
    return this.http
      .get<ApiResponse<EmployeeApiResponse>>(`${this.EMPLOYEE_API}/${employeeId}`)
      .pipe(map(res => this.normalizeEmployee(res.data)));
  }

  createEmployee(request: EmployeeMutationRequest): Observable<EmployeeResponse> {
    return this.http
      .post<ApiResponse<EmployeeApiResponse>>(this.EMPLOYEE_API, request)
      .pipe(map(res => this.normalizeEmployee(res.data)));
  }

  updateEmployee(employeeId: string, request: EmployeeMutationRequest): Observable<EmployeeResponse> {
    return this.http
      .put<ApiResponse<EmployeeApiResponse>>(`${this.EMPLOYEE_API}/${employeeId}`, request)
      .pipe(map(res => this.normalizeEmployee(res.data)));
  }

  deleteEmployee(employeeId: string): Observable<EmployeeResponse | null> {
    return this.http
      .delete<ApiResponse<EmployeeApiResponse | null>>(`${this.EMPLOYEE_API}/${employeeId}`)
      .pipe(map(res => (res.data ? this.normalizeEmployee(res.data) : null)));
  }

  enableEmployee(employeeId: string): Observable<EmployeeResponse> {
    return this.http
      .patch<ApiResponse<EmployeeApiResponse>>(`${this.EMPLOYEE_API}/${employeeId}/enable`, {})
      .pipe(map(res => this.normalizeEmployee(res.data)));
  }

  disableEmployee(employeeId: string): Observable<EmployeeResponse> {
    return this.http
      .patch<ApiResponse<EmployeeApiResponse>>(`${this.EMPLOYEE_API}/${employeeId}/disable`, {})
      .pipe(map(res => this.normalizeEmployee(res.data)));
  }

  private normalizePaging(data: PagingApiResponse<EmployeeApiResponse>, params: EmployeeListParams): PagingResponse<EmployeeApiResponse> {
    const paging = data as Partial<PagingResponse<EmployeeApiResponse>> & {
      content?: EmployeeApiResponse[];
      items?: EmployeeApiResponse[];
      page?: number;
      size?: number;
      totalElements?: number;
    };
    const rows = Array.isArray(paging.data) ? paging.data : paging.content ?? paging.items ?? [];
    const totalElement = typeof paging.totalElement === 'number' ? paging.totalElement : paging.totalElements ?? rows.length;

    return {
      currentPage: typeof paging.currentPage === 'number' ? paging.currentPage : paging.page ?? params.page,
      pageSize: typeof paging.pageSize === 'number' ? paging.pageSize : paging.size ?? params.size,
      totalPages: typeof paging.totalPages === 'number' ? paging.totalPages : Math.ceil(totalElement / params.size),
      totalElement,
      data: rows
    };
  }

  private normalizeEmployee(employee: EmployeeApiResponse): EmployeeResponse {
    const id = employee.id ?? employee.employeeId ?? '';
    const branchId = employee.branchId ?? employee.branch?.id ?? null;
    const roleName = employee.orgRoleName ?? employee.role ?? employee.orgRole?.roleName ?? employee.orgRole?.name ?? null;
    const fullName = employee.fullName ?? employee.employeeName ?? employee.name ?? this.buildFullName(employee.firstName, employee.lastName);

    return {
      ...employee,
      id,
      employeeId: employee.employeeId ?? id,
      fullName,
      userId: employee.userId ?? employee.user?.id ?? null,
      username: employee.username ?? employee.user?.username ?? null,
      email: employee.email ?? employee.user?.email ?? null,
      phone: employee.phone ?? null,
      branchId,
      branchName: employee.branchName ?? employee.branch?.branchName ?? employee.branch?.name ?? null,
      orgRoleId: employee.orgRoleId ?? employee.orgRole?.id ?? null,
      orgRoleName: roleName,
      role: employee.role ?? roleName,
      status: employee.status ?? null,
      enabled: employee.enabled ?? employee.user?.enabled ?? false,
      userStatus: employee.userStatus ?? employee.user?.status ?? (employee.enabled ?? employee.user?.enabled ? 'ENABLED' : 'DISABLED'),
      startDate: employee.startDate ?? null,
      endDate: employee.endDate ?? null,
      createdAt: employee.createdAt ?? null,
      updatedAt: employee.updatedAt ?? null
    };
  }

  private buildFullName(firstName: string | null | undefined, lastName: string | null | undefined): string | null {
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    return fullName || null;
  }
}
