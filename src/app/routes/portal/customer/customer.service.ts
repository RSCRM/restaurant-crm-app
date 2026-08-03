import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  CreateVoucherRequest,
  CustomerPointResponse,
  CustomerResponse,
  CustomerVoucherResponse,
  GiveVoucherRequest,
  IdentifyCustomerRequest,
  PagingParams,
  PagingResponse,
  PointTransactionResponse,
  PointWalletBalanceResponse,
  RedeemVoucherRequest,
  UpdateVoucherRequest,
  VoucherResponse
} from './customer.model';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private readonly CRM_API = '/api/v1/crm';

  // 1. Identify / Auto-create Customer by Phone
  identifyCustomer(request: IdentifyCustomerRequest): Observable<CustomerResponse> {
    return this.http.post<ApiResponse<CustomerResponse>>(`${this.CRM_API}/customers/identify`, request).pipe(map(res => res.data));
  }

  // 2. Get Customer Details by ID
  getCustomerById(customerId: string): Observable<CustomerResponse> {
    return this.http.get<ApiResponse<CustomerResponse>>(`${this.CRM_API}/customers/${customerId}`).pipe(map(res => res.data));
  }

  // 2b. Get Organization Branches (for dynamic branchId resolution)
  getOrganizationBranches(organizationId: string): Observable<Array<{ id: string; name: string }>> {
    return this.http
      .get<ApiResponse<PagingResponse<{ id: string; name: string }>>>(`/api/v1/erp/organization-branches/organization/${organizationId}`)
      .pipe(map(res => res.data?.data || []));
  }

  // 3. Get Point Wallet Balance
  getWalletBalance(customerId: string, restaurantId: string): Observable<PointWalletBalanceResponse> {
    const params = new HttpParams().set('customerId', customerId).set('organizationId', restaurantId);

    return this.http.get<ApiResponse<PointWalletBalanceResponse>>(`${this.CRM_API}/wallets/balance`, { params }).pipe(map(res => res.data));
  }

  // 4. Get Point History
  getPointHistory(customerId: string, restaurantId: string, paging: PagingParams): Observable<PagingResponse<PointTransactionResponse>> {
    const params = new HttpParams()
      .set('customerId', customerId)
      .set('organizationId', restaurantId)
      .set('page', paging.page.toString())
      .set('size', paging.size.toString());

    return this.http
      .get<ApiResponse<PagingResponse<PointTransactionResponse>>>(`${this.CRM_API}/wallets/history`, { params })
      .pipe(map(res => res.data));
  }

  // 5. Get Customer's Vouchers
  getCustomerVouchers(customerId: string, restaurantId: string, paging: PagingParams): Observable<PagingResponse<CustomerVoucherResponse>> {
    const params = new HttpParams()
      .set('customerId', customerId)
      .set('branchId', restaurantId)
      .set('page', paging.page.toString())
      .set('size', paging.size.toString());

    return this.http
      .get<ApiResponse<PagingResponse<CustomerVoucherResponse>>>(`${this.CRM_API}/customer-vouchers`, { params })
      .pipe(map(res => res.data));
  }

  // 6. Get All System Vouchers
  getVouchers(restaurantId: string, paging: PagingParams): Observable<PagingResponse<VoucherResponse>> {
    const params = new HttpParams()
      .set('branchId', restaurantId)
      .set('page', paging.page.toString())
      .set('size', paging.size.toString());

    return this.http.get<ApiResponse<PagingResponse<VoucherResponse>>>(`${this.CRM_API}/vouchers`, { params }).pipe(map(res => res.data));
  }

  // 7. Get Active System Vouchers (for redeem/give selection)
  getActiveVouchers(restaurantId: string, paging: PagingParams): Observable<PagingResponse<VoucherResponse>> {
    const params = new HttpParams()
      .set('branchId', restaurantId)
      .set('page', paging.page.toString())
      .set('size', paging.size.toString());

    return this.http
      .get<ApiResponse<PagingResponse<VoucherResponse>>>(`${this.CRM_API}/vouchers/active`, { params })
      .pipe(map(res => res.data));
  }

  // 8. Create System Voucher
  createVoucher(request: CreateVoucherRequest): Observable<VoucherResponse> {
    return this.http.post<ApiResponse<VoucherResponse>>(`${this.CRM_API}/vouchers`, request).pipe(map(res => res.data));
  }

  // 9. Update System Voucher (or toggle isActive)
  updateVoucher(id: string, request: UpdateVoucherRequest): Observable<VoucherResponse> {
    return this.http.put<ApiResponse<VoucherResponse>>(`${this.CRM_API}/vouchers/${id}`, request).pipe(map(res => res.data));
  }

  // 10. Redeem Voucher (Deduct points & grant voucher to customer)
  redeemVoucher(request: RedeemVoucherRequest): Observable<CustomerVoucherResponse> {
    return this.http
      .post<ApiResponse<CustomerVoucherResponse>>(`${this.CRM_API}/customer-vouchers/redeem`, request)
      .pipe(map(res => res.data));
  }

  // 11. Give Voucher (Grant free voucher to customer without deducting points)
  giveVoucher(request: GiveVoucherRequest): Observable<CustomerVoucherResponse> {
    const params = new HttpParams()
      .set('customerId', request.customerId)
      .set('branchId', request.branchId)
      .set('voucherId', request.voucherId);

    return this.http
      .post<ApiResponse<CustomerVoucherResponse>>(`${this.CRM_API}/customer-vouchers/give`, null, { params })
      .pipe(map(res => res.data));
  }

  // 12. Get Organization Member Customers
  getOrganizationCustomers(restaurantId: string, searchPhone?: string, paging?: PagingParams): Observable<PagingResponse<CustomerPointResponse>> {
    let params = new HttpParams()
      .set('page', (paging?.page || 1).toString())
      .set('size', (paging?.size || 10).toString());

    if (searchPhone && searchPhone.trim()) {
      params = params.set('searchPhone', searchPhone.trim());
    }

    return this.http
      .get<ApiResponse<PagingResponse<CustomerPointResponse>>>(`${this.CRM_API}/wallets/organization/${restaurantId}/list`, { params })
      .pipe(map(res => res.data));
  }
}
