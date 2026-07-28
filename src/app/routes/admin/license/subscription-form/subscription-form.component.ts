import { Component, inject, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';

import { LicenseService } from '../license.service';

@Component({
  selector: 'app-subscription-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzButtonModule
  ],
  templateUrl: './subscription-form.component.html'
})
export class SubscriptionFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private licenseService = inject(LicenseService);
  private message = inject(NzMessageService);
  private licenseId = inject<string>(NZ_MODAL_DATA);

  loading = false;

  form = this.fb.group({
    organizationId: this.fb.control('', [Validators.required]),
    startDate: this.fb.control<Date | null>(null)
  });

  ngOnInit(): void {
    // licenseId is injected via NZ_MODAL_DATA
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const raw = this.form.getRawValue();

    this.licenseService.grantSubscription({
      organizationId: raw.organizationId,
      licenseId: this.licenseId,
      startDate: raw.startDate ? raw.startDate.toISOString().split('T')[0] : undefined
    }).subscribe({
      next: () => {
        this.message.success('Cấp subscription thành công');
        this.modalRef.destroy(true);
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
