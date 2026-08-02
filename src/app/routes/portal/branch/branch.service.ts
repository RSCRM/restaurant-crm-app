import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  BranchManagerResponse,
  EmployeeBranchAssignmentRequest,
  OrganizationBranchResponse,
  PagingParams,
  PagingResponse
} from './branch.model';
import { ApiResponse } from '../../auth/models/auth.model';

type OrganizationBranchApiResponse = OrganizationBranchResponse & {
  address?: string | null;
  phone?: string | null;
  status?: OrganizationBranchResponse['branchStatus'] | null;
};

type BranchManagerApiResponse = BranchManagerResponse & {
  branchStauts?: BranchManagerResponse['branchStatus'];
  firstName?: string | null;
  fullName?: string | null;
  id?: string | null;
  lastName?: string | null;
  manager?: (Partial<BranchManagerResponse> & {
    firstName?: string | null;
    fullName?: string | null;
    id?: string | null;
    lastName?: string | null;
  }) | null;
};

@Injectable({ providedIn: 'root' })
export class BranchService {
  private http = inject(HttpClient);

  private readonly BRANCH_API = '/api/v1/erp/organization-branches';
  private readonly BRANCH_MANAGER_API = '/api/v1/personal/branches';

  getBranches(organizationId: string, params: PagingParams): Observable<PagingResponse<OrganizationBranchResponse>> {
    const httpParams = new HttpParams().set('page', params.page.toString()).set('size', params.size.toString());

    return this.http
      .get<ApiResponse<PagingResponse<OrganizationBranchApiResponse>>>(`${this.BRANCH_API}/organization/${organizationId}`, {
        params: httpParams
      })
      .pipe(map(res => ({ ...res.data, data: res.data.data.map(branch => this.normalizeBranch(branch)) })));
  }

  getBranch(branchId: string): Observable<OrganizationBranchResponse> {
    return this.http
      .get<ApiResponse<OrganizationBranchApiResponse>>(`${this.BRANCH_API}/${branchId}`)
      .pipe(map(res => this.normalizeBranch(res.data)));
  }

  getBranchManager(branchId: string): Observable<BranchManagerResponse> {
    return this.http
      .get<ApiResponse<BranchManagerApiResponse>>(`${this.BRANCH_MANAGER_API}/${branchId}/manager`)
      .pipe(map(res => this.normalizeManager(res.data)));
  }

  assignBranchManager(branchId: string, request: EmployeeBranchAssignmentRequest): Observable<BranchManagerResponse> {
    return this.http
      .put<ApiResponse<BranchManagerApiResponse>>(`${this.BRANCH_MANAGER_API}/${branchId}/manager`, request)
      .pipe(map(res => this.normalizeManager(res.data)));
  }

  removeBranchManager(branchId: string): Observable<BranchManagerResponse> {
    return this.http
      .delete<ApiResponse<BranchManagerApiResponse>>(`${this.BRANCH_MANAGER_API}/${branchId}/manager`)
      .pipe(map(res => this.normalizeManager(res.data)));
  }

  private normalizeBranch(branch: OrganizationBranchApiResponse): OrganizationBranchResponse {
    return {
      ...branch,
      branchAddress: branch.branchAddress ?? branch.address ?? null,
      branchPhone: branch.branchPhone ?? branch.phone ?? null,
      branchStatus: branch.branchStatus ?? branch.status ?? null
    };
  }

  private normalizeManager(response: BranchManagerApiResponse): BranchManagerResponse {
    const manager = response.manager ?? response;
    const managerId = response.managerId ?? manager.managerId ?? manager.employeeId ?? manager.id ?? null;

    return {
      ...response,
      ...manager,
      branchId: response.branchId ?? manager.branchId ?? '',
      branchName: response.branchName ?? manager.branchName ?? '',
      branchAddress: response.branchAddress ?? manager.branchAddress ?? null,
      branchPhone: response.branchPhone ?? manager.branchPhone ?? null,
      branchStatus: response.branchStatus ?? response.branchStauts ?? manager.branchStatus ?? manager.branchStauts ?? null,
      employeeId: manager.employeeId ?? managerId,
      managerId,
      userId: manager.userId ?? response.managerUserId ?? null,
      managerUserId: manager.managerUserId ?? manager.userId ?? response.managerUserId ?? null,
      username: manager.username ?? null,
      managerName: response.managerName ?? manager.managerName ?? manager.fullName ?? this.buildFullName(manager.firstName, manager.lastName),
      email: manager.email ?? null,
      enabled: manager.enabled ?? false,
      phone: manager.phone ?? null,
      status: manager.status ?? null,
      startDate: manager.startDate ?? null,
      endDate: manager.endDate ?? null,
      orgRoleId: manager.orgRoleId ?? null,
      orgRoleName: manager.orgRoleName ?? null,
      role: manager.role ?? manager.orgRoleName ?? null
    };
  }

  private buildFullName(firstName: string | null | undefined, lastName: string | null | undefined): string | null {
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    return fullName || null;
  }
}
