import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { I18nPipe } from '@delon/theme';
import { catchError, debounceTime, EMPTY, finalize, Subject, switchMap } from 'rxjs';

import { LicenseService } from '../license.service';
import { OrganizationService } from '../../organization/organization.service';
import { OrganizationResponse } from '../../organization/organization.model';

@Component({
  selector: 'app-subscription-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzSpinModule,
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
  private orgService = inject(OrganizationService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private licenseId = inject<string>(NZ_MODAL_DATA);

  loading = false;
  orgLoading = false;
  organizations: OrganizationResponse[] = [];
  private search$ = new Subject<string>();

  form = this.fb.group({
    organizationId: this.fb.control('', [Validators.required]),
    startDate: this.fb.control<Date | null>(null)
  });

  ngOnInit(): void {
    this.loadOrganizations();

    this.search$.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(300),
      switchMap(keyword => {
        this.orgLoading = true;
        this.cdr.markForCheck();
        return this.orgService.searchOrganizationsWithoutActiveSubscription(
          keyword ? { organizationName: keyword } : {},
          1, 30
        ).pipe(
          finalize(() => {
            this.orgLoading = false;
            this.cdr.markForCheck();
          })
        );
      })
    ).subscribe(res => {
      this.organizations = res.data;
      this.cdr.markForCheck();
    });
  }

  loadOrganizations(): void {
    this.orgLoading = true;
    this.cdr.markForCheck();
    this.orgService.searchOrganizationsWithoutActiveSubscription({}, 1, 30).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => EMPTY),
      finalize(() => {
        this.orgLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe(res => {
      this.organizations = res.data;
      this.cdr.markForCheck();
    });
  }

  onSearch(keyword: string): void {
    this.search$.next(keyword);
  }

  selectOrg(orgId: string): void {
    this.form.patchValue({ organizationId: orgId });
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
