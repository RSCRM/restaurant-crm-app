import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AvailableTable, PagingResponse, RegisterGuestRequest, TableSession } from './table.model';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.api.baseUrl}${environment.api['apiPrefix']}`;

  getAvailableTables(): Observable<AvailableTable[]> {
    const params = new HttpParams().set('status', 'AVAILABLE').set('page', 1).set('size', 100);
    return this.http
      .get<ApiResponse<PagingResponse<AvailableTable>>>(`${this.base}/erp/tables/search`, { params })
      .pipe(map(response => response.data.data));
  }

  registerGuest(request: RegisterGuestRequest): Observable<TableSession> {
    return this.http.post<ApiResponse<TableSession>>(`${this.base}/table-sessions`, request).pipe(map(response => response.data));
  }
}
