import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { catchError, debounceTime, EMPTY, finalize, Subject, switchMap } from 'rxjs';

import { LicenseResponse } from '../../../license/license.model';
import { LicenseService } from '../../../license/license.service';

@Component({
  selector: 'app-grant-subscription-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe, NzFormModule, NzInputModule, NzDatePickerModule, NzSpinModule, NzButtonModule, I18nPipe],
  templateUrl: './grant-subscription-form.component.html',
  styleUrl: './grant-subscription-form.component.less'
})
export class GrantSubscriptionFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private licenseService = inject(LicenseService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private organizationId = inject<string>(NZ_MODAL_DATA);

  loading = false;
  licenseLoading = false;
  licenses: LicenseResponse[] = [];
  private search$ = new Subject<string>();

  form = this.fb.group({
    licenseId: this.fb.control('', [Validators.required]),
    startDate: this.fb.control<Date | null>(null)
  });

  ngOnInit(): void {
    this.loadLicenses();

    this.search$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        switchMap(keyword => {
          this.licenseLoading = true;
          this.cdr.markForCheck();
          return this.licenseService.searchLicenses(keyword ? { name: keyword } : {}, 1, 30).pipe(
            finalize(() => {
              this.licenseLoading = false;
              this.cdr.markForCheck();
            })
          );
        })
      )
      .subscribe(res => {
        this.licenses = res.data;
        this.cdr.markForCheck();
      });
  }

  loadLicenses(): void {
    this.licenseLoading = true;
    this.cdr.markForCheck();
    this.licenseService
      .searchLicenses({}, 1, 30)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => EMPTY),
        finalize(() => {
          this.licenseLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(res => {
        this.licenses = res.data;
        this.cdr.markForCheck();
      });
  }

  onSearch(keyword: string): void {
    this.search$.next(keyword);
  }

  selectLicense(licenseId: string): void {
    this.form.patchValue({ licenseId });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.cdr.markForCheck();
    const raw = this.form.getRawValue();

    this.licenseService
      .grantSubscription({
        organizationId: this.organizationId,
        licenseId: raw.licenseId,
        startDate: raw.startDate ? raw.startDate.toISOString().split('T')[0] : undefined
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Cấp subscription thất bại');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success('Cấp subscription thành công');
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
