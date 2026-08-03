import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ALLOW_ANONYMOUS } from '@delon/auth';
import { map, Observable } from 'rxjs';

import { USE_CUSTOMER_SESSION_TOKEN } from './customer-session.store';
import { CustomerApiResponse, QrResolveResponse, QrSessionJoinRequest, QrSessionResponse, QrSessionStartRequest } from './customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerQrService {
  private readonly http = inject(HttpClient);

  private readonly PUBLIC_BASE = '/api/v1/public/customer/qr';
  private readonly SESSION_BASE = '/api/v1/customer/qr/session';

  resolve(qrToken: string): Observable<QrResolveResponse> {
    return this.http
      .post<CustomerApiResponse<QrResolveResponse>>(`${this.PUBLIC_BASE}/resolve`, { qrToken }, { context: anonymous() })
      .pipe(map(res => res.data));
  }

  startSession(request: QrSessionStartRequest): Observable<QrSessionResponse> {
    return this.http
      .post<CustomerApiResponse<QrSessionResponse>>(`${this.PUBLIC_BASE}/session`, request, { context: anonymous() })
      .pipe(map(res => res.data));
  }

  joinSession(request: QrSessionJoinRequest): Observable<QrSessionResponse> {
    return this.http
      .post<CustomerApiResponse<QrSessionResponse>>(`${this.PUBLIC_BASE}/session/join`, request, { context: anonymous() })
      .pipe(map(res => res.data));
  }

  getSession(): Observable<QrSessionResponse> {
    return this.http
      .get<CustomerApiResponse<QrSessionResponse>>(this.SESSION_BASE, { context: customerSession() })
      .pipe(map(res => res.data));
  }

  refreshGroupQr(): Observable<QrSessionResponse> {
    return this.http
      .post<CustomerApiResponse<QrSessionResponse>>(`${this.SESSION_BASE}/group-qr/refresh`, null, { context: customerSession() })
      .pipe(map(res => res.data));
  }

  heartbeat(): Observable<QrSessionResponse> {
    return this.http
      .post<CustomerApiResponse<QrSessionResponse>>(`${this.SESSION_BASE}/heartbeat`, null, { context: customerSession() })
      .pipe(map(res => res.data));
  }
}

function anonymous(): HttpContext {
  return new HttpContext().set(ALLOW_ANONYMOUS, true);
}

function customerSession(): HttpContext {
  return new HttpContext().set(USE_CUSTOMER_SESSION_TOKEN, true);
}
