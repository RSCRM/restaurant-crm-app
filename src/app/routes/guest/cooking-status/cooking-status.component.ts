import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { Subscription } from 'rxjs';

import { OrderCookingStatusResponse, OrderItemStatus, OrderStatus, Product } from './cooking-status.model';
import { CookingStatusService } from './cooking-status.service';

@Component({
  selector: 'app-cooking-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTypographyModule,
    NzTagModule,
    NzBadgeModule,
    NzInputModule,
    NzFormModule,
    NzModalModule
  ],
  templateUrl: './cooking-status.component.html',
  styleUrls: ['./cooking-status.component.less']
})
export class CookingStatusComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private message = inject(NzMessageService);
  private cookingStatusService = inject(CookingStatusService);

  // States
  tableId = '';
  branchId = '';
  viewMode: 'MENU' | 'STATUS' = 'STATUS';
  loading = false;
  submitting = false;
  showPhoneModal = false;
  showCart = false;

  // Active Order & Products
  activeOrder: OrderCookingStatusResponse | null = null;
  products: Product[] = [];

  // Shopping Cart: Key is productId
  cart = new Map<string, { product: Product; quantity: number; note: string }>();

  // Guest Identity
  customerPhone = '';

  // SSE Subscription
  private sseSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tableId = params['tableId'];
      this.branchId = this.route.snapshot.queryParams['branchId'] || 'e0000000-0000-0000-0000-000000000001';
      this.checkActiveOrder();
    });
  }

  ngOnDestroy(): void {
    this.closeSse();
  }

  // 1. Check if there's an active unpaid order at this table
  checkActiveOrder(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.cookingStatusService.getActiveOrderCookingStatusByTable(this.tableId).subscribe({
      next: order => {
        this.activeOrder = order;
        this.viewMode = 'STATUS';
        this.loading = false;
        this.subscribeSse(order.orderId);
        this.cdr.markForCheck();
      },
      error: () => {
        // Table is vacant (404), go to Menu
        this.activeOrder = null;
        this.viewMode = 'MENU';
        this.loading = false;
        this.loadProducts();
        this.cdr.markForCheck();
      }
    });
  }

  // 2. Load products list for Menu view
  loadProducts(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.cookingStatusService.getProducts(this.branchId).subscribe({
      next: list => {
        this.products = list;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // 3. Connect to SSE
  private subscribeSse(orderId: string): void {
    this.closeSse();
    this.sseSubscription = this.cookingStatusService.subscribeCookingStatusSSE(orderId).subscribe({
      next: updatedOrder => {
        console.log('Realtime order update via SSE:', updatedOrder);
        this.activeOrder = updatedOrder;
        this.cdr.markForCheck();
      },
      error: err => {
        console.warn('SSE notification stream disconnected, auto-retry active in background.', err);
      }
    });
  }

  private closeSse(): void {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }
  }

  // 4. Cart Logic
  addToCart(product: Product): void {
    const existing = this.cart.get(product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.set(product.id, { product, quantity: 1, note: '' });
    }
    this.cdr.markForCheck();
    this.message.success(`Đã thêm ${product.productName} vào giỏ hàng!`);
  }

  updateQuantity(productId: string, quantity: number): void {
    const item = this.cart.get(productId);
    if (!item) return;

    if (quantity <= 0) {
      this.cart.delete(productId);
    } else {
      item.quantity = quantity;
    }
    this.cdr.markForCheck();
  }

  updateNote(productId: string, note: string): void {
    const item = this.cart.get(productId);
    if (item) {
      item.note = note;
    }
  }

  getCartTotal(): number {
    return Array.from(this.cart.values()).reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  getCartCount(): number {
    return Array.from(this.cart.values()).reduce((sum, item) => sum + item.quantity, 0);
  }

  showCartModal(): void {
    this.showCart = true;
    this.cdr.markForCheck();
  }

  // 5. Order placing trigger
  checkout(): void {
    if (this.cart.size === 0) {
      this.message.warning('Giỏ hàng trống! Vui lòng chọn món trước.');
      return;
    }

    if (this.activeOrder) {
      // If table is already occupied, append to current session without asking for phone
      this.submitOrder(this.activeOrder.customerPhone);
    } else {
      // First order: prompt phone number
      this.showPhoneModal = true;
      this.cdr.markForCheck();
    }
  }

  confirmPhoneOrder(): void {
    const phone = this.customerPhone.trim();
    if (!phone || phone.length < 9 || phone.length > 11) {
      this.message.error('Vui lòng nhập số điện thoại hợp lệ (9 - 11 chữ số).');
      return;
    }

    this.showPhoneModal = false;
    this.submitOrder(phone);
  }

  submitOrder(phone: string): void {
    this.submitting = true;
    this.cdr.markForCheck();

    const request = {
      branchId: this.branchId,
      tableId: this.tableId,
      orderType: 'DINE_IN',
      customerPhone: phone,
      items: Array.from(this.cart.values()).map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        note: item.note
      }))
    };

    this.cookingStatusService.createOrder(request).subscribe({
      next: res => {
        this.message.success('Đặt món thành công! Bếp đang nhận chế biến.');
        this.cart.clear();
        this.submitting = false;
        this.checkActiveOrder(); // Refresh to switch to STATUS view and subscribe to SSE
      },
      error: err => {
        this.submitting = false;
        const msg = err?.error?.errorMessage?.message || err?.message || 'Có lỗi xảy ra khi gửi đơn hàng.';
        this.message.error(msg);
        this.cdr.markForCheck();
      }
    });
  }

  // Navigation helpers
  switchToMenu(): void {
    this.viewMode = 'MENU';
    this.loadProducts();
  }

  switchToStatus(): void {
    if (this.activeOrder) {
      this.viewMode = 'STATUS';
    } else {
      this.message.warning('Hiện tại chưa có đơn hàng nào để theo dõi.');
    }
    this.cdr.markForCheck();
  }

  // Get localized tags for cooking statuses
  getStatusColor(status: OrderItemStatus): string {
    switch (status) {
      case OrderItemStatus.PENDING:
        return 'orange';
      case OrderItemStatus.IN_PROGRESS:
        return 'blue';
      case OrderItemStatus.READY_TO_SERVE:
        return 'green';
      case OrderItemStatus.SERVED:
        return 'default';
      case OrderItemStatus.CANCELLED:
        return 'red';
      default:
        return 'default';
    }
  }

  getStatusLabel(status: OrderItemStatus): string {
    switch (status) {
      case OrderItemStatus.PENDING:
        return 'Chờ chế biến';
      case OrderItemStatus.IN_PROGRESS:
        return 'Đang nấu';
      case OrderItemStatus.READY_TO_SERVE:
        return 'Chờ phục vụ';
      case OrderItemStatus.SERVED:
        return 'Đã phục vụ';
      case OrderItemStatus.CANCELLED:
        return 'Đã hủy';
      default:
        return status;
    }
  }

  getCompletedCount(): number {
    if (!this.activeOrder) return 0;
    return this.activeOrder.items.filter(
      item => item.status === OrderItemStatus.READY_TO_SERVE || item.status === OrderItemStatus.SERVED
    ).length;
  }

  goBackToScan(): void {
    this.router.navigate(['/guest/scan']);
  }
}
