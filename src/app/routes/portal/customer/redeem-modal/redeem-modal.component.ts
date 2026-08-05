import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { VoucherResponse } from '../customer.model';
import { CustomerService } from '../customer.service';

export interface RedeemModalData {
  customerId: string;
  customerPhone: string;
  currentPoints: number;
  restaurantId: string;
  mode: 'redeem' | 'give';
}

@Component({
  selector: 'app-redeem-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NzCardModule, NzButtonModule, NzIconModule, NzTagModule, NzSpinModule, NzGridModule, NzTooltipModule, I18nPipe],
  templateUrl: './redeem-modal.component.html',
  styleUrls: ['./redeem-modal.component.less']
})
export class RedeemModalComponent implements OnInit {
  private i18n = inject(ALAIN_I18N_TOKEN);
  private customerService = inject(CustomerService);
  private modalRef = inject(NzModalRef);
  private modalService = inject(NzModalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private modalData = inject<RedeemModalData>(NZ_MODAL_DATA);

  loading = false;
  submittingVoucherId: string | null = null;
  vouchers: VoucherResponse[] = [];

  get customerId(): string {
    return this.modalData.customerId;
  }

  get customerPhone(): string {
    return this.modalData.customerPhone;
  }

  get currentPoints(): number {
    return this.modalData.currentPoints;
  }

  get restaurantId(): string {
    return this.modalData.restaurantId;
  }

  get mode(): 'redeem' | 'give' {
    return this.modalData.mode;
  }

  ngOnInit(): void {
    this.loadActiveVouchers();
  }

  loadActiveVouchers(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.customerService.getActiveVouchers(this.restaurantId, { page: 1, size: 100 }).subscribe({
      next: res => {
        this.vouchers = res.data.filter(v => !v.voucherCode);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error(this.i18n.fanyi('redeem-modal.msg.load-error'));
        this.cdr.markForCheck();
      }
    });
  }

  canRedeem(voucher: VoucherResponse): boolean {
    if (this.mode === 'give') return true;
    return this.currentPoints >= voucher.pointsRequired;
  }

  actionVoucher(voucher: VoucherResponse): void {
    if (!this.canRedeem(voucher)) {
      this.message.warning(this.i18n.fanyi('redeem-modal.msg.insufficient-points', { points: voucher.pointsRequired }));
      return;
    }

    const titleAction = this.mode === 'redeem'
      ? this.i18n.fanyi('redeem-modal.confirm.title.redeem')
      : this.i18n.fanyi('redeem-modal.confirm.title.give');

    const confirmMsg = this.mode === 'redeem'
      ? this.i18n.fanyi('redeem-modal.confirm.content.redeem', { points: voucher.pointsRequired, phone: this.customerPhone, title: voucher.title })
      : this.i18n.fanyi('redeem-modal.confirm.content.give', { phone: this.customerPhone, title: voucher.title });

    this.modalService.confirm({
      nzTitle: titleAction,
      nzContent: confirmMsg,
      nzOnOk: () => {
        this.submittingVoucherId = voucher.id;
        this.cdr.markForCheck();

        if (this.mode === 'redeem') {
          this.customerService
            .redeemVoucher({
              customerId: this.customerId,
              voucherId: voucher.id,
              branchId: this.restaurantId
            })
            .subscribe({
              next: () => {
                this.submittingVoucherId = null;
                this.message.success(this.i18n.fanyi('redeem-modal.msg.redeem-success'));
                this.modalRef.close(true);
              },
              error: err => {
                this.submittingVoucherId = null;
                const msg = err?.error?.errorMessage?.message || err?.message || this.i18n.fanyi('redeem-modal.msg.redeem-error');
                this.message.error(msg);
                this.cdr.markForCheck();
              }
            });
        } else {
          this.customerService
            .giveVoucher({
              customerId: this.customerId,
              voucherId: voucher.id,
              branchId: this.restaurantId
            })
            .subscribe({
              next: () => {
                this.submittingVoucherId = null;
                this.message.success(this.i18n.fanyi('redeem-modal.msg.give-success'));
                this.modalRef.close(true);
              },
              error: err => {
                this.submittingVoucherId = null;
                const msg = err?.error?.errorMessage?.message || err?.message || this.i18n.fanyi('redeem-modal.msg.give-error');
                this.message.error(msg);
                this.cdr.markForCheck();
              }
            });
        }
      }
    });
  }

  cancel(): void {
    this.modalRef.close(null);
  }
}
