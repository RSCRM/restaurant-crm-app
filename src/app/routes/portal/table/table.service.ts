import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';

import { OccupiedTable, PagingResponse, TableSession } from './table.model';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.api.baseUrl}${environment.api['apiPrefix']}`;

  getOccupiedTables(): Observable<OccupiedTable[]> {
    const params = new HttpParams().set('status', 'OCCUPIED').set('page', 1).set('size', 100);
    return this.http
      .get<ApiResponse<PagingResponse<OccupiedTable>>>(`${this.base}/erp/tables/search`, { params })
      .pipe(map(response => response.data.data));
  }

  closeTable(tableId: string): Observable<TableSession> {
    const params = new HttpParams().set('tableId', tableId);
    return this.http.get<ApiResponse<TableSession>>(`${this.base}/table-sessions/active`, { params }).pipe(
      map(response => response.data),
      switchMap(session =>
        this.http.put<ApiResponse<TableSession>>(`${this.base}/table-sessions/${session.id}/close`, {}).pipe(map(response => response.data))
      )
    );
  }
}
