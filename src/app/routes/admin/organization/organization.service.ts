import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, map } from 'rxjs';

import {
  CreateOrganizationRequest,
  OrganizationResponse,
  OrganizationSearchRequest,
  PagingResponse,
  UpdateOrganizationRequest
} from './organization.model';
import { ApiResponse } from '../../auth/models/auth.model';
import { SubscriptionResponse } from '../license/license.model';

const API = environment.api['apiPrefix'];

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private http = inject(HttpClient);

  private readonly ORG_API = `${API}/erp/organizations`;
  private readonly SUBSCRIPTION_API = `${API}/admin/subscriptions`;

  searchOrganizations(
    filter: OrganizationSearchRequest,
    page = 1,
    size = 10,
    direction = 'DESC',
    field = 'createdAt'
  ): Observable<PagingResponse<OrganizationResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('direction', direction)
      .set('field', field);

    return this.http
      .post<ApiResponse<PagingResponse<OrganizationResponse>>>(`${this.ORG_API}/search`, filter, { params })
      .pipe(map(res => res.data));
  }

  searchOrganizationsWithoutActiveSubscription(
    filter: OrganizationSearchRequest,
    page = 1,
    size = 10,
    direction = 'DESC',
    field = 'createdAt'
  ): Observable<PagingResponse<OrganizationResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('direction', direction)
      .set('field', field);

    return this.http
      .post<ApiResponse<PagingResponse<OrganizationResponse>>>(`${this.ORG_API}/search-without-active-subscription`, filter, { params })
      .pipe(map(res => res.data));
  }

  createOrganization(request: CreateOrganizationRequest): Observable<OrganizationResponse> {
    return this.http.post<ApiResponse<OrganizationResponse>>(this.ORG_API, request).pipe(map(res => res.data));
  }

  getOrganizationById(id: string): Observable<OrganizationResponse> {
    return this.http.get<ApiResponse<OrganizationResponse>>(`${this.ORG_API}/${id}`).pipe(map(res => res.data));
  }

  updateOrganization(id: string, request: UpdateOrganizationRequest): Observable<OrganizationResponse> {
    return this.http.patch<ApiResponse<OrganizationResponse>>(`${this.ORG_API}/${id}`, request).pipe(map(res => res.data));
  }

  searchSubscriptions(
    organizationId: string,
    filter: Record<string, any> = {},
    page = 1,
    size = 10,
    direction = 'DESC',
    field = 'createdAt'
  ): Observable<PagingResponse<SubscriptionResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('direction', direction)
      .set('field', field);

    return this.http
      .post<ApiResponse<PagingResponse<SubscriptionResponse>>>(`${this.SUBSCRIPTION_API}/organization/${organizationId}/search`, filter, {
        params
      })
      .pipe(map(res => res.data));
  }
}
