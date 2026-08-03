import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, switchMap } from 'rxjs';

import {
  PagingResponse,
  RegisterGuestRequest,
  TableBooking,
  TableMap,
  TableSearchItem,
  TableSearchParams,
  TableSession
} from './table.model';
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

  getActiveBookings(branchId: string): Observable<TableBooking[]> {
    const params = new HttpParams().set('page', 1).set('size', 100);
    return this.http
      .get<ApiResponse<PagingResponse<TableBooking>>>(`${this.base}/crm/bookings/branch/${branchId}`, { params })
      .pipe(map(response => response.data.data.filter(booking => booking.status === 'PENDING' || booking.status === 'CONFIRMED')));
  }

  confirmReservation(tableId: string): Observable<unknown> {
    return this.http
      .put<ApiResponse<unknown>>(`${this.base}/erp/restaurant-tables/${tableId}/reservation/confirm`, {})
      .pipe(map(response => response.data));
  }

  cancelReservation(tableId: string): Observable<unknown> {
    return this.http
      .put<ApiResponse<unknown>>(`${this.base}/erp/restaurant-tables/${tableId}/reservation/cancel`, {})
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

  finish(tableId: string): Observable<TableSession> {
    const params = new HttpParams().set('tableId', tableId);
    return this.http.get<ApiResponse<TableSession>>(`${this.base}/table-sessions/active`, { params }).pipe(
      map(response => response.data),
      switchMap(session =>
        this.http
          .put<ApiResponse<TableSession>>(`${this.base}/table-sessions/${session.id}/close`, {})
          .pipe(map(response => response.data))
      )
    );
  }

  private searchByStatus(status: TableSearchItem['status']): Observable<TableSearchItem[]> {
    return this.search({ status, page: 1, size: 100 }).pipe(map(response => response.data));
  }
}
