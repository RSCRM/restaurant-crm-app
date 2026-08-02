import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { 
  CheckPhoneRequest,
  CheckPhoneResponse,
  CustomerResponse,
  VerifyAndCreateCustomerRequest
} from './customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private readonly STORAGE_KEY = 'CRM_CUSTOMER_SESSION';

  // 1. check phone-number existed? 
  checkPhone(request: CheckPhoneRequest): Observable<CheckPhoneResponse> {
    return this.http
      .post<{ success: boolean; data: CheckPhoneResponse }>('/api/v1/public/customers/check-phone', request)
      .pipe(map(response => response.data));
  }

  // 2. send OTP
  sendOtp(phone: string): Observable<boolean> {
    return this.http
      .post<{ success: boolean; data: boolean }>('/api/v1/public/otp/request', { phone })
      .pipe(map(response => response.data));
  }

  // 3. Verify OTP & save new cútomer
  verifyAndCreate(request: VerifyAndCreateCustomerRequest): Observable<CustomerResponse> {
    return this.http
      .post<{ success: boolean; data: CustomerResponse }>('/api/v1/public/customers/verify', request)
      .pipe(
        map(response => {
          this.saveSession(response.data);
          return response.data;
        })
      );
  }
    decodeQrToken(token: string): { branchId: string; tableId: string } | null {
    try {
        const base64Url = token.split('.')[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        return JSON.parse(decodeURIComponent(escape(atob(base64))));
    } catch {
        return null;
    }
    }
  saveSession(customer: CustomerResponse): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customer));
  }

  getSession(): CustomerResponse | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }
}