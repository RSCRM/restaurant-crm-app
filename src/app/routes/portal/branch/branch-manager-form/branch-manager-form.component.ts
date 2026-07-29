import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

import { BranchManagerFormMode, BranchManagerRow } from '../branch.model';
import { BranchService } from '../branch.service';

interface BranchManagerFormData {
  branch: BranchManagerRow;
  mode: BranchManagerFormMode;
}

@Component({
  selector: 'app-branch-manager-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NzButtonModule, NzFormModule, NzInputModule],
  templateUrl: './branch-manager-form.component.html',
  styleUrl: './branch-manager-form.component.less'
})
export class BranchManagerFormComponent {
  private fb = inject(NonNullableFormBuilder);
  private modalRef = inject(NzModalRef);
  private branchService = inject(BranchService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private modalData = inject<BranchManagerFormData>(NZ_MODAL_DATA);

  branch = this.modalData.branch;
  mode = this.modalData.mode;
  submitting = false;

  form = this.fb.group({
    managerId: this.fb.control(this.branch.manager?.employeeId ?? '', [Validators.required])
  });

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    const managerId = this.form.controls.managerId.value.trim();

    this.branchService.assignBranchManager(this.branch.id, { managerId }).subscribe({
      next: response => {
        this.message.success('Cập nhật quản lý chi nhánh thành công');
        this.submitting = false;
        this.cdr.markForCheck();
        this.modalRef.destroy(response);
      },
      error: error => {
        this.message.error(this.getErrorMessage(error));
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  close(): void {
    this.modalRef.destroy();
  }

  private getErrorMessage(error: unknown): string {
    const errorCode = this.extractErrorCode(error);

    switch (errorCode) {
      case 'BRANCH_MANAGER_1000':
        return 'Không tìm thấy nhân viên quản lý';
      case 'BRANCH_MANAGER_1002':
        return 'Nhân viên quản lý không hoạt động';
      case 'BRANCH_MANAGER_1003':
        return 'Vui lòng nhập Employee ID hợp lệ';
      case 'BRANCH_MANAGER_1004':
        return 'Nhân viên không thuộc chi nhánh này';
      case 'BRANCH_MANAGER_1005':
        return 'Nhân viên chưa có vai trò Manager';
      case 'BRANCH_MANAGER_1006':
        return 'Hồ sơ nhân viên đã hết hạn';
      default:
        return 'Không thể cập nhật quản lý chi nhánh';
    }
  }

  private extractErrorCode(error: unknown): string | null {
    if (!this.isRecord(error)) return null;
    const response = error['error'];
    if (!this.isRecord(response)) return null;
    const errorMessage = response['errorMessage'];
    if (!this.isRecord(errorMessage)) return null;
    const code = errorMessage['code'];
    return typeof code === 'string' ? code : null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
