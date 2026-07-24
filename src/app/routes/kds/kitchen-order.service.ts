import { Injectable, inject } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { Observable, map } from 'rxjs';

import { ApiResponse, KitchenOrderItem } from './kitchen-order.model';

@Injectable({ providedIn: 'root' })
export class KitchenOrderService {
  private readonly http = inject(_HttpClient);
  private readonly endpoint = '/api/v1/kitchen/order-items';

  /**
   * FIFO waiting list for the kitchen (uc-scf-01).
   * The branch comes from the caller's token on the server, never from the client (NFR-07).
   * The server already returns the list sorted.
   */
  getQueue(): Observable<KitchenOrderItem[]> {
    return this.http.get<ApiResponse<KitchenOrderItem[]>>(this.endpoint).pipe(map(res => res?.data ?? []));
  }
}
