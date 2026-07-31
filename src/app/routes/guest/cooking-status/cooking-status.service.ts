import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ALLOW_ANONYMOUS } from '@delon/auth';
import { Observable, catchError, map, of } from 'rxjs';

import { OrderCookingStatusResponse, Product } from './cooking-status.model';
import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class CookingStatusService {
  private http = inject(HttpClient);

  // 1. Get active order cooking status for a table
  getActiveOrderCookingStatusByTable(tableId: string): Observable<OrderCookingStatusResponse> {
    return this.http
      .get<ApiResponse<OrderCookingStatusResponse>>(`/api/v1/orders/tables/${tableId}/active-order/cooking-status`, {
        context: new HttpContext().set(ALLOW_ANONYMOUS, true)
      })
      .pipe(map(res => res.data));
  }

  // 2. Fetch products for branch
  getProducts(branchId: string): Observable<Product[]> {
    return this.http
      .get<ApiResponse<Product[]>>('/api/v1/erp/products', {
        params: { branchId },
        context: new HttpContext().set(ALLOW_ANONYMOUS, true)
      })
      .pipe(map(res => res.data));
  }

  // 3. Create or append order
  createOrder(request: {
    branchId: string;
    tableId: string;
    orderType: string;
    customerPhone?: string;
    items: Array<{ productId: string; quantity: number; note?: string }>;
  }): Observable<any> {
    return this.http
      .post<ApiResponse<any>>('/api/v1/orders', request, {
        context: new HttpContext().set(ALLOW_ANONYMOUS, true)
      })
      .pipe(map(res => res.data));
  }

  // 4. Connect to SSE Stream for real-time cooking status updates
  subscribeCookingStatusSSE(orderId: string): Observable<OrderCookingStatusResponse> {
    return new Observable<OrderCookingStatusResponse>(observer => {
      const url = `/api/v1/orders/${orderId}/cooking-status/subscribe`;
      const eventSource = new EventSource(url);

      // Listen to status updates
      eventSource.addEventListener('ORDER_ITEM_STATUS_UPDATED', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as OrderCookingStatusResponse;
          observer.next(data);
        } catch (e) {
          observer.error(e);
        }
      });

      // Handshake listener
      eventSource.addEventListener('INIT', (event: MessageEvent) => {
        console.log('SSE connection handshake for order:', orderId, event.data);
      });

      eventSource.onerror = err => {
        // Log error but do not close stream immediately (browser handles auto reconnect)
        console.warn('SSE EventSource error for order:', orderId, err);
        observer.error(err);
      };

      // Unsubscribe callback
      return () => {
        console.log('Closing SSE EventSource for order:', orderId);
        eventSource.close();
      };
    });
  }
}
