import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
  imports: [CommonModule, NzCardModule, NzButtonModule, NzIconModule, NzTagModule, NzSpinModule, NzGridModule, NzTooltipModule],
  templateUrl: './redeem-modal.component.html',
  styleUrls: ['./redeem-modal.component.less']
})
export class RedeemModalComponent implements OnInit {
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
        this.vouchers = res.data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('Lỗi khi tải danh sách voucher hoạt động.');
        this.cdr.markForCheck();
      }
    });
  }

  canRedeem(voucher: VoucherResponse): boolean {
    if (this.mode === 'give') return true;
    return this.currentPoints >= voucher.pointCost;
  }

  actionVoucher(voucher: VoucherResponse): void {
    if (!this.canRedeem(voucher)) {
      this.message.warning(`Khách hàng cần có ít nhất ${voucher.pointCost} điểm để đổi voucher này!`);
      return;
    }

    const titleAction = this.mode === 'redeem' ? 'Đổi Điểm Lấy Voucher' : 'Tặng Voucher Trực Tiếp';
    const confirmMsg =
      this.mode === 'redeem'
        ? `Đổi ${voucher.pointCost} điểm của SĐT ${this.customerPhone} lấy "${voucher.title}"?`
        : `Tặng miễn phí voucher "${voucher.title}" cho SĐT ${this.customerPhone}?`;

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
              restaurantId: this.restaurantId
            })
            .subscribe({
              next: () => {
                this.submittingVoucherId = null;
                this.message.success('Đổi voucher cho khách hàng thành công!');
                this.modalRef.close(true);
              },
              error: err => {
                this.submittingVoucherId = null;
                const msg = err?.error?.errorMessage?.message || err?.message || 'Lỗi khi đổi voucher.';
                this.message.error(msg);
                this.cdr.markForCheck();
              }
            });
        } else {
          this.customerService
            .giveVoucher({
              customerId: this.customerId,
              voucherId: voucher.id,
              restaurantId: this.restaurantId
            })
            .subscribe({
              next: () => {
                this.submittingVoucherId = null;
                this.message.success('Tặng voucher cho khách hàng thành công!');
                this.modalRef.close(true);
              },
              error: err => {
                this.submittingVoucherId = null;
                const msg = err?.error?.errorMessage?.message || err?.message || 'Lỗi khi tặng voucher.';
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
