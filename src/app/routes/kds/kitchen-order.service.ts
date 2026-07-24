import { Injectable, inject } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { Observable, map } from 'rxjs';

import { ApiResponse, KitchenOrderItem } from './kitchen-order.model';

@Injectable({ providedIn: 'root' })
export class KitchenOrderService {
  private readonly http = inject(_HttpClient);
  private readonly endpoint = '/api/v1/kitchen/order-items';

  /** FIFO waiting list for a branch (uc-scf-01). Server already returns it sorted. */
  getQueue(branchId: string): Observable<KitchenOrderItem[]> {
    return this.http.get<ApiResponse<KitchenOrderItem[]>>(this.endpoint, { branchId }).pipe(map(res => res?.data ?? []));
  }
}
