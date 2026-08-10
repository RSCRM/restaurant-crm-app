import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { BranchMutationRequest, BranchSearchParams, OrganizationBranchResponse, PagingResponse } from './branch.model';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private http = inject(HttpClient);

  private readonly BRANCH_API = '/api/v1/erp/organization-branches';

  getBranches(organizationId: string, params: BranchSearchParams): Observable<PagingResponse<OrganizationBranchResponse>> {
    let httpParams = new HttpParams().set('page', params.page.toString()).set('size', params.size.toString());
    const keyword = params.keyword?.trim();

    if (keyword) {
      httpParams = httpParams.set('keyword', keyword);
    }

    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }

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
}