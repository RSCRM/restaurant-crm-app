import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderModule } from '@delon/abc/page-header';
import { I18nPipe } from '@delon/theme';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { catchError, EMPTY, finalize } from 'rxjs';

import { OrderFormComponent } from './order-form/order-form.component';
import { OrderCookingStatusResponse, OrderItemStatus, OrderStatus } from './order.model';
import { OrderService } from './order.service';

@Component({
  selector: 'app-order',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzInputModule,
    NzRadioModule,
    NzDescriptionsModule,
    NzSpinModule,
    NzAlertModule,
    FormsModule,
    I18nPipe
  ],
  templateUrl: './order.component.html',
  styleUrl: './order.component.less'
})
export class OrderComponent {
  private orderService = inject(OrderService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  searchValue = '';
  searchMode: 'orderId' | 'tableId' = 'orderId';
  loading = false;
  order: OrderCookingStatusResponse | null = null;
  error = '';

  search(): void {
    if (!this.searchValue.trim()) return;

    this.loading = true;
    this.order = null;
    this.error = '';
    this.cdr.markForCheck();

    const obs =
      this.searchMode === 'orderId'
        ? this.orderService.getCookingStatus(this.searchValue.trim())
        : this.orderService.getActiveOrderCookingStatusByTable(this.searchValue.trim());

    obs
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.order = null;
          this.error = 'Không tìm thấy đơn hàng';
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(res => {
        this.order = res;
        this.cdr.markForCheck();
      });
  }

  getStatusColor(status: OrderStatus | OrderItemStatus): string {
    switch (status) {
      case 'PENDING':
        return 'default';
      case 'IN_PROGRESS':
        return 'processing';
      case 'READY_TO_SERVE':
        return 'warning';
      case 'SERVED':
        return 'success';
      case 'PAID':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  }

  getStatusText(status: OrderStatus | OrderItemStatus): string {
    switch (status) {
      case 'PENDING':
        return 'app.order.status.pending';
      case 'IN_PROGRESS':
        return 'app.order.status.inProgress';
      case 'READY_TO_SERVE':
        return 'app.order.status.readyToServe';
      case 'SERVED':
        return 'app.order.status.served';
      case 'PAID':
        return 'app.order.status.paid';
      case 'CANCELLED':
        return 'app.order.status.cancelled';
      default:
        return status;
    }
  }

  goToDetail(): void {
    if (this.order) {
      this.router.navigate(['/portal/order', this.order.orderId, 'detail']);
    }
  }

  openCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: OrderFormComponent,
      nzWidth: 700,
      nzData: null
    });
    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.router.navigate(['/portal/order', result, 'detail']);
      }
    });
  }
}
