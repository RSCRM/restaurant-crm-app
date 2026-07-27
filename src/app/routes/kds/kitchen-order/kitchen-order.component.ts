import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Observable, catchError, of, switchMap, timer } from 'rxjs';

import { KdsActiveResponse, KdsItem, WaitingSummary } from '../kitchen-order.model';
import { KitchenOrderService } from '../kitchen-order.service';

/** Poll interval — satisfies the "new items appear within 2s" criterion without WebSocket/SSE. */
const POLL_INTERVAL_MS = 2000;

const EMPTY_BOARD: KdsActiveResponse = { waitingSummary: [], waitingItems: [], preparingItems: [] };

@Component({
  selector: 'app-kitchen-order',
  templateUrl: './kitchen-order.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...SHARED_IMPORTS, NzCardModule, NzTagModule, NzEmptyModule],
  styles: [
    `
      .kds-summary {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      .kds-summary__pill {
        background: rgba(0, 0, 0, 0.04);
        border-radius: 4px;
        padding: 4px 10px;
        font-size: 13px;
      }
      .kds-summary__qty {
        font-weight: 600;
        margin-left: 4px;
      }
      .kds-section__title {
        font-weight: 600;
        margin: 8px 0;
      }
      .kds-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
      }
      .kds-card__head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-weight: 600;
        margin-bottom: 8px;
      }
      .kds-card__qty {
        font-size: 18px;
      }
      .kds-card__meta {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 8px;
      }
      .kds-card__note {
        color: rgba(0, 0, 0, 0.55);
        font-style: italic;
        margin-bottom: 8px;
      }
      .kds-card__wait {
        color: rgba(0, 0, 0, 0.45);
        font-size: 12px;
      }
    `
  ]
})
export class KitchenOrderComponent {
  private readonly service = inject(KitchenOrderService);

  readonly board$: Observable<KdsActiveResponse> = timer(0, POLL_INTERVAL_MS).pipe(
    switchMap(() => this.service.getActiveBoard().pipe(catchError(() => of(EMPTY_BOARD))))
  );

  itemName(item: KdsItem | WaitingSummary): string {
    return item.productName || item.comboName || 'Món chưa xác định';
  }

  location(item: KdsItem): string {
    return item.tableNumber ? `Bàn ${item.tableNumber}` : 'Mang về';
  }

  waitedMinutes(createdAt: string): number {
    const ms = Date.now() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(ms / 60000));
  }
}
