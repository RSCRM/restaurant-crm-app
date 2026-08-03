import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { PagingResponse, RegisterGuestRequest, TableMap, TableSearchItem, TableSearchParams, TableSession } from './table.model';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.api.baseUrl}${environment.api['apiPrefix']}`;
  private readonly tableApi = `${this.base}/erp/tables`;

  getMap(areaId?: string): Observable<TableMap> {
    const params = areaId ? new HttpParams().set('areaId', areaId) : undefined;
    return this.http.get<ApiResponse<TableMap>>(`${this.tableApi}/map`, { params }).pipe(map(response => response.data));
  }

  search(filters: TableSearchParams): Observable<PagingResponse<TableSearchItem>> {
    let params = new HttpParams().set('page', filters.page).set('size', filters.size);
    if (filters.keyword) params = params.set('keyword', filters.keyword);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.minCapacity != null) params = params.set('minCapacity', filters.minCapacity);

    return this.http
      .get<ApiResponse<PagingResponse<TableSearchItem>>>(`${this.tableApi}/search`, { params })
      .pipe(map(response => response.data));
  }

  registerGuest(request: RegisterGuestRequest): Observable<TableSession> {
    return this.http.post<ApiResponse<TableSession>>(`${this.base}/table-sessions`, request).pipe(map(response => response.data));
  }
}
