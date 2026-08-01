import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, map } from 'rxjs';

import { ApiResponse } from '../../auth/models/auth.model';
import {
  CreateLicenseRequest,
  DeleteLicenseResponse,
  GrantSubscriptionRequest,
  LicenseDetailResponse,
  LicenseResponse,
  PagingParams,
  PagingResponse,
  SubscriptionResponse,
  UpdateLicenseRequest
} from './license.model';

const API = environment.api['apiPrefix'];

@Injectable({ providedIn: 'root' })
export class LicenseService {
  private http = inject(HttpClient);

  private readonly LICENSE_API = `${API}/admin/licenses`;
  private readonly SUBSCRIPTION_API = `${API}/admin/subscriptions`;

  // === License endpoints ===

  getLicenses(params: PagingParams): Observable<PagingResponse<LicenseResponse>> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('size', params.size.toString())
      .set('search', params.search || '');
    if (params.direction) httpParams = httpParams.set('direction', params.direction);
    if (params.field) httpParams = httpParams.set('field', params.field);


    return this.http
      .get<ApiResponse<PagingResponse<LicenseResponse>>>(this.LICENSE_API, { params: httpParams })
      .pipe(map(res => res.data));
  }

  createLicense(request: CreateLicenseRequest): Observable<LicenseResponse> {
    return this.http
      .post<ApiResponse<LicenseResponse>>(this.LICENSE_API, request)
      .pipe(map(res => res.data));
  }

  updateLicense(id: string, request: UpdateLicenseRequest): Observable<LicenseResponse> {
    return this.http
      .put<ApiResponse<LicenseResponse>>(`${this.LICENSE_API}/${id}`, request)
      .pipe(map(res => res.data));
  }

  deleteLicense(id: string): Observable<DeleteLicenseResponse> {
    return this.http
      .delete<ApiResponse<DeleteLicenseResponse>>(`${this.LICENSE_API}/${id}`)
      .pipe(map(res => res.data));
  }

  lockLicense(id: string): Observable<LicenseResponse> {
    return this.http
      .patch<ApiResponse<LicenseResponse>>(`${this.LICENSE_API}/${id}/lock`, {})
      .pipe(map(res => res.data));
  }

  reactivateLicense(id: string): Observable<LicenseResponse> {
    return this.http
      .patch<ApiResponse<LicenseResponse>>(`${this.LICENSE_API}/${id}/reactivate`, {})
      .pipe(map(res => res.data));
  }

  getLicenseDetail(id: string, page = 0, size = 20): Observable<LicenseDetailResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<ApiResponse<LicenseDetailResponse>>(`${this.LICENSE_API}/${id}/detail`, { params })
      .pipe(map(res => res.data));
  }

  // === Subscription endpoints ===

  grantSubscription(request: GrantSubscriptionRequest): Observable<SubscriptionResponse> {
    return this.http
      .post<ApiResponse<SubscriptionResponse>>(this.SUBSCRIPTION_API, request)
      .pipe(map(res => res.data));
  }

  renewSubscription(id: string): Observable<SubscriptionResponse> {
    return this.http
      .post<ApiResponse<SubscriptionResponse>>(`${this.SUBSCRIPTION_API}/${id}/renew`, {})
      .pipe(map(res => res.data));
  }

  revokeSubscription(id: string): Observable<SubscriptionResponse> {
    return this.http
      .post<ApiResponse<SubscriptionResponse>>(`${this.SUBSCRIPTION_API}/${id}/revoke`, {})
      .pipe(map(res => res.data));
  }
}
