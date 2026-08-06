import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  BookingResponse,
  CreateBookingRequest,
  PagingParams,
  PagingResponse,
  UpdateBookingStatusRequest,
  TableSearchResponse
} from './booking.model';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);
  private readonly API = '/api/v1/crm/bookings';

  getTables(params: { page: number; size: number }): Observable<PagingResponse<TableSearchResponse>> {
    const httpParams = new HttpParams().set('page', params.page.toString()).set('size', params.size.toString());

    return this.http
      .get<ApiResponse<PagingResponse<TableSearchResponse>>>('/api/v1/erp/tables/search', { params: httpParams })
      .pipe(map(res => res.data));
  }

  createBooking(request: CreateBookingRequest): Observable<BookingResponse> {
    return this.http.post<ApiResponse<BookingResponse>>(this.API, request).pipe(map(res => res.data));
  }

  getBookingsByBranch(branchId: string, params: PagingParams): Observable<PagingResponse<BookingResponse>> {
    const httpParams = new HttpParams().set('page', params.page.toString()).set('size', params.size.toString());

    return this.http
      .get<ApiResponse<PagingResponse<BookingResponse>>>(`${this.API}/branch/${branchId}`, { params: httpParams })
      .pipe(map(res => res.data));
  }

  getBookingsByCustomer(customerId: string, params: PagingParams): Observable<PagingResponse<BookingResponse>> {
    const httpParams = new HttpParams().set('page', params.page.toString()).set('size', params.size.toString());

    return this.http
      .get<ApiResponse<PagingResponse<BookingResponse>>>(`${this.API}/customer/${customerId}`, { params: httpParams })
      .pipe(map(res => res.data));
  }

  getBookingsByCustomerPhone(phone: string, params: PagingParams): Observable<PagingResponse<BookingResponse>> {
    const httpParams = new HttpParams().set('page', params.page.toString()).set('size', params.size.toString());

    return this.http
      .get<ApiResponse<PagingResponse<BookingResponse>>>(`${this.API}/phone/${phone}`, { params: httpParams })
      .pipe(map(res => res.data));
  }

  getBookingById(id: string): Observable<BookingResponse> {
    return this.http.get<ApiResponse<BookingResponse>>(`${this.API}/${id}`).pipe(map(res => res.data));
  }

  updateBookingStatus(id: string, request: UpdateBookingStatusRequest): Observable<BookingResponse> {
    return this.http.patch<ApiResponse<BookingResponse>>(`${this.API}/${id}/status`, request).pipe(map(res => res.data));
  }
}
