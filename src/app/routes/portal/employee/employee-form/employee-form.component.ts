import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { catchError, EMPTY, finalize } from 'rxjs';

import { mapApiError } from '../../../../shared/utils/api-error';
import { BranchOptionResponse } from '../employee.model';
import { EmployeeService } from '../employee.service';
import { PHONE_PATTERN, toDateString } from '../employee.util';

interface ModalData {
  branches: BranchOptionResponse[];
}

/**
 * B1 — chỉ tạo account + hồ sơ. Backend đặt `status = INACTIVE`, `orgRoleName = null`.
 * Gán vai trò và kích hoạt là hai hành động riêng ở cột thao tác của bảng.
 */
@Component({
  selector: 'app-employee-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzAlertModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    I18nPipe
  ],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.less'
})
export class EmployeeFormComponent {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private employeeService = inject(EmployeeService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private i18n = inject(ALAIN_I18N_TOKEN);
  private modalData = inject<ModalData>(NZ_MODAL_DATA);

  branches = this.modalData.branches;
  loading = false;
  errorText = '';

  form = this.fb.group({
    username: this.fb.control('', [Validators.required]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    fullName: this.fb.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
    phone: this.fb.control('', [Validators.pattern(PHONE_PATTERN)]),
    branchId: this.fb.control('', [Validators.required]),
    startDate: this.fb.control<Date | null>(null, [Validators.required]),
    salary: this.fb.control<number | null>(null)
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorText = '';
    this.loading = true;
    this.cdr.markForCheck();

    const raw = this.form.getRawValue();

    this.employeeService
      .createEmployee({
        username: raw.username,
        email: raw.email,
        fullName: raw.fullName,
        // Bo trong thi control tra chuoi rong; gui chuoi rong len se an loi EMPLOYEE_PHONE_INVALID.
        phone: raw.phone || undefined,
        branchId: raw.branchId,
        startDate: toDateString(raw.startDate!),
        salary: raw.salary ?? undefined
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.errorText = mapApiError(err, key => this.i18n.fanyi(key));
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success(this.i18n.fanyi('app.employee.form.addSuccess'));
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
