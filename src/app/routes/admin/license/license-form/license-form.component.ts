import { Component, inject, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';

import { BillingCycle, LicenseResponse, LicenseStatus } from '../license.model';
import { LicenseService } from '../license.service';

@Component({
  selector: 'app-license-form',
  standalone: true,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzInputNumberModule, NzSelectModule, NzButtonModule, I18nPipe],
  templateUrl: './license-form.component.html'
})
export class LicenseFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private licenseService = inject(LicenseService);
  private message = inject(NzMessageService);
  private modalData = inject<LicenseResponse | null>(NZ_MODAL_DATA, { optional: true });
  private i18n = inject(ALAIN_I18N_TOKEN);

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
    const raw = this.form.getRawValue();

    if (this.isEdit && this.modalData) {
      this.licenseService
        .updateLicense(this.modalData.id, {
          description: raw.description,
          price: raw.price,
          billingCycle: raw.billingCycle,
          maxBranch: raw.maxBranch,
          maxEmployee: raw.maxEmployee,
          status: raw.status
        })
        .subscribe({
          next: () => {
            this.message.success(this.i18n.fanyi('license.update-success'));
            this.modalRef.destroy(true);
          },
          error: () => {
            this.loading = false;
          }
        });
    } else {
      this.licenseService
        .createLicense({
          code: raw.code,
          name: raw.name,
          description: raw.description,
          price: raw.price,
          billingCycle: raw.billingCycle,
          maxBranch: raw.maxBranch,
          maxEmployee: raw.maxEmployee
        })
        .subscribe({
          next: () => {
            this.message.success(this.i18n.fanyi('license.create-success'));
            this.modalRef.destroy(true);
          },
          error: () => {
            this.loading = false;
          }
        });
    }
  }

  close(): void {
    this.modalRef.destroy();
  }
}
