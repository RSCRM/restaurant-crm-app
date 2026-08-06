import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { catchError, EMPTY, finalize } from 'rxjs';

import { mapApiError } from '../../../../shared/utils/api-error';
import { EmployeeResponse, EmployeeStatus, UpdateEmployeeRequest } from '../employee.model';
import { EmployeeService } from '../employee.service';

interface ModalData {
  employee: EmployeeResponse;
}

/** B2 với trạng thái mới; các field khác lấy từ dữ liệu hiện tại của nhân viên. */
@Component({
  selector: 'app-employee-status-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NzAlertModule, NzButtonModule, NzFormModule, NzSelectModule, I18nPipe],
  templateUrl: './employee-status-form.component.html',
  styleUrl: './employee-status-form.component.less'
})
export class EmployeeStatusFormComponent {
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

  /** Không cho chọn ACTIVE khi chưa gán vai trò — backend trả EMPLOYEE_ACTIVATE_REQUIRES_ORG_ROLE. */
  readonly canActivate = this.employee.orgRoleName != null;

  readonly statusOptions = [
    { value: EmployeeStatus.ACTIVE, labelKey: 'app.employee.status.ACTIVE', disabled: !this.canActivate },
    { value: EmployeeStatus.INACTIVE, labelKey: 'app.employee.status.INACTIVE', disabled: false },
    { value: EmployeeStatus.TERMINATED, labelKey: 'app.employee.status.TERMINATED', disabled: false }
  ];

  form = this.fb.group({
    status: this.fb.control<EmployeeStatus>(this.employee.status, [Validators.required])
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorText = '';
    this.loading = true;
    this.cdr.markForCheck();

    const request: UpdateEmployeeRequest = { status: this.form.getRawValue().status };
    if (this.employee.fullName) request.fullName = this.employee.fullName;
    if (this.employee.phone) request.phone = this.employee.phone;
    if (this.employee.startDate) request.startDate = this.employee.startDate;

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
        this.message.success(this.i18n.fanyi('app.employee.form.statusSuccess'));
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
