import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Observable, catchError, of, switchMap, timer } from 'rxjs';

import { KitchenOrderItem } from '../kitchen-order.model';
import { KitchenOrderService } from '../kitchen-order.service';

/** Poll interval — satisfies the "new items appear within 2s" criterion without WebSocket. */
const POLL_INTERVAL_MS = 2000;

@Component({
  selector: 'app-kitchen-order',
  templateUrl: './kitchen-order.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...SHARED_IMPORTS, NzCardModule, NzTagModule, NzEmptyModule],
  styles: [
    `
      .kds-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 12px;
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
      .kds-card--priority {
        border-color: #ff4d4f;
      }
    `
  ]
})
export class KitchenOrderComponent {
  private readonly service = inject(KitchenOrderService);

  readonly items$: Observable<KitchenOrderItem[]> = timer(0, POLL_INTERVAL_MS).pipe(
    switchMap(() => this.service.getQueue().pipe(catchError(() => of<KitchenOrderItem[]>([]))))
  );

  statusColor(status: KitchenOrderItem['status']): string {
    return status === 'IN_PROGRESS' ? 'processing' : 'default';
  }

  waitedMinutes(createdAt: string): number {
    const ms = Date.now() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(ms / 60000));
  }
}
