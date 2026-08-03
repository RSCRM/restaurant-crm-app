import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HasPermissionDirective, SHARED_IMPORTS } from '@shared';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
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
  imports: [...SHARED_IMPORTS, NzCardModule, NzTagModule, NzEmptyModule, NzSegmentedModule, HasPermissionDirective],
  styles: [
    `
      .kds-toolbar {
        margin-bottom: 20px;
      }
      .kds-summary {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 20px;
      }
      .kds-summary__pill {
        background: rgba(0, 0, 0, 0.04);
        border-radius: 6px;
        padding: 8px 16px;
        font-size: 18px;
      }
      .kds-summary__qty {
        font-weight: 700;
        margin-left: 6px;
      }
      .kds-section__title {
        font-weight: 700;
        font-size: 22px;
        margin: 16px 0 12px;
      }
      .kds-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
        margin-bottom: 28px;
      }
      .kds-card__head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 10px;
      }
      .kds-card__name {
        font-size: 24px;
        font-weight: 700;
        line-height: 1.2;
      }
      .kds-card__qty {
        font-size: 28px;
        font-weight: 700;
        white-space: nowrap;
      }
      .kds-card__table {
        font-size: 22px;
        font-weight: 600;
        margin-bottom: 10px;
      }
      .kds-card__meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 10px;
      }
      .kds-card__meta nz-tag {
        font-size: 16px;
        padding: 4px 10px;
      }
      .kds-card__note {
        color: rgba(0, 0, 0, 0.6);
        font-style: italic;
        font-size: 18px;
        margin-bottom: 10px;
      }
      .kds-card__wait {
        color: rgba(0, 0, 0, 0.5);
        font-size: 16px;
        font-weight: 600;
      }
      .kds-card__accept {
        margin-top: 12px;
      }
    `
  ]
})
export class KitchenOrderComponent {
  private readonly service = inject(KitchenOrderService);
  private readonly message = inject(NzMessageService);

  /** orderItemId currently being accepted — disables its button and blocks double-click. */
  readonly acceptingIds = signal<ReadonlySet<string>>(new Set());

  // uc-scf-ui-01: waitingItems render in the backend order (created_at ASC = flat FIFO).
  // TODO(SangTD6): khi entity OrderItem có priority_flag thì sort priority_flag DESC, created_at ASC
  //   (BR-RES-ORD-04). Tối nay KHÔNG chờ cột này — cứ FIFO thường.
  readonly board$: Observable<KdsActiveResponse> = timer(0, POLL_INTERVAL_MS).pipe(
    switchMap(() => this.service.getKitchenItems('ACTIVE').pipe(catchError(() => of(EMPTY_BOARD))))
  );

  /** View mode: 'byTable' = FIFO grids (uc-scf-ui-01), 'byDish' = grouped summary cards (uc-scf-ui-02). */
  readonly viewMode = signal<'byTable' | 'byDish'>('byTable');

  /** Toggle options; toggling only flips this signal — it never touches board$, so polling keeps running. */
  readonly viewOptions = [
    { label: 'Theo bàn (FIFO)', value: 'byTable' },
    { label: 'Theo món', value: 'byDish' }
  ];

  itemName(item: KdsItem | WaitingSummary): string {
    return item.productName || item.comboName || 'Món chưa xác định';
  }

  location(item: KdsItem): string {
    if (!item.tableNumber) {
      return 'Mang về';
    }
    return item.areaName ? `${item.areaName} — Bàn ${item.tableNumber}` : `Bàn ${item.tableNumber}`;
  }

  waitedMinutes(createdAt: string): number {
    const ms = Date.now() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(ms / 60000));
  }

  isAccepting(item: KdsItem): boolean {
    return this.acceptingIds().has(item.orderItemId);
  }

  /** Kitchen accepts a waiting item for preparation: PENDING -> IN_PROGRESS (uc-scf-ui-03). */
  acceptItem(item: KdsItem): void {
    if (this.isAccepting(item)) {
      return;
    }
    this.setAccepting(item.orderItemId, true);
    this.service.acceptItem(item.orderItemId).subscribe({
      next: () => {
        this.setAccepting(item.orderItemId, false);
        this.message.success(`Đã nhận chế biến: ${this.itemName(item)}`);
      },
      error: () => {
        this.setAccepting(item.orderItemId, false);
        this.message.error(`Nhận chế biến thất bại: ${this.itemName(item)}`);
      }
    });
  }

  private setAccepting(orderItemId: string, accepting: boolean): void {
    const next = new Set(this.acceptingIds());
    if (accepting) {
      next.add(orderItemId);
    } else {
      next.delete(orderItemId);
    }
    this.acceptingIds.set(next);
  }
}
