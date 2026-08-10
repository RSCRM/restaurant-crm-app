import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';
import { Observable, Observer, map } from 'rxjs';

import {
  QrResolveRequest,
  QrResolveResponse,
  OtpRequestRequest,
  OtpRequestResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  QrSessionStartRequest,
  QrSessionResponse,
  CustomerMenuResponse,
  MenuProductResponse,
  GroupCartResponse,
  GroupCartAddItemRequest,
  GroupCartUpdateItemRequest,
  GroupCartSubmitResponse,
  CustomerOrderTrackingResponse,
  CustomerVoucherApplicableResponse,
  CustomerPointWalletResponse
} from './customer.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  errorMessage: string | null;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);
  private readonly SESSION_KEY = 'CRM_CUSTOMER_SESSION_TOKEN';
  private readonly QR_TOKEN_KEY = 'CRM_QR_TOKEN';

  // === QR Resolve ===
  resolveQr(request: QrResolveRequest): Observable<QrResolveResponse> {
    return this.http.post<ApiResponse<QrResolveResponse>>('/api/v1/public/customer/qr/resolve', request).pipe(map(r => r.data));
  }

  // === OTP ===
  requestOtp(request: OtpRequestRequest): Observable<OtpRequestResponse> {
    return this.http.post<ApiResponse<OtpRequestResponse>>('/api/v1/public/customer/qr/otp/request', request).pipe(map(r => r.data));
  }

  verifyOtp(request: OtpVerifyRequest): Observable<OtpVerifyResponse> {
    return this.http.post<ApiResponse<OtpVerifyResponse>>('/api/v1/public/customer/qr/otp/verify', request).pipe(map(r => r.data));
  }

  // === Session ===
  startSession(request: QrSessionStartRequest): Observable<QrSessionResponse> {
    return this.http.post<ApiResponse<QrSessionResponse>>('/api/v1/public/customer/qr/session', request).pipe(
      map(r => {
        this.saveSessionToken(r.data.sessionToken);
        return r.data;
      })
    );
  }

  // === Menu (requires session token) ===
  getMenu(): Observable<CustomerMenuResponse> {
    return this.http
      .get<ApiResponse<CustomerMenuResponse>>('/api/v1/customer/menu', { headers: this.sessionHeaders() })
      .pipe(map(r => r.data));
  }

  getProduct(productId: string): Observable<MenuProductResponse> {
    return this.http
      .get<ApiResponse<MenuProductResponse>>(`/api/v1/customer/menu/products/${productId}`, { headers: this.sessionHeaders() })
      .pipe(map(r => r.data));
  }

  // === Cart (requires session token) ===
  getCart(): Observable<GroupCartResponse> {
    return this.http
      .get<ApiResponse<GroupCartResponse>>('/api/v1/customer/cart', { headers: this.sessionHeaders() })
      .pipe(map(r => r.data));
  }

  addCartItem(request: GroupCartAddItemRequest): Observable<GroupCartResponse> {
    return this.http
      .post<ApiResponse<GroupCartResponse>>('/api/v1/customer/cart/items', request, { headers: this.sessionHeaders() })
      .pipe(map(r => r.data));
  }

  updateCartItem(cartItemId: string, request: GroupCartUpdateItemRequest): Observable<GroupCartResponse> {
    return this.http
      .put<ApiResponse<GroupCartResponse>>(`/api/v1/customer/cart/items/${cartItemId}`, request, { headers: this.sessionHeaders() })
      .pipe(map(r => r.data));
  }

  deleteCartItem(cartItemId: string): Observable<GroupCartResponse> {
    return this.http
      .delete<ApiResponse<GroupCartResponse>>(`/api/v1/customer/cart/items/${cartItemId}`, { headers: this.sessionHeaders() })
      .pipe(map(r => r.data));
  }

  submitCart(): Observable<GroupCartSubmitResponse> {
    return this.http
      .post<ApiResponse<GroupCartSubmitResponse>>('/api/v1/customer/cart/submit', {}, { headers: this.sessionHeaders() })
      .pipe(map(r => r.data));
  }

  // === Cooking Status (requires session token) ===
  getCookingStatus(): Observable<CustomerOrderTrackingResponse> {
    return this.http
      .get<ApiResponse<CustomerOrderTrackingResponse>>('/api/v1/customer/orders/current/cooking-status', { headers: this.sessionHeaders() })
      .pipe(map(r => r.data));
  }

  subscribeCookingStatus(): Observable<CustomerOrderTrackingResponse> {
    return new Observable((observer: Observer<CustomerOrderTrackingResponse>) => {
      const token = this.getSessionToken();
      const url = `/api/v1/customer/orders/current/cooking-status/subscribe`;
      const eventSource = new EventSource(`${url}${token ? `?token=${token}` : ''}`);

      const handleEvent = (event: MessageEvent) => {
        this.ngZone.run(() => {
          try {
            observer.next(JSON.parse(event.data));
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        });
      };

      eventSource.addEventListener('COOKING_STATUS_UPDATE', handleEvent as EventListener);
      eventSource.addEventListener('message', handleEvent as EventListener);
      eventSource.onerror = () => this.ngZone.run(() => console.warn('SSE cooking status connection warning'));

      return () => {
        eventSource.removeEventListener('COOKING_STATUS_UPDATE', handleEvent as EventListener);
        eventSource.removeEventListener('message', handleEvent as EventListener);
        eventSource.close();
      };
    });
  }

  // === Vouchers & Loyalty (requires session token) ===
  getMyPoints(): Observable<CustomerPointWalletResponse> {
    return this.http
      .get<ApiResponse<CustomerPointWalletResponse>>('/api/v1/customer/loyalty/points', { headers: this.sessionHeaders() })
      .pipe(map(r => r.data));
  }

  getVoucherCatalog(): Observable<CustomerVoucherApplicableResponse[]> {
    return this.http
      .get<ApiResponse<CustomerVoucherApplicableResponse[]>>('/api/v1/customer/loyalty/vouchers/catalog', {
        headers: this.sessionHeaders()
      })
      .pipe(map(r => r.data || []));
  }

  redeemVoucher(voucherId: string): Observable<string> {
    return this.http
      .post<ApiResponse<string>>(`/api/v1/customer/loyalty/vouchers/${voucherId}/redeem`, {}, { headers: this.sessionHeaders() })
      .pipe(map(r => r.data));
  }

  getApplicableVouchers(): Observable<CustomerVoucherApplicableResponse[]> {
    return this.http
      .get<ApiResponse<CustomerVoucherApplicableResponse[]>>('/api/v1/customer/loyalty/vouchers/applicable', {
        headers: this.sessionHeaders()
      })
      .pipe(map(r => r.data || []));
  }

  applyVoucher(customerVoucherId: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`/api/v1/customer/loyalty/vouchers/${customerVoucherId}/apply`, {}, { headers: this.sessionHeaders() })
      .pipe(map(() => void 0));
  }

  applyVoucherCode(voucherCode: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(
        `/api/v1/customer/loyalty/vouchers/code/apply?voucherCode=${encodeURIComponent(voucherCode)}`,
        {},
        { headers: this.sessionHeaders() }
      )
      .pipe(map(() => void 0));
  }

  removeVoucher(): Observable<void> {
    return this.http
      .post<ApiResponse<void>>('/api/v1/customer/loyalty/vouchers/remove', {}, { headers: this.sessionHeaders() })
      .pipe(map(() => void 0));
  }

  // === Token Management ===
  saveSessionToken(token: string): void {
    localStorage.setItem(this.SESSION_KEY, token);
  }
  getSessionToken(): string | null {
    return localStorage.getItem(this.SESSION_KEY);
  }
  clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.QR_TOKEN_KEY);
  }
  saveQrToken(token: string): void {
    localStorage.setItem(this.QR_TOKEN_KEY, token);
  }
  getQrToken(): string | null {
    return localStorage.getItem(this.QR_TOKEN_KEY);
  }
  hasSession(): boolean {
    return !!this.getSessionToken();
  }

  private sessionHeaders(): HttpHeaders {
    const token = this.getSessionToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
