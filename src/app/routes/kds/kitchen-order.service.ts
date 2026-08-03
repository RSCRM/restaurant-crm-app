import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, map } from 'rxjs';

import { ApiResponse, KdsActiveResponse, OrderItemResponse } from './kitchen-order.model';

const API = environment.api['apiPrefix'];
const EMPTY_ACTIVE: KdsActiveResponse = { waitingSummary: [], waitingItems: [], preparingItems: [] };

/**
 * KDS module: read side (uc-scf-ui-01 + uc-scf-ui-02) and status-change actions.
 */
@Injectable({ providedIn: 'root' })
export class KitchenOrderService {
  private readonly http = inject(HttpClient);
  private readonly kdsApi = `${API}/kds`;
  private readonly orderItemsApi = `${API}/order-items`;

  /**
   * Active kitchen board. Backend derives the branch from the token (NFR-07) and
   * returns waitingSummary / waitingItems / preparingItems, already branch-filtered.
   */
  getKitchenItems(section: 'ACTIVE' | 'HISTORY' = 'ACTIVE'): Observable<KdsActiveResponse> {
    const params = new HttpParams().set('section', section);
    return this.http.get<ApiResponse<KdsActiveResponse>>(`${this.kdsApi}/items`, { params }).pipe(map(res => res?.data ?? EMPTY_ACTIVE));
  }

  /** Kitchen accepts an item for preparation: PENDING -> IN_PROGRESS (uc-scf-ui-03). */
  acceptItem(orderItemId: string): Observable<OrderItemResponse> {
    return this.http.patch<ApiResponse<OrderItemResponse>>(`${this.orderItemsApi}/${orderItemId}/accept`, {}).pipe(map(res => res.data));
  }

  /** Kitchen marks preparation done: IN_PROGRESS -> READY_TO_SERVE (uc-scf-ui-05). */
  completeItem(orderItemId: string): Observable<OrderItemResponse> {
    return this.http.patch<ApiResponse<OrderItemResponse>>(`${this.orderItemsApi}/${orderItemId}/complete`, {}).pipe(map(res => res.data));
  }

  /** Kitchen cancels the item, reason required: PENDING/IN_PROGRESS -> CANCELLED (uc-scf-ui-06). */
  cancelItem(orderItemId: string, reason: string): Observable<OrderItemResponse> {
    return this.http
      .patch<ApiResponse<OrderItemResponse>>(`${this.orderItemsApi}/${orderItemId}/cancel`, { reason })
      .pipe(map(res => res.data));
  }
}
