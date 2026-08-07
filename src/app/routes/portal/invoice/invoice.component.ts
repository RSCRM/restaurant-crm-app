import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderModule } from '@delon/abc/page-header';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { CheckoutModalComponent } from './checkout-modal/checkout-modal.component';
import { InvoiceResponse, InvoiceStatus, PaymentMethod } from './invoice.model';
import { InvoiceService } from './invoice.service';

@Component({
  selector: 'app-invoice',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzTagModule,
    NzDescriptionsModule,
    NzTableModule,
    NzSelectModule,
    NzDividerModule,
    NzEmptyModule,
    NzSpinModule
  ],
  templateUrl: './invoice.component.html'
})
export class InvoiceComponent {
  private invoiceService = inject(InvoiceService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  invoiceId = '';
  currentInvoice: InvoiceResponse | null = null;
  loading = false;

  lookupInvoice(): void {
    if (!this.invoiceId.trim()) {
      this.message.warning('Vui lòng nhập Mã Hóa Đơn hoặc ID!');
      return;
    }

    this.loading = true;
    this.invoiceService.getInvoiceDetails(this.invoiceId.trim()).subscribe({
      next: res => {
        this.currentInvoice = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.currentInvoice = null;
        this.loading = false;
        this.message.error('Không tìm thấy hóa đơn!');
        this.cdr.markForCheck();
      }
    });
  }

  openCheckout(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Thanh Toán & Xuất Hóa Đơn',
      nzContent: CheckoutModalComponent,
      nzWidth: 1200,
      nzFooter: null
    });
    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.currentInvoice = result;
        this.message.success(`Thanh toán thành công! Mã HĐ: ${result.invoiceCode}`);
        this.cdr.markForCheck();
      }
    });
  }

  getStatusColor(status: InvoiceStatus): string {
    return status === InvoiceStatus.PAID ? 'green' : 'red';
  }

  getStatusLabel(status: InvoiceStatus): string {
    return status === InvoiceStatus.PAID ? 'Đã thanh toán' : 'Đã hoàn tiền';
  }

  getPaymentLabel(method: PaymentMethod): string {
    const map: Record<string, string> = {
      CASH: 'Tiền mặt',
      BANKING: 'Chuyển khoản',
      CREDIT_CARD: 'Thẻ tín dụng'
    };
    return map[method] || method;
  }

  formatPrice(val: number): string {
    return `${val?.toLocaleString('vi-VN')} ₫`;
  }
}
