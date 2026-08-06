import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { BranchManagerResponse, BranchMutationRequest, OrganizationBranchResponse, PagingParams, PagingResponse } from './branch.model';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private http = inject(HttpClient);

  private readonly BRANCH_API = '/api/v1/erp/organization-branches';
  private readonly BRANCH_MANAGER_API = '/api/v1/personal/branches';

  getBranches(organizationId: string, params: PagingParams): Observable<PagingResponse<OrganizationBranchResponse>> {
    const httpParams = new HttpParams().set('page', params.page.toString()).set('size', params.size.toString());

    return this.http
      .get<ApiResponse<PagingResponse<OrganizationBranchResponse>>>(`${this.BRANCH_API}/organization/${organizationId}`, {
        params: httpParams
      })
      .pipe(map(res => res.data));
  }

  getBranch(branchId: string): Observable<OrganizationBranchResponse> {
    return this.http.get<ApiResponse<OrganizationBranchResponse>>(`${this.BRANCH_API}/${branchId}`).pipe(map(res => res.data));
  }

  createBranch(request: BranchMutationRequest): Observable<OrganizationBranchResponse> {
    return this.http.post<ApiResponse<OrganizationBranchResponse>>(this.BRANCH_API, request).pipe(map(res => res.data));
  }

  updateBranch(branchId: string, request: BranchMutationRequest): Observable<OrganizationBranchResponse> {
    return this.http.patch<ApiResponse<OrganizationBranchResponse>>(`${this.BRANCH_API}/${branchId}`, request).pipe(map(res => res.data));
  }

  deleteBranch(branchId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.BRANCH_API}/${branchId}`).pipe(map(() => undefined));
  }

  getBranchManager(branchId: string): Observable<BranchManagerResponse> {
    return this.http.get<ApiResponse<BranchManagerResponse>>(`${this.BRANCH_MANAGER_API}/${branchId}/manager`).pipe(map(res => res.data));
  }

  assignManager(branchId: string, managerUserId: string): Observable<BranchManagerResponse> {
    return this.http
      .put<ApiResponse<BranchManagerResponse>>(`${this.BRANCH_MANAGER_API}/${branchId}/manager`, { managerId: managerUserId })
      .pipe(map(res => res.data));
  }

  removeManager(branchId: string): Observable<BranchManagerResponse> {
    return this.http
      .delete<ApiResponse<BranchManagerResponse>>(`${this.BRANCH_MANAGER_API}/${branchId}/manager`)
      .pipe(map(res => res.data));
  }
}
