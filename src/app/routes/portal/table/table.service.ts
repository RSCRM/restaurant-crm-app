import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, switchMap } from 'rxjs';

import { PagingResponse, TableItem, TableSession } from './table.model';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.api.baseUrl}${environment.api['apiPrefix']}`;

  getTransferOptions(): Observable<{ occupied: TableItem[]; available: TableItem[] }> {
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

  private searchByStatus(status: TableItem['status']): Observable<TableItem[]> {
    const params = new HttpParams().set('status', status).set('page', 1).set('size', 100);
    return this.http
      .get<ApiResponse<PagingResponse<TableItem>>>(`${this.base}/erp/tables/search`, { params })
      .pipe(map(response => response.data.data));
  }
}
