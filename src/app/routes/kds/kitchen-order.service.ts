import { Injectable, inject } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { Observable, map } from 'rxjs';

import { ApiResponse, KdsActiveResponse } from './kitchen-order.model';

const EMPTY_ACTIVE: KdsActiveResponse = { waitingSummary: [], waitingItems: [], preparingItems: [] };

@Injectable({ providedIn: 'root' })
export class KitchenOrderService {
  private readonly http = inject(_HttpClient);
  private readonly endpoint = '/api/v1/kds/items';

  /**
   * Active kitchen board for the caller's branch (uc-scf-01 + uc-scf-02).
   * Backend takes the branch from the token (NFR-07); returns waiting summary,
   * waiting items and preparing items, already branch-filtered.
   */
  getActiveBoard(): Observable<KdsActiveResponse> {
    return this.http.get<ApiResponse<KdsActiveResponse>>(this.endpoint, { section: 'ACTIVE' }).pipe(map(res => res?.data ?? EMPTY_ACTIVE));
  }
}
