import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, map } from 'rxjs';

import {
  AddOrderItemRequest,
  AddOrderItemResponse,
  CancelOrderResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  OrderCookingStatusResponse,
  UpdateOrderItemModifiersRequest,
  UpdateOrderItemQuantityRequest
} from './order.model';
import { ApiResponse } from '../../auth/models/auth.model';

const API = environment.api['apiPrefix'];

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);

  private readonly ORDER_API = `${API}/orders`;

  createOrder(request: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<ApiResponse<CreateOrderResponse>>(this.ORDER_API, request).pipe(map(res => res.data));
  }

  getCookingStatus(orderId: string): Observable<OrderCookingStatusResponse> {
    return this.http.get<ApiResponse<OrderCookingStatusResponse>>(`${this.ORDER_API}/${orderId}/cooking-status`).pipe(map(res => res.data));
  }

  getActiveOrderCookingStatusByTable(tableId: string): Observable<OrderCookingStatusResponse> {
    return this.http
      .get<ApiResponse<OrderCookingStatusResponse>>(`${this.ORDER_API}/tables/${tableId}/active-order/cooking-status`)
      .pipe(map(res => res.data));
  }

  addOrderItem(orderId: string, request: AddOrderItemRequest): Observable<AddOrderItemResponse> {
    return this.http.post<ApiResponse<AddOrderItemResponse>>(`${this.ORDER_API}/${orderId}/items`, request).pipe(map(res => res.data));
  }

  updateOrderItemQuantity(orderId: string, orderItemId: string, request: UpdateOrderItemQuantityRequest): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${this.ORDER_API}/${orderId}/items/${orderItemId}/quantity`, request)
      .pipe(map(() => undefined));
  }

  updateOrderItemModifiers(orderId: string, orderItemId: string, request: UpdateOrderItemModifiersRequest): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${this.ORDER_API}/${orderId}/items/${orderItemId}/modifiers`, request)
      .pipe(map(() => undefined));
  }

  cancelOrder(orderId: string): Observable<CancelOrderResponse> {
    return this.http.patch<ApiResponse<CancelOrderResponse>>(`${this.ORDER_API}/${orderId}/cancel`, {}).pipe(map(res => res.data));
  }

  removeOrderItem(orderId: string, orderItemId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.ORDER_API}/${orderId}/items/${orderItemId}`).pipe(map(() => undefined));
  }
}
