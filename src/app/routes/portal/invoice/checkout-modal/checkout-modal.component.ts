import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { OrderCookingStatusResponse } from '../../order/order.model';
import { OrderService } from '../../order/order.service';
import { PaymentMethod, CustomerVoucherApplicableResponse } from '../invoice.model';
import { InvoiceService } from '../invoice.service';

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DecimalPipe,
    FormsModule,
    NzButtonModule,
    NzCardModule,
    NzDescriptionsModule,
    NzDividerModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzTableModule,
    NzTagModule,
    I18nPipe
  ],
  templateUrl: './checkout-modal.component.html',
  styleUrl: './checkout-modal.component.less'
})
export class CheckoutModalComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private orderService = inject(OrderService);
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

  paymentMethods: Array<{ value: PaymentMethod; label: string }> = [];

  // Order Details State
  order: OrderCookingStatusResponse | null = null;
  orderLoading = false;

  constructor() {
    this.paymentMethods = [
      { value: PaymentMethod.CASH, label: this.i18n.fanyi('checkout.payment.cash') },
      { value: PaymentMethod.BANKING, label: this.i18n.fanyi('checkout.payment.transfer') },
      { value: PaymentMethod.CREDIT_CARD, label: this.i18n.fanyi('checkout.payment.creditCard') }
    ];
  }

  ngOnInit(): void {
    if (this.orderId) {
      this.loadOrderDetails();
    }
  }

  onOrderIdChange(): void {
    if (this.orderId && this.orderId.trim().length >= 10) {
      this.loadOrderDetails();
    } else {
      this.applicableVouchers = [];
      this.selectedVoucherId = '';
      this.order = null;
      this.cdr.markForCheck();
    }
  }

  loadOrderDetails(): void {
    if (!this.orderId.trim()) return;
    this.orderLoading = true;
    this.cdr.markForCheck();
    this.orderService.getCookingStatus(this.orderId.trim()).subscribe({
      next: res => {
        this.order = res;
        this.orderLoading = false;
        if (res.customerPhone?.trim()) {
          this.loadVouchers();
        } else {
          this.applicableVouchers = [];
          this.selectedVoucherId = '';
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.order = null;
        this.orderLoading = false;
        this.cdr.markForCheck();
      }
    });
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
      this.invoiceService
        .checkout({
          orderId: this.orderId.trim(),
          paymentMethod: this.paymentMethod,
          note: this.note.trim() || undefined,
          voucherCode: this.voucherCode.trim() || undefined
        })
        .subscribe({
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
