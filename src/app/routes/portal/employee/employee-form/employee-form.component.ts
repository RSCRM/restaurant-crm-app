import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18NService } from '@core';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { EMPTY, catchError, finalize } from 'rxjs';

import { OrganizationBranchResponse } from '../../branch/branch.model';
import { EmployeeMutationRequest, EmployeeResponse, EmployeeRoleOption, EmployeeStatus } from '../employee.model';
import { EmployeeService } from '../employee.service';

export interface EmployeeFormData {
  employee: EmployeeResponse | null;
  organizationId: string | null;
  selectedBranchId: string | null;
  branches: OrganizationBranchResponse[];
  roles: EmployeeRoleOption[];
}

@Component({
  selector: 'app-employee-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, I18nPipe, NzButtonModule, NzDatePickerModule, NzFormModule, NzInputModule, NzSelectModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.less'
})
export class EmployeeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modalRef = inject(NzModalRef);
  private employeeService = inject(EmployeeService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private i18n = inject<I18NService>(ALAIN_I18N_TOKEN);
  private modalData = inject<EmployeeFormData>(NZ_MODAL_DATA);

  employee = this.modalData.employee;
  isEdit = Boolean(this.employee);
  branches = this.modalData.branches;
  roles = this.modalData.roles;
  showBranchSelect = !this.modalData.selectedBranchId;
  statuses = [EmployeeStatus.ACTIVE, EmployeeStatus.INACTIVE, EmployeeStatus.TERMINATED];
  submitting = false;
  errorMessageKey: string | null = null;

  form = this.fb.group({
    username: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    email: this.fb.control('', [Validators.required, Validators.email, Validators.maxLength(255)]),
    phone: this.fb.control('', [Validators.required, Validators.maxLength(20)]),
    branchId: this.fb.control('', [Validators.required]),
    role: this.fb.control('', [Validators.required]),
    status: this.fb.control<EmployeeStatus>(EmployeeStatus.ACTIVE, [Validators.required]),
    startDate: this.fb.control<Date | null>(null, [Validators.required]),
    endDate: this.fb.control<Date | null>(null)
  });

  ngOnInit(): void {
    if (this.employee) {
      this.form.patchValue({
        username: this.employee.username ?? '',
        email: this.employee.email ?? '',
        phone: this.employee.phone ?? '',
        branchId: this.employee.branchId ?? this.modalData.selectedBranchId ?? '',
        role: this.employee.orgRoleId ?? this.employee.orgRoleName ?? this.employee.role ?? '',
        status: (this.employee.status as EmployeeStatus) ?? EmployeeStatus.ACTIVE,
        startDate: this.toDate(this.employee.startDate),
        endDate: this.toDate(this.employee.endDate)
      });
    } else {
      this.form.patchValue({
        branchId: this.modalData.selectedBranchId ?? '',
        status: EmployeeStatus.ACTIVE,
        startDate: new Date()
      });
    }
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const request = this.buildRequest();
    const request$ = this.employee
      ? this.employeeService.updateEmployee(this.employee.id, request)
      : this.employeeService.createEmployee(request);

    this.submitting = true;
    this.errorMessageKey = null;
    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error: HttpErrorResponse) => {
          this.errorMessageKey = this.getErrorKey(error);
          this.message.error(this.translate(this.errorMessageKey));
          this.cdr.markForCheck();
          return EMPTY;
        }),
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(employee => {
        this.message.success(this.translate(this.isEdit ? 'employee.messages.updated' : 'employee.messages.created'));
        this.modalRef.destroy(employee);
      });
  }

  close(): void {
    if (!this.submitting) {
      this.modalRef.destroy();
    }
  }

  private buildRequest(): EmployeeMutationRequest {
    const raw = this.form.getRawValue();
    const role = raw.role ?? '';

    return {
      username: raw.username?.trim() ?? '',
      email: raw.email?.trim() ?? '',
      phone: raw.phone?.trim() ?? '',
      branchId: raw.branchId ?? '',
      orgRoleId: role,
      status: raw.status ?? EmployeeStatus.ACTIVE,
      startDate: this.toDateString(raw.startDate) ?? '',
      endDate: this.toDateString(raw.endDate)
    };
  }

  private toDate(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null;
  }

  private toDateString(value: Date | null | undefined): string | null {
    if (!value) return null;
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }

  private getErrorKey(error: HttpErrorResponse): string {
    if (error.status === 0) return 'employee.errors.backendConnection';
    return 'employee.errors.operationFailed';
  }

  private translate(key: string): string {
    return this.i18n.fanyi(key);
  }
}
