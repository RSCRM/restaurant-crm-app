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
import { OrgRoleResponse } from '../../org-role/org-role.model';
import { EmployeeResponse } from '../employee.model';
import { EmployeeService } from '../employee.service';

interface ModalData {
  employee: EmployeeResponse;
  roles: OrgRoleResponse[];
}

/**
 * B3 — dùng cho cả lần gán đầu lẫn đổi vai trò về sau.
 * Gán vai trò không tự kích hoạt nhân viên; muốn ACTIVE phải đổi trạng thái riêng.
 * Danh sách vai trò được trang danh sách prefetch rồi truyền vào, không gọi lại ở đây.
 */
@Component({
  selector: 'app-employee-role-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NzAlertModule, NzButtonModule, NzFormModule, NzSelectModule, I18nPipe],
  templateUrl: './employee-role-form.component.html',
  styleUrl: './employee-role-form.component.less'
})
export class EmployeeRoleFormComponent {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private employeeService = inject(EmployeeService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private i18n = inject(ALAIN_I18N_TOKEN);
  private modalData = inject<ModalData>(NZ_MODAL_DATA);

  employee = this.modalData.employee;
  roles = this.modalData.roles;
  loading = false;
  errorText = '';

  form = this.fb.group({
    orgRoleId: this.fb.control('', [Validators.required])
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
      .assignRole(this.employee.id, this.form.getRawValue().orgRoleId)
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
        this.message.success(this.i18n.fanyi('app.employee.form.roleSuccess'));
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
