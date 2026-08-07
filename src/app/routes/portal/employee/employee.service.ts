import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { map, Observable } from 'rxjs';

import { BranchOptionResponse, CreateEmployeeRequest, EmployeeResponse, UpdateEmployeeRequest } from './employee.model';
import { ApiResponse } from '../../auth/models/auth.model';

const API = environment.api['apiPrefix'];

interface PagedBranches {
  data: BranchOptionResponse[];
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);

  private readonly EMPLOYEE_API = `${API}/personal/branches/employees`;
  private readonly BRANCH_API = `${API}/erp/organization-branches`;

  /** Phạm vi dữ liệu do `dataScope` trong token quyết định; danh sách luôn loại chính người gọi. */
  listEmployees(): Observable<EmployeeResponse[]> {
    return this.http.get<ApiResponse<EmployeeResponse[]>>(this.EMPLOYEE_API).pipe(map(res => res.data));
  }

  createEmployee(request: CreateEmployeeRequest): Observable<EmployeeResponse> {
    return this.http.post<ApiResponse<EmployeeResponse>>(this.EMPLOYEE_API, request).pipe(map(res => res.data));
  }

  updateEmployee(id: string, request: UpdateEmployeeRequest): Observable<EmployeeResponse> {
    return this.http.put<ApiResponse<EmployeeResponse>>(`${this.EMPLOYEE_API}/${id}`, request).pipe(map(res => res.data));
  }

  assignRole(id: string, orgRoleId: string): Observable<EmployeeResponse> {
    return this.http.put<ApiResponse<EmployeeResponse>>(`${this.EMPLOYEE_API}/${id}/role`, { orgRoleId }).pipe(map(res => res.data));
  }

  /** Idempotent. Employee đang ACTIVE sẽ bị backend tự hạ về INACTIVE trong cùng request. */
  revokeRole(id: string): Observable<EmployeeResponse> {
    return this.http.delete<ApiResponse<EmployeeResponse>>(`${this.EMPLOYEE_API}/${id}/role`).pipe(map(res => res.data));
  }

  updateSalary(id: string, salary: number): Observable<EmployeeResponse> {
    return this.http.put<ApiResponse<EmployeeResponse>>(`${this.EMPLOYEE_API}/${id}/salary`, { salary }).pipe(map(res => res.data));
  }

  /** Endpoint chi nhánh trả PagingResponse nên phải unwrap hai tầng, khác các API employee ở trên. */
  listBranches(): Observable<BranchOptionResponse[]> {
    return this.http.get<ApiResponse<PagedBranches>>(this.BRANCH_API, { params: { page: 1, size: 100 } }).pipe(map(res => res.data.data));
  }
}
