import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { I18nPipe } from '@delon/theme';
import { catchError, EMPTY, finalize } from 'rxjs';

import { LicenseService } from '../license.service';
import { BillingCycle, LicenseResponse, LicenseStatus } from '../license.model';

@Component({
  selector: 'app-license-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzButtonModule,
    I18nPipe
  ],
  templateUrl: './license-form.component.html',
  styleUrl: './license-form.component.less'
})
export class LicenseFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private licenseService = inject(LicenseService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private modalData = inject<LicenseResponse | null>(NZ_MODAL_DATA, { optional: true });

  isEdit = false;
  loading = false;

  formatterCurrency = (value: number): string => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  parserCurrency = (value: string): number => Number(value.replace(/,/g, ''));

  form = this.fb.group({
    code: this.fb.control('', [Validators.required, Validators.maxLength(50)]),
    name: this.fb.control('', [Validators.required, Validators.maxLength(255)]),
    description: this.fb.control(''),
    price: this.fb.control(0, [Validators.required, Validators.min(0)]),
    billingCycle: this.fb.control<BillingCycle>(BillingCycle.MONTHLY, [Validators.required]),
    maxBranch: this.fb.control(1, [Validators.required, Validators.min(-1)]),
    maxEmployee: this.fb.control(10, [Validators.required, Validators.min(-1)]),
    status: this.fb.control<LicenseStatus>(LicenseStatus.ACTIVE)
  });

  ngOnInit(): void {
    if (this.modalData) {
      this.isEdit = true;
      this.form.patchValue({
        code: this.modalData.code,
        name: this.modalData.name,
        description: this.modalData.description || '',
        price: this.modalData.price,
        billingCycle: this.modalData.billingCycle,
        maxBranch: this.modalData.maxBranch,
        maxEmployee: this.modalData.maxEmployee,
        status: this.modalData.status
      });
      this.form.controls.code.disable();
      this.form.controls.name.disable();
    }
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.cdr.markForCheck();
    const raw = this.form.getRawValue();

    if (this.isEdit && this.modalData) {
      this.licenseService.updateLicense(this.modalData.id, {
        description: raw.description,
        price: raw.price,
        billingCycle: raw.billingCycle,
        maxBranch: raw.maxBranch,
        maxEmployee: raw.maxEmployee,
        status: raw.status
      }).pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Cập nhật license thất bại');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      ).subscribe(() => {
        this.message.success('Cập nhật license thành công');
        this.modalRef.destroy(true);
      });
    } else {
      this.licenseService.createLicense({
        code: raw.code,
        name: raw.name,
        description: raw.description,
        price: raw.price,
        billingCycle: raw.billingCycle,
        maxBranch: raw.maxBranch,
        maxEmployee: raw.maxEmployee
      }).pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Tạo license thất bại');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      ).subscribe(() => {
        this.message.success('Tạo license thành công');
        this.modalRef.destroy(true);
      });
    }
  }

  close(): void {
    this.modalRef.destroy();
  }
}
