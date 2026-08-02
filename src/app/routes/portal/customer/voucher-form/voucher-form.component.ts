import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

import { VoucherResponse } from '../customer.model';
import { CustomerService } from '../customer.service';

export interface VoucherFormModalData {
  voucher?: VoucherResponse | null;
  restaurantId: string;
}

@Component({
  selector: 'app-voucher-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSwitchModule,
    NzButtonModule,
    NzSpinModule,
    NzGridModule
  ],
  templateUrl: './voucher-form.component.html',
  styleUrls: ['./voucher-form.component.less']
})
export class VoucherFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);
  private modalRef = inject(NzModalRef);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private modalData = inject<VoucherFormModalData>(NZ_MODAL_DATA, { optional: true });

  form!: FormGroup;
  submitting = false;
  isEdit = false;
  voucherId: string | null = null;
  restaurantId = '';

  ngOnInit(): void {
    if (this.modalData) {
      this.restaurantId = this.modalData.restaurantId;
      if (this.modalData.voucher) {
        this.isEdit = true;
        this.voucherId = this.modalData.voucher.id;
      }
    }

    this.initForm();
  }

  private initForm(): void {
    const v = this.modalData?.voucher;
    this.form = this.fb.group({
      title: [v?.title || '', [Validators.required, Validators.maxLength(100)]],
      description: [v?.description || ''],
      discountPercent: [v?.discountPercent || 10, [Validators.required, Validators.min(1), Validators.max(100)]],
      minOrderAmount: [v?.minOrderAmount || 0, [Validators.required, Validators.min(0)]],
      pointCost: [v?.pointCost || 100, [Validators.required, Validators.min(0)]],
      validDays: [v?.validDays || 30, [Validators.required, Validators.min(1)]],
      isActive: [v !== undefined && v !== null ? v.isActive : true]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.submitting = true;
    this.cdr.markForCheck();

    const val = this.form.value;

    if (this.isEdit && this.voucherId) {
      const updateReq = {
        title: val.title.trim(),
        description: val.description ? val.description.trim() : null,
        discountPercent: val.discountPercent,
        minOrderAmount: val.minOrderAmount,
        pointCost: val.pointCost,
        validDays: val.validDays,
        isActive: val.isActive
      };

      this.customerService.updateVoucher(this.voucherId, updateReq).subscribe({
        next: () => {
          this.submitting = false;
          this.message.success('Cập nhật voucher thành công!');
          this.modalRef.close(true);
        },
        error: err => {
          this.submitting = false;
          const msg = err?.error?.errorMessage?.message || err?.message || 'Lỗi khi cập nhật voucher.';
          this.message.error(msg);
          this.cdr.markForCheck();
        }
      });
    } else {
      const createReq = {
        restaurantId: this.restaurantId,
        title: val.title.trim(),
        description: val.description ? val.description.trim() : null,
        discountPercent: val.discountPercent,
        minOrderAmount: val.minOrderAmount,
        pointCost: val.pointCost,
        validDays: val.validDays,
        isActive: val.isActive
      };

      this.customerService.createVoucher(createReq).subscribe({
        next: () => {
          this.submitting = false;
          this.message.success('Tạo voucher mới thành công!');
          this.modalRef.close(true);
        },
        error: err => {
          this.submitting = false;
          const msg = err?.error?.errorMessage?.message || err?.message || 'Lỗi khi tạo voucher.';
          this.message.error(msg);
          this.cdr.markForCheck();
        }
      });
    }
  }

  cancel(): void {
    this.modalRef.close(null);
  }
}
