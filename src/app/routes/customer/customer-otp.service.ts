import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ALLOW_ANONYMOUS } from '@delon/auth';
import { map, Observable } from 'rxjs';

import { CustomerApiResponse, OtpRequestBody, OtpRequestResponse, OtpVerifyBody, OtpVerifyResponse } from './customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerOtpService {
  private readonly http = inject(HttpClient);

  private readonly BASE = '/api/v1/public/customer/otp';

  requestOtp(request: OtpRequestBody): Observable<OtpRequestResponse> {
    return this.http
      .post<CustomerApiResponse<OtpRequestResponse>>(`${this.BASE}/request`, request, { context: anonymous() })
      .pipe(map(res => res.data));
  }

  verifyOtp(request: OtpVerifyBody): Observable<OtpVerifyResponse> {
    return this.http
      .post<CustomerApiResponse<OtpVerifyResponse>>(`${this.BASE}/verify`, request, { context: anonymous() })
      .pipe(map(res => res.data));
  }
}

function anonymous(): HttpContext {
  return new HttpContext().set(ALLOW_ANONYMOUS, true);
}
