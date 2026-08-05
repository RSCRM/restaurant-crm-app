import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputModule } from 'ng-zorro-antd/input';
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

import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';

@Component({
  selector: 'app-cooking-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule, NzCardModule, NzProgressModule, NzTagModule,
    NzIconModule, NzSpinModule, NzEmptyModule, NzResultModule, NzDividerModule,
    NzModalModule, NzTabsModule, I18nPipe
  ],
  templateUrl: './cooking-status.component.html',
  styleUrls: ['./cooking-status.component.less']
})
export class CookingStatusComponent implements OnInit, OnDestroy {
  private customerService = inject(CustomerService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private i18n = inject(ALAIN_I18N_TOKEN);

  tracking: CustomerOrderTrackingResponse | null = null;
  loading = true;
  vouchers: CustomerVoucherApplicableResponse[] = [];
  allMyVouchers: CustomerVoucherApplicableResponse[] = [];
  catalogVouchers: CustomerVoucherApplicableResponse[] = [];
  displayedCatalogVouchers: CustomerVoucherApplicableResponse[] = [];
  myPoints = 0;
  selectedTabIndex = 0;
  voucherModalVisible = false;
  voucherLoading = false;
  showAllVouchers = false;
  enteredCode = '';
  codeLoading = false;

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
      if (this.voucherModalVisible) {
        this.loadMyPoints();
        this.loadMyVouchers();
        this.loadCatalog();
      }
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
        this.allMyVouchers = res || [];
        this.vouchers = this.allMyVouchers.filter(v => !v.voucherCode);
        this.voucherLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.allMyVouchers = [];
        this.vouchers = [];
        this.voucherLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadCatalog(): void {
    this.customerService.getVoucherCatalog().subscribe({
      next: res => {
        this.catalogVouchers = res || [];
        this.displayedCatalogVouchers = this.catalogVouchers.filter(v => !v.voucherCode);
        this.cdr.markForCheck();
      },
      error: () => {
        this.catalogVouchers = [];
        this.displayedCatalogVouchers = [];
        this.cdr.markForCheck();
      }
    });
  }

  redeemVoucher(v: CustomerVoucherApplicableResponse): void {
    this.voucherLoading = true;
    this.customerService.redeemVoucher(v.customerVoucherId).subscribe({
      next: () => {
        this.message.success(this.i18n.fanyi('voucher.msg.redeemSuccess'));
        this.loadMyPoints();
        this.loadCatalog();
        this.loadMyVouchers();
        this.selectedTabIndex = 0;
      },
      error: err => {
        this.voucherLoading = false;
        this.message.error(err?.error?.errorMessage || this.i18n.fanyi('voucher.msg.redeemError'));
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
        this.message.success(this.i18n.fanyi('voucher.msg.applySuccess'));
        this.voucherLoading = false;
        this.voucherModalVisible = false;
        this.loadStatus();
      },
      error: err => {
        this.voucherLoading = false;
        this.message.error(err?.error?.errorMessage || this.i18n.fanyi('voucher.msg.applyError'));
        this.cdr.markForCheck();
      }
    });
  }

  removeVoucher(): void {
    this.voucherLoading = true;
    this.customerService.removeVoucher().subscribe({
      next: () => {
        this.message.info(this.i18n.fanyi('voucher.msg.removeSuccess'));
        this.voucherLoading = false;
        this.voucherModalVisible = false;
        this.loadStatus();
      },
      error: () => {
        this.voucherLoading = false;
        this.message.error(this.i18n.fanyi('voucher.msg.removeError'));
        this.cdr.markForCheck();
      }
    });
  }

  applyPromoCode(): void {
    const code = this.enteredCode.trim();
    if (!code) {
      this.message.warning(this.i18n.fanyi('voucher.promo-code.msg.empty'));
      return;
    }

    this.codeLoading = true;
    this.voucherLoading = true;
    this.cdr.markForCheck();

    // 1. Check if the customer already owns this promo code voucher in their wallet (e.g. from previous step)
    const alreadyOwnedVoucher = this.allMyVouchers.find(v =>
      v.voucherCode && v.voucherCode.toLowerCase() === code.toLowerCase()
    );

    if (alreadyOwnedVoucher) {
      // Already owned, apply directly without redeeming
      this.customerService.applyVoucher(alreadyOwnedVoucher.customerVoucherId).subscribe({
        next: () => {
          this.message.success(this.i18n.fanyi('voucher.promo-code.msg.success'));
          this.codeLoading = false;
          this.voucherLoading = false;
          this.voucherModalVisible = false;
          this.enteredCode = '';
          this.loadStatus();
        },
        error: (err) => {
          this.codeLoading = false;
          this.voucherLoading = false;
          this.message.error(err?.error?.errorMessage || this.i18n.fanyi('voucher.promo-code.msg.applyError'));
          this.cdr.markForCheck();
        }
      });
      return;
    }

    // 2. If not owned yet, search in catalog for code-based voucher (v.voucherCode === code)
    const matchedVoucher = this.catalogVouchers.find(v =>
      v.voucherCode && v.voucherCode.toLowerCase() === code.toLowerCase()
    );

    if (!matchedVoucher) {
      this.codeLoading = false;
      this.voucherLoading = false;
      this.message.error(this.i18n.fanyi('voucher.promo-code.msg.invalid'));
      this.cdr.markForCheck();
      return;
    }

    // Redeem code voucher (0 points)
    this.customerService.redeemVoucher(matchedVoucher.customerVoucherId).subscribe({
      next: (customerVoucherId) => {
        // Apply newly redeemed customer voucher to order
        this.customerService.applyVoucher(customerVoucherId).subscribe({
          next: () => {
            this.message.success(this.i18n.fanyi('voucher.promo-code.msg.success'));
            this.codeLoading = false;
            this.voucherLoading = false;
            this.voucherModalVisible = false;
            this.enteredCode = '';
            this.loadStatus();
          },
          error: (err) => {
            this.codeLoading = false;
            this.voucherLoading = false;
            this.message.error(err?.error?.errorMessage || this.i18n.fanyi('voucher.promo-code.msg.applyError'));
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        this.codeLoading = false;
        this.voucherLoading = false;
        this.message.error(err?.error?.errorMessage || this.i18n.fanyi('voucher.promo-code.msg.unavailable'));
        this.cdr.markForCheck();
      }
    });
  }

  goToMenu(): void {
    this.router.navigate(['/customer/menu']);
  }
}
