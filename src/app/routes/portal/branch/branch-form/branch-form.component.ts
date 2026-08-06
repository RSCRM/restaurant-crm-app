import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18NService } from '@core';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { EMPTY, catchError, finalize } from 'rxjs';

import { BranchMutationRequest, OrganizationBranchResponse, OrganizationBranchStatus } from '../branch.model';
import { BranchService } from '../branch.service';

export interface BranchFormData {
  organizationId: string;
  branch: OrganizationBranchResponse | null;
}

@Component({
  selector: 'app-branch-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, I18nPipe, NzButtonModule, NzFormModule, NzInputModule, NzSelectModule],
  templateUrl: './branch-form.component.html',
  styleUrl: './branch-form.component.less'
})
export class BranchFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modalRef = inject(NzModalRef);
  private branchService = inject(BranchService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private i18n = inject<I18NService>(ALAIN_I18N_TOKEN);
  private modalData = inject<BranchFormData>(NZ_MODAL_DATA);

  branch = this.modalData.branch;
  isEdit = Boolean(this.branch);
  statuses = [OrganizationBranchStatus.ACTIVE, OrganizationBranchStatus.INACTIVE, OrganizationBranchStatus.CLOSED];
  submitting = false;

  form = this.fb.group({
    branchName: this.fb.control('', [Validators.required, Validators.maxLength(255)]),
    address: this.fb.control('', [Validators.maxLength(500)]),
    phone: this.fb.control('', [Validators.maxLength(20)]),
    status: this.fb.control<OrganizationBranchStatus>(OrganizationBranchStatus.ACTIVE, [Validators.required])
  });

  ngOnInit(): void {
    if (!this.branch) return;

    this.form.patchValue({
      branchName: this.branch.branchName,
      address: this.branch.address ?? '',
      phone: this.branch.phone ?? '',
      status: this.branch.status
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const raw = this.form.getRawValue();
    const request: BranchMutationRequest = {
      organizationId: this.modalData.organizationId,
      branchName: raw.branchName?.trim() ?? '',
      address: raw.address?.trim() || null,
      phone: raw.phone?.trim() || null,
      status: raw.status
    };
    const request$ = this.branch ? this.branchService.updateBranch(this.branch.id, request) : this.branchService.createBranch(request);

    this.submitting = true;
    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error(this.translate('branch.errors.save'));
          return EMPTY;
        }),
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(branch => {
        this.message.success(this.translate(this.isEdit ? 'branch.messages.updated' : 'branch.messages.created'));
        this.modalRef.destroy(branch);
      });
  }

  close(): void {
    if (!this.submitting) {
      this.modalRef.destroy();
    }
  }

  private translate(key: string): string {
    return this.i18n.fanyi(key);
  }
}
