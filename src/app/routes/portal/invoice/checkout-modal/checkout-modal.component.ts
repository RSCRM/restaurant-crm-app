import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';

import { InvoiceService } from '../invoice.service';
import { PaymentMethod } from '../invoice.model';

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzDividerModule,
    NzIconModule
  ],
  templateUrl: './checkout-modal.component.html'
})
export class CheckoutModalComponent {
  private invoiceService = inject(InvoiceService);
  private modalRef = inject(NzModalRef);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  orderId = '';
  paymentMethod: PaymentMethod = PaymentMethod.CASH;
  note = '';
  voucherCode = '';
  loyaltyPhone = '';
  loyaltyPoints = 0;
  loading = false;

  paymentMethods = [
    { value: PaymentMethod.CASH, label: '💵 Tiền mặt' },
    { value: PaymentMethod.BANKING, label: '🏦 Chuyển khoản' },
    { value: PaymentMethod.CREDIT_CARD, label: '💳 Thẻ tín dụng' }
  ];

  onCheckout(): void {
    if (!this.orderId.trim()) {
      this.message.warning('Vui lòng nhập Order ID!');
      return;
    }

    this.loading = true;
    this.invoiceService.checkout({
      orderId: this.orderId.trim(),
      paymentMethod: this.paymentMethod,
      note: this.note.trim() || undefined,
      voucherCode: this.voucherCode.trim() || undefined
    }).subscribe({
      next: invoice => {
        this.loading = false;
        this.modalRef.close(invoice);
      },
      error: err => {
        this.loading = false;
        this.message.error(err?.error?.errorMessage || 'Lỗi thanh toán!');
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    this.modalRef.close();
  }
}
