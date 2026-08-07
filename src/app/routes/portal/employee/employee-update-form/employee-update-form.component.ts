import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { catchError, EMPTY, finalize } from 'rxjs';

import { mapApiError } from '../../../../shared/utils/api-error';
import { EmployeeResponse, UpdateEmployeeRequest } from '../employee.model';
import { EmployeeService } from '../employee.service';
import { PHONE_PATTERN, toDateString } from '../employee.util';

interface ModalData {
  employee: EmployeeResponse;
}

/** B2 — patch-style. Gửi kèm `status` hiện tại; đổi trạng thái là popup riêng. */
@Component({
  selector: 'app-employee-update-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NzAlertModule, NzButtonModule, NzDatePickerModule, NzFormModule, NzInputModule, I18nPipe],
  templateUrl: './employee-update-form.component.html',
  styleUrl: './employee-update-form.component.less'
})
export class EmployeeUpdateFormComponent {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private employeeService = inject(EmployeeService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private i18n = inject(ALAIN_I18N_TOKEN);
  private modalData = inject<ModalData>(NZ_MODAL_DATA);

  employee = this.modalData.employee;
  loading = false;
  errorText = '';

  form = this.fb.group({
    fullName: this.fb.control(this.employee.fullName ?? '', [Validators.minLength(2), Validators.maxLength(255)]),
    phone: this.fb.control(this.employee.phone ?? '', [Validators.pattern(PHONE_PATTERN)]),
    startDate: this.fb.control<Date | null>(this.employee.startDate ? new Date(this.employee.startDate) : null),
    endDate: this.fb.control<Date | null>(null)
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
    const request: UpdateEmployeeRequest = { status: this.employee.status };
    if (raw.fullName) request.fullName = raw.fullName;
    if (raw.phone) request.phone = raw.phone;
    if (raw.startDate) request.startDate = toDateString(raw.startDate);
    if (raw.endDate) request.endDate = toDateString(raw.endDate);

    this.employeeService
      .updateEmployee(this.employee.id, request)
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
        this.message.success(this.i18n.fanyi('app.employee.form.updateSuccess'));
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
