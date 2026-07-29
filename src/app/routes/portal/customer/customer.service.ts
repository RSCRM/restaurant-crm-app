import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CustomerResponse,
  CustomerPointResponse,
  CustomerPointHistoryResponse,
  CustomerVoucherResponse,
  VoucherResponse,
  VoucherCreationRequest,
  VoucherUpdateRequest,
  VoucherRedeemRequest
} from './customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);

  // 1. Identify / Initialize Customer Wallet
  identifyCustomer(phone: string, organizationId: string): Observable<any> {
    return this.http.post<any>('/api/v1/crm/customers/identify', { phone, restaurantId: organizationId });
  }

  // 2. Point Wallet Balance
  getWalletBalance(customerId: string, organizationId: string): Observable<any> {
    return this.http.get<any>('/api/v1/crm/wallets/balance', {
      params: { customerId, organizationId }
    });
  }

  // 3. Point Transaction History
  getPointHistory(customerId: string, organizationId: string, params: { page: number; size: number }): Observable<any> {
    return this.http.get<any>('/api/v1/crm/wallets/history', {
      params: {
        customerId,
        organizationId,
        page: params.page.toString(),
        size: params.size.toString()
      }
    });
  }

  // 4. Customer Voucher List
  getCustomerVouchers(customerId: string, branchId: string, params: { page: number; size: number }): Observable<any> {
    return this.http.get<any>('/api/v1/crm/customer-vouchers', {
      params: {
        customerId,
        branchId,
        page: params.page.toString(),
        size: params.size.toString()
      }
    });
  }

  // 5. General active Vouchers (for catalog)
  getActiveVouchers(branchId: string, params: { page: number; size: number }): Observable<any> {
    return this.http.get<any>('/api/v1/crm/vouchers/active', {
      params: {
        branchId,
        page: params.page.toString(),
        size: params.size.toString()
      }
    });
  }

  // 6. Create Voucher System
  createVoucher(request: VoucherCreationRequest): Observable<any> {
    return this.http.post<any>('/api/v1/crm/vouchers', request);
  }

  // 7. Update Voucher System (for toggling isActive)
  updateVoucher(id: string, request: VoucherUpdateRequest): Observable<any> {
    return this.http.put<any>(`/api/v1/crm/vouchers/${id}`, request);
  }

  // 8. Redeem points for Voucher
  redeemVoucher(request: VoucherRedeemRequest): Observable<any> {
    return this.http.post<any>('/api/v1/crm/customer-vouchers/redeem', request);
  }
}
