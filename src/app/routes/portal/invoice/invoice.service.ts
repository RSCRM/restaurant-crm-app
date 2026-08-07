import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { CheckoutRequest, InvoiceResponse, CustomerVoucherApplicableResponse } from './invoice.model';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient);

  private readonly API = '/api/v1/erp/invoices';

  getInvoiceDetails(id: string): Observable<InvoiceResponse> {
    return this.http.get<ApiResponse<InvoiceResponse>>(`${this.API}/${id}`).pipe(map(res => res.data));
  }

  checkout(request: CheckoutRequest): Observable<InvoiceResponse> {
    return this.http.post<ApiResponse<InvoiceResponse>>(`${this.API}/checkout`, request).pipe(map(res => res.data));
  }

  getApplicableVouchers(orderId: string): Observable<CustomerVoucherApplicableResponse[]> {
    return this.http
      .get<ApiResponse<CustomerVoucherApplicableResponse[]>>(`/api/v1/erp/orders/${orderId}/applicable-vouchers`)
      .pipe(map(res => res.data));
  }

  applyVoucher(orderId: string, customerVoucherId: string): Observable<void> {
    return this.http
      .post<ApiResponse<any>>(`/api/v1/erp/orders/${orderId}/apply-voucher?customerVoucherId=${customerVoucherId}`, null)
      .pipe(map(() => undefined));
  }

  removeVoucher(orderId: string): Observable<void> {
    return this.http.post<ApiResponse<any>>(`/api/v1/erp/orders/${orderId}/remove-voucher`, null).pipe(map(() => undefined));
  }
}
