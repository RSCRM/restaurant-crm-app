import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { I18nPipe } from '@delon/theme';
import { catchError, EMPTY, finalize } from 'rxjs';

import { OrderService } from '../order.service';

@Component({
  selector: 'app-update-quantity-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputNumberModule,
    NzButtonModule,
    I18nPipe
  ],
  template: `
    <div class="modal-header">
      <div class="modal-title">{{ 'app.order.updateQuantity.title' | i18n }}</div>
    </div>
    <form nz-form [formGroup]="form" (ngSubmit)="submit()" nzLayout="vertical">
      <nz-form-item>
        <nz-form-label [nzRequired]="true">{{ 'app.order.form.quantity' | i18n }}</nz-form-label>
        <nz-form-control [nzExtra]="'app.order.updateQuantity.hint' | i18n">
          <nz-input-number formControlName="quantity" [nzMin]="0" style="width: 100%;"></nz-input-number>
        </nz-form-control>
      </nz-form-item>

      <div class="modal-footer">
        <button nz-button type="button" (click)="close()">{{ 'app.order.form.cancel' | i18n }}</button>
        <button nz-button type="submit" nzType="primary" [nzLoading]="loading" [disabled]="form.invalid">
          {{ 'app.order.updateQuantity.submit' | i18n }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .modal-header { margin-bottom: 16px; }
    .modal-title { font-size: 18px; font-weight: 600; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `]
})
export class UpdateQuantityFormComponent {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private orderService = inject(OrderService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private modalData = inject<{ orderId: string; orderItemId: string; currentQuantity: number }>(NZ_MODAL_DATA);

  loading = false;

  form = this.fb.group({
    quantity: this.fb.control(this.modalData.currentQuantity, [Validators.required, Validators.min(0)])
  });

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.cdr.markForCheck();

    this.orderService.updateOrderItemQuantity(
      this.modalData.orderId,
      this.modalData.orderItemId,
      { quantity: this.form.getRawValue().quantity }
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.message.error('Cập nhật số lượng thất bại');
        return EMPTY;
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe(() => {
      this.message.success('Cập nhật số lượng thành công');
      this.modalRef.destroy(true);
    });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
