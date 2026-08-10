import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STColumn, STModule } from '@delon/abc/st';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { catchError, EMPTY, finalize } from 'rxjs';

import { OrderCookingStatusResponse, OrderItemCookingStatusResponse, OrderItemStatus, OrderStatus } from '../order.model';
import { OrderService } from '../order.service';
import { AddItemFormComponent } from './add-item-form.component';
import { UpdateModifiersFormComponent } from './update-modifiers-form.component';
import { UpdateQuantityFormComponent } from './update-quantity-form.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzDescriptionsModule,
    NzPopconfirmModule,
    NzSpinModule,
    STModule,
    I18nPipe
  ],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.less'
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  order: OrderCookingStatusResponse | null = null;
  loading = true;
  orderId = '';

  columns: STColumn[] = [
    { title: { i18n: 'app.order.detail.itemName' }, index: 'itemName', width: 200 },
    { title: { i18n: 'app.order.detail.quantity' }, index: 'quantity', width: 80 },
    { title: { i18n: 'app.order.detail.itemStatus' }, index: 'status', width: 130, render: 'status' },
    { title: { i18n: 'app.order.detail.itemNote' }, index: 'note', width: 200 },
    {
      title: { i18n: 'app.order.detail.itemActions' },
      width: 280,
      fixed: 'right',
      buttons: [
        {
          i18n: 'app.order.action.updateQuantity',
          icon: 'edit',
          iif: item => item.status === 'PENDING',
          click: item => this.openUpdateQuantity(item)
        },
        {
          i18n: 'app.order.action.updateModifiers',
          icon: 'setting',
          iif: item => item.status === 'PENDING',
          click: item => this.openUpdateModifiers(item)
        },
        {
          i18n: 'app.order.action.removeItem',
          icon: 'delete',
          iif: item => item.status === 'PENDING',
          pop: { titleI18n: 'app.order.removeItemConfirm' },
          click: item => this.removeOrderItem(item)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    this.loadOrder();
  }

  loadOrder(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.orderService
      .getCookingStatus(this.orderId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.order = null;
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

  openAddItem(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: AddItemFormComponent,
      nzWidth: 1200,
      nzFooter: null,
      nzData: { orderId: this.orderId },
      nzOnCancel: instance => {
        modalRef.destroy(instance.hasAdded);
      }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadOrder();
    });
  }

  openUpdateQuantity(item: OrderItemCookingStatusResponse): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: UpdateQuantityFormComponent,
      nzWidth: 400,
      nzData: { orderId: this.orderId, orderItemId: item.orderItemId, currentQuantity: item.quantity }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadOrder();
    });
  }

  openUpdateModifiers(item: OrderItemCookingStatusResponse): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: UpdateModifiersFormComponent,
      nzWidth: 600,
      nzData: { orderId: this.orderId, orderItemId: item.orderItemId }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadOrder();
    });
  }

  removeOrderItem(item: OrderItemCookingStatusResponse): void {
    this.orderService
      .removeOrderItem(this.orderId, item.orderItemId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Xóa món thất bại');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success('Xóa món thành công');
        this.loadOrder();
      });
  }

  cancelOrder(): void {
    this.orderService
      .cancelOrder(this.orderId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Hủy đơn hàng thất bại');
          return EMPTY;
        })
      )
      .subscribe(res => {
        if (res.cancelled) {
          this.message.success('Hủy đơn hàng thành công');
          this.loadOrder();
        } else {
          this.message.warning('Không thể hủy đơn. Một số món đang được chế biến.');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/portal/order']);
  }
}
