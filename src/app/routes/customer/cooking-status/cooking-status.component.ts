import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { interval, Subscription } from 'rxjs';

import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

import { CustomerService } from '../customer.service';
import {
  CustomerOrderTrackingResponse,
  CustomerOrderTrackingItemResponse,
  CustomerOrderStage,
  OrderItemStatus,
  CustomerVoucherApplicableResponse
} from '../customer.model';

@Component({
  selector: 'app-cooking-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzButtonModule, NzCardModule, NzProgressModule, NzTagModule,
    NzIconModule, NzSpinModule, NzEmptyModule, NzResultModule, NzDividerModule,
    NzModalModule, NzTabsModule
  ],
  templateUrl: './cooking-status.component.html',
  styleUrls: ['./cooking-status.component.less']
})
export class CookingStatusComponent implements OnInit, OnDestroy {
  private customerService = inject(CustomerService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  tracking: CustomerOrderTrackingResponse | null = null;
  loading = true;
  vouchers: CustomerVoucherApplicableResponse[] = [];
  catalogVouchers: CustomerVoucherApplicableResponse[] = [];
  myPoints = 0;
  selectedTabIndex = 0;
  voucherModalVisible = false;
  voucherLoading = false;
  showAllVouchers = false;

  private sseSub: Subscription | null = null;
  private pollSub: Subscription | null = null;

  ngOnInit(): void {
    if (!this.customerService.hasSession()) {
      this.router.navigate(['/customer/entry']);
      return;
    }
    this.loadStatus();
    this.subscribeRealtime();
    this.startAutoPolling();
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }

  private startAutoPolling(): void {
    this.pollSub = interval(3000).subscribe(() => {
      this.customerService.getCookingStatus().subscribe({
        next: res => {
          this.tracking = res;
          this.cdr.markForCheck();
        }
      });
    });
  }

  private loadStatus(): void {
    this.loading = true;
    this.customerService.getCookingStatus().subscribe({
      next: res => {
        this.tracking = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private subscribeRealtime(): void {
    this.sseSub = this.customerService.subscribeCookingStatus().subscribe({
      next: res => {
        this.tracking = res;
        this.cdr.markForCheck();
      }
    });
  }

  get progressPercent(): number {
    if (!this.tracking?.summary) return 0;
    const s = this.tracking.summary;
    const done = s.served + s.cancelled;
    return s.total > 0 ? Math.round((done / s.total) * 100) : 0;
  }

  getStageColor(stage: CustomerOrderStage): string {
    const map: Record<string, string> = {
      RECEIVED: 'blue',
      COOKING: 'orange',
      READY_TO_SERVE: 'green',
      SERVED: 'default',
      CANCELLED: 'red'
    };
    return map[stage] || 'default';
  }

  getStageLabel(stage: CustomerOrderStage): string {
    const map: Record<string, string> = {
      RECEIVED: '📝 Đã nhận',
      COOKING: '🔥 Đang nấu',
      READY_TO_SERVE: '✅ Sẵn sàng phục vụ',
      SERVED: '🍽️ Đã phục vụ',
      CANCELLED: '❌ Đã hủy'
    };
    return map[stage] || stage;
  }

  openVoucherModal(showAll: boolean = false): void {
    this.showAllVouchers = showAll;
    this.selectedTabIndex = 0;
    this.voucherModalVisible = true;
    this.loadMyPoints();
    this.loadMyVouchers();
    this.loadCatalog();
  }

  private loadMyPoints(): void {
    this.customerService.getMyPoints().subscribe({
      next: res => {
        this.myPoints = res?.currentPoints || 0;
        this.cdr.markForCheck();
      },
      error: () => {
        this.myPoints = 0;
        this.cdr.markForCheck();
      }
    });
  }

  private loadMyVouchers(): void {
    this.voucherLoading = true;
    this.customerService.getApplicableVouchers().subscribe({
      next: res => {
        this.vouchers = res;
        this.voucherLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.vouchers = [];
        this.voucherLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadCatalog(): void {
    this.customerService.getVoucherCatalog().subscribe({
      next: res => {
        this.catalogVouchers = res;
        this.cdr.markForCheck();
      },
      error: () => {
        this.catalogVouchers = [];
        this.cdr.markForCheck();
      }
    });
  }

  redeemVoucher(v: CustomerVoucherApplicableResponse): void {
    this.voucherLoading = true;
    this.customerService.redeemVoucher(v.customerVoucherId).subscribe({
      next: () => {
        this.message.success(`Đổi Voucher ${v.title} thành công!`);
        this.loadMyPoints();
        this.loadCatalog();
        this.loadMyVouchers();
        this.selectedTabIndex = 0;
      },
      error: err => {
        this.voucherLoading = false;
        this.message.error(err?.error?.errorMessage || 'Không thể đổi voucher. Bạn có thể không đủ điểm.');
        this.cdr.markForCheck();
      }
    });
  }

  toggleShowAllVouchers(): void {
    this.showAllVouchers = !this.showAllVouchers;
    this.cdr.markForCheck();
  }

  get displayedVouchers(): CustomerVoucherApplicableResponse[] {
    if (this.showAllVouchers) {
      return this.vouchers;
    }
    return this.vouchers.filter(v => v.isApplicable);
  }

  applyVoucher(cv: CustomerVoucherApplicableResponse): void {
    this.voucherLoading = true;
    this.customerService.applyVoucher(cv.customerVoucherId).subscribe({
      next: () => {
        this.message.success(`Đã áp dụng Voucher ${cv.title}!`);
        this.voucherLoading = false;
        this.voucherModalVisible = false;
        this.loadStatus();
      },
      error: err => {
        this.voucherLoading = false;
        this.message.error(err?.error?.errorMessage || 'Không thể áp dụng voucher.');
        this.cdr.markForCheck();
      }
    });
  }

  removeVoucher(): void {
    this.voucherLoading = true;
    this.customerService.removeVoucher().subscribe({
      next: () => {
        this.message.info('Đã hủy dùng Voucher!');
        this.voucherLoading = false;
        this.voucherModalVisible = false;
        this.loadStatus();
      },
      error: () => {
        this.voucherLoading = false;
        this.message.error('Lỗi khi bỏ voucher.');
        this.cdr.markForCheck();
      }
    });
  }

  goToMenu(): void {
    this.router.navigate(['/customer/menu']);
  }
}
