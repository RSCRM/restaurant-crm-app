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
import { PaymentMethod, CustomerVoucherApplicableResponse } from '../invoice.model';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';

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
    NzIconModule,
    I18nPipe
  ],
  templateUrl: './checkout-modal.component.html'
})
export class CheckoutModalComponent {
  private invoiceService = inject(InvoiceService);
  private modalRef = inject(NzModalRef);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private i18n = inject(ALAIN_I18N_TOKEN);

  orderId = '';
  paymentMethod: PaymentMethod = PaymentMethod.CASH;
  note = '';
  voucherCode = '';
  loyaltyPhone = '';
  loyaltyPoints = 0;
  loading = false;

  applicableVouchers: CustomerVoucherApplicableResponse[] = [];
  selectedVoucherId = '';

  paymentMethods: { value: PaymentMethod; label: string }[] = [];

  constructor() {
    this.paymentMethods = [
      { value: PaymentMethod.CASH, label: this.i18n.fanyi('checkout.payment.cash') },
      { value: PaymentMethod.BANKING, label: this.i18n.fanyi('checkout.payment.transfer') },
      { value: PaymentMethod.CREDIT_CARD, label: this.i18n.fanyi('checkout.payment.creditCard') }
    ];
  }

  onOrderIdChange(): void {
    if (this.orderId && this.orderId.trim().length >= 10) {
      this.loadVouchers();
    } else {
      this.applicableVouchers = [];
      this.selectedVoucherId = '';
    }
  }

  loadVouchers(): void {
    if (!this.orderId.trim()) return;
    this.invoiceService.getApplicableVouchers(this.orderId.trim()).subscribe({
      next: res => {
        this.applicableVouchers = (res || []).filter(v => !v.voucherCode);
        this.cdr.markForCheck();
      },
      error: () => {
        this.applicableVouchers = [];
        this.cdr.markForCheck();
      }
    });
  }

  onVoucherSelected(): void {
    if (this.selectedVoucherId) {
      this.voucherCode = '';
    }
  }

  onVoucherCodeInput(): void {
    if (this.voucherCode) {
      this.selectedVoucherId = '';
    }
  }

  onCheckout(): void {
    if (!this.orderId.trim()) {
      this.message.warning(this.i18n.fanyi('checkout.msg.orderIdRequired'));
      return;
    }

    this.loading = true;

    const proceedCheckout = () => {
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
          this.message.error(err?.error?.errorMessage || this.i18n.fanyi('checkout.msg.checkoutError'));
          this.cdr.markForCheck();
        }
      });
    };

    if (this.selectedVoucherId) {
      this.invoiceService.applyVoucher(this.orderId.trim(), this.selectedVoucherId).subscribe({
        next: () => {
          proceedCheckout();
        },
        error: err => {
          this.loading = false;
          this.message.error(err?.error?.errorMessage || this.i18n.fanyi('checkout.msg.applyVoucherError'));
          this.cdr.markForCheck();
        }
      });
    } else {
      proceedCheckout();
    }
  }

  onCancel(): void {
    this.modalRef.close();
  }
}
