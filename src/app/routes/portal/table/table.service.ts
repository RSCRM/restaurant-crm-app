import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { PagingResponse, TableSearchItem, TableSearchParams } from './table.model';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.api.baseUrl}${environment.api['apiPrefix']}/erp/tables`;

  search(filters: TableSearchParams): Observable<PagingResponse<TableSearchItem>> {
    let params = new HttpParams().set('page', filters.page).set('size', filters.size);
    if (filters.keyword) params = params.set('keyword', filters.keyword);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.minCapacity != null) params = params.set('minCapacity', filters.minCapacity);
    if (filters.maxCapacity != null) params = params.set('maxCapacity', filters.maxCapacity);

    return this.http
      .get<ApiResponse<PagingResponse<TableSearchItem>>>(`${this.api}/search`, { params })
      .pipe(map(response => response.data));
  }
}
