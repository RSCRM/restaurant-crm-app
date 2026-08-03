import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse } from '../../auth/models/auth.model';
import { CheckoutRequest, InvoiceResponse } from './invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient);

  private readonly API = '/api/v1/erp/invoices';

  getInvoiceDetails(id: string): Observable<InvoiceResponse> {
    return this.http
      .get<ApiResponse<InvoiceResponse>>(`${this.API}/${id}`)
      .pipe(map(res => res.data));
  }

  checkout(request: CheckoutRequest): Observable<InvoiceResponse> {
    return this.http
      .post<ApiResponse<InvoiceResponse>>(`${this.API}/checkout`, request)
      .pipe(map(res => res.data));
  }
}
