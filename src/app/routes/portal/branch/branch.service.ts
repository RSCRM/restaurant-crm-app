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

  private normalizeManager(manager: BranchManagerApiResponse): BranchManagerResponse {
    return {
      ...manager,
      branchAddress: manager.branchAddress ?? null,
      branchPhone: manager.branchPhone ?? null,
      branchStatus: manager.branchStatus ?? manager.branchStauts ?? null
    };
  }
}
