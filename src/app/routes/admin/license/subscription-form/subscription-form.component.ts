import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

import { LicenseService } from '../license.service';

@Component({
  selector: 'app-subscription-form',
  standalone: true,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzDatePickerModule, NzButtonModule, I18nPipe],
  templateUrl: './subscription-form.component.html'
})
export class SubscriptionFormComponent {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private licenseService = inject(LicenseService);
  private message = inject(NzMessageService);
  private licenseId = inject<string>(NZ_MODAL_DATA);
  private i18n = inject(ALAIN_I18N_TOKEN);

  loading = false;

  form = this.fb.group({
    organizationId: this.fb.control('', [Validators.required]),
    startDate: this.fb.control<Date | null>(null)
  });

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const raw = this.form.getRawValue();

    this.licenseService
      .grantSubscription({
        organizationId: raw.organizationId,
        licenseId: this.licenseId,
        startDate: raw.startDate ? raw.startDate.toISOString().split('T')[0] : undefined
      })
      .subscribe({
        next: () => {
          this.message.success(this.i18n.fanyi('subscription.grant-success'));
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
