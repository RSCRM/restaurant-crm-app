import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { catchError, EMPTY, finalize } from 'rxjs';

import { mapApiError } from '../../../../shared/utils/api-error';
import { EmployeeResponse } from '../employee.model';
import { EmployeeService } from '../employee.service';

interface ModalData {
  employee: EmployeeResponse;
}

/** B5 — endpoint riêng, không đi qua API cập nhật thông tin. */
@Component({
  selector: 'app-employee-salary-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NzAlertModule, NzButtonModule, NzFormModule, NzInputNumberModule, I18nPipe],
  templateUrl: './employee-salary-form.component.html',
  styleUrl: './employee-salary-form.component.less'
})
export class EmployeeSalaryFormComponent {
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
    salary: this.fb.control<number>(this.employee.salary ?? 0, [Validators.required, Validators.min(0)])
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorText = '';
    this.loading = true;
    this.cdr.markForCheck();

    this.employeeService
      .updateSalary(this.employee.id, this.form.getRawValue().salary)
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
        this.message.success(this.i18n.fanyi('app.employee.form.salarySuccess'));
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
