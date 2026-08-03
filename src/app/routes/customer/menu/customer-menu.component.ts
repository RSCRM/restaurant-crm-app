import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDividerModule } from 'ng-zorro-antd/divider';

import { CustomerService } from '../customer.service';
import {
  CustomerMenuResponse,
  MenuCategoryResponse,
  MenuProductResponse,
  GroupCartResponse
} from '../customer.model';

@Component({
  selector: 'app-customer-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzCardModule, NzBadgeModule, NzTagModule,
    NzIconModule, NzInputNumberModule, NzSpinModule, NzEmptyModule,
    NzTabsModule, NzDividerModule
  ],
  templateUrl: './customer-menu.component.html',
  styleUrls: ['./customer-menu.component.less']
})
export class CustomerMenuComponent implements OnInit {
  private customerService = inject(CustomerService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  menu: CustomerMenuResponse | null = null;
  cart: GroupCartResponse | null = null;
  loading = true;
  cartLoading = false;

  ngOnInit(): void {
    if (!this.customerService.hasSession()) {
      this.router.navigate(['/customer/entry']);
      return;
    }
    this.loadMenu();
    this.loadCart();
  }

  private loadMenu(): void {
    this.loading = true;
    this.customerService.getMenu().subscribe({
      next: res => {
        this.menu = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Không thể tải thực đơn.');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadCart(): void {
    this.customerService.getCart().subscribe({
      next: res => {
        this.cart = res;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }

  addToCart(product: MenuProductResponse): void {
    this.cartLoading = true;
    this.customerService.addCartItem({ productId: product.productId, quantity: 1 }).subscribe({
      next: res => {
        this.cart = res;
        this.cartLoading = false;
        this.message.success(`Đã thêm ${product.productName} vào giỏ!`);
        this.cdr.markForCheck();
      },
      error: () => {
        this.cartLoading = false;
        this.message.error('Lỗi thêm món vào giỏ.');
        this.cdr.markForCheck();
      }
    });
  }

  submitOrder(): void {
    this.cartLoading = true;
    this.customerService.submitCart().subscribe({
      next: res => {
        this.cartLoading = false;
        this.message.success(`Đặt ${res.itemCount} món thành công! Đang chuyển xem tiến độ...`);
        this.router.navigate(['/customer/cooking-status']);
      },
      error: err => {
        this.cartLoading = false;
        if (err?.status === 403 || err?.status === 401 || err?.status === 404) {
          this.message.warning('Phiên làm việc đã hết hạn hoặc không tồn tại. Vui lòng quét lại mã QR bàn để bắt đầu.');
          this.customerService.clearSession();
          this.router.navigate(['/customer/entry']);
        } else {
          this.message.error(err?.error?.errorMessage || 'Lỗi gửi đơn hàng.');
        }
        this.cdr.markForCheck();
      }
    });
  }

  removeCartItem(cartItemId: string): void {
    this.customerService.deleteCartItem(cartItemId).subscribe({
      next: res => {
        this.cart = res;
        this.cdr.markForCheck();
      },
      error: () => this.message.error('Lỗi xóa món.')
    });
  }

  goToCookingStatus(): void {
    this.router.navigate(['/customer/cooking-status']);
  }

  formatPrice(price: number): string {
    return price?.toLocaleString('vi-VN') + ' ₫';
  }
}
