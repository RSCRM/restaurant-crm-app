import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { I18nPipe } from '@delon/theme';
import { catchError, EMPTY, finalize } from 'rxjs';

import { LicenseService } from '../license.service';

@Component({
  selector: 'app-subscription-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzButtonModule,
    I18nPipe
  ],
  templateUrl: './subscription-form.component.html',
  styleUrl: './subscription-form.component.less'
})
export class SubscriptionFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private licenseService = inject(LicenseService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
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
    this.cdr.markForCheck();
    const raw = this.form.getRawValue();

    this.licenseService.grantSubscription({
      organizationId: raw.organizationId,
      licenseId: this.licenseId,
      startDate: raw.startDate ? raw.startDate.toISOString().split('T')[0] : undefined
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.message.error('Cấp subscription thất bại');
        return EMPTY;
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe(() => {
      this.message.success('Cấp subscription thành công');
      this.modalRef.destroy(true);
    });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
