import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, map } from 'rxjs';

import { ApiResponse, KdsActiveResponse } from './kitchen-order.model';

const API = environment.api['apiPrefix'];
const EMPTY_ACTIVE: KdsActiveResponse = { waitingSummary: [], waitingItems: [], preparingItems: [] };

/**
 * Read side of the KDS module (uc-scf-ui-01 + uc-scf-ui-02).
 * Status-change actions live in a follow-up PR.
 */
@Injectable({ providedIn: 'root' })
export class KitchenOrderService {
  private readonly http = inject(HttpClient);
  private readonly kdsApi = `${API}/kds`;

  /**
   * Active kitchen board. Backend derives the branch from the token (NFR-07) and
   * returns waitingSummary / waitingItems / preparingItems, already branch-filtered.
   */
  getKitchenItems(section: 'ACTIVE' | 'HISTORY' = 'ACTIVE'): Observable<KdsActiveResponse> {
    const params = new HttpParams().set('section', section);
    return this.http.get<ApiResponse<KdsActiveResponse>>(`${this.kdsApi}/items`, { params }).pipe(map(res => res?.data ?? EMPTY_ACTIVE));
  }
}
