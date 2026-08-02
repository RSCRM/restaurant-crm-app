import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, switchMap } from 'rxjs';

import { PagingResponse, TableMap, TableSearchItem, TableSearchParams, TableSession } from './table.model';
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

  getTransferOptions(): Observable<{ occupied: TableSearchItem[]; available: TableSearchItem[] }> {
    return forkJoin({ occupied: this.searchByStatus('OCCUPIED'), available: this.searchByStatus('AVAILABLE') });
  }

  transfer(sourceTableId: string, targetTableId: string): Observable<TableSession> {
    const params = new HttpParams().set('tableId', sourceTableId);
    return this.http.get<ApiResponse<TableSession>>(`${this.base}/table-sessions/active`, { params }).pipe(
      map(response => response.data),
      switchMap(session =>
        this.http
          .put<ApiResponse<TableSession>>(`${this.base}/table-sessions/${session.id}/transfer`, { targetTableId })
          .pipe(map(response => response.data))
      )
    );
  }

  private searchByStatus(status: TableSearchItem['status']): Observable<TableSearchItem[]> {
    return this.search({ status, page: 1, size: 100 }).pipe(map(response => response.data));
  }
}
