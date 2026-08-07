import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { I18NService } from '@core';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { catchError, EMPTY, finalize } from 'rxjs';

import { EmployeeSelectionModalComponent } from '../../employee/employee-selection-modal/employee-selection-modal.component';
import { EmployeeResponse } from '../../employee/employee.model';
import { BranchManagerResponse, EmployeeStatus, OrganizationBranchResponse } from '../branch.model';
import { BranchService } from '../branch.service';

export interface BranchManagerModalData {
  branch: OrganizationBranchResponse;
}

@Component({
  selector: 'app-branch-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nPipe, NzButtonModule, NzDescriptionsModule, NzIconModule, NzPopconfirmModule, NzSkeletonModule, NzTagModule],
  templateUrl: './branch-manager.component.html',
  styleUrl: './branch-manager.component.less'
})
export class BranchManagerComponent implements OnInit {
  private modalRef = inject(NzModalRef);
  private modal = inject(NzModalService);
  private branchService = inject(BranchService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private i18n = inject<I18NService>(ALAIN_I18N_TOKEN);
  private modalData = inject<BranchManagerModalData>(NZ_MODAL_DATA);

  branch = this.modalData.branch;
  managerDetail: BranchManagerResponse | null = null;
  loadingDetail = false;
  loading = false;
  changed = false;

  get hasManager(): boolean {
    return !!this.managerDetail || !!this.branch.managerId;
  }

  get displayName(): string | null {
    return (
      this.managerDetail?.managerName || this.managerDetail?.username || this.branch.managerName || this.branch.managerUsername || null
    );
  }

  ngOnInit(): void {
    if (this.branch.managerId) {
      this.loadManagerDetail();
    }
  }

  private loadManagerDetail(): void {
    this.loadingDetail = true;
    this.cdr.markForCheck();

    this.branchService
      .getBranchManager(this.branch.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.managerDetail = null;
          return EMPTY;
        }),
        finalize(() => {
          this.loadingDetail = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(detail => {
        this.managerDetail = detail;
        this.cdr.markForCheck();
      });
  }

  getStatusColor(status: EmployeeStatus | null | undefined): string {
    switch (status) {
      case EmployeeStatus.ACTIVE:
        return 'success';
      case EmployeeStatus.TERMINATED:
        return 'error';
      case EmployeeStatus.INACTIVE:
        return 'warning';
      default:
        return 'default';
    }
  }

  openAssign(): void {
    const modalRef = this.modal.create({
      nzTitle: this.translate(this.hasManager ? 'branch.manager.replace' : 'branch.manager.assign'),
      nzContent: EmployeeSelectionModalComponent,
      nzWidth: 'min(1200px, calc(100vw - 32px))',
      nzFooter: null,
      nzBodyStyle: {
        padding: '16px 24px 0',
        maxHeight: 'calc(100vh - 180px)',
        overflow: 'auto'
      },
      nzData: {
        organizationId: this.branch.organizationId,
        branchId: this.branch.id,
        role: 'MANAGER',
        status: 'ACTIVE'
      }
    });

    modalRef.afterClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((employee?: EmployeeResponse) => {
      if (!employee) return;

      const managerUserId = employee.userId;
      if (!managerUserId) {
        this.message.error(this.translate('branch.manager.errors.notFound'));
        return;
      }

      this.assign(managerUserId);
    });
  }

  removeManager(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.branchService
      .removeManager(this.branch.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error: HttpErrorResponse) => {
          this.message.error(this.translate(this.getManagerErrorKey(error)));
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success(this.translate('branch.manager.removeSuccess'));
        this.managerDetail = null;
        this.branch = {
          ...this.branch,
          managerId: null,
          managerUserId: null,
          managerName: null,
          managerUsername: null,
          managerEmail: null
        };
        this.changed = true;
        this.cdr.markForCheck();
      });
  }

  close(): void {
    this.modalRef.destroy(this.changed);
  }

  private assign(managerUserId: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.branchService
      .assignManager(this.branch.id, managerUserId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error: HttpErrorResponse) => {
          this.message.error(this.translate(this.getManagerErrorKey(error)));
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((manager: BranchManagerResponse) => {
        this.message.success(this.translate(this.hasManager ? 'branch.manager.replaceSuccess' : 'branch.manager.assignSuccess'));
        this.managerDetail = manager;
        this.branch = {
          ...this.branch,
          managerId: manager.employeeId ?? manager.managerId ?? null,
          managerUserId: manager.userId ?? manager.managerUserId ?? null,
          managerName: manager.managerName ?? manager.username ?? null,
          managerUsername: manager.username ?? null,
          managerEmail: manager.email ?? null
        };
        this.changed = true;
        this.cdr.markForCheck();
      });
  }

  private getManagerErrorKey(error: HttpErrorResponse): string {
    const code = this.extractErrorCode(error);
    switch (code) {
      case 'BRANCH_MANAGER_1002':
        return 'branch.manager.errors.inactive';
      case 'BRANCH_MANAGER_1003':
        return 'branch.manager.errors.invalidRequest';
      case 'BRANCH_MANAGER_1004':
        return 'branch.manager.errors.invalidBranch';
      case 'BRANCH_MANAGER_1005':
        return 'branch.manager.errors.invalidRole';
      case 'BRANCH_MANAGER_1006':
        return 'branch.manager.errors.expired';
      default:
        return 'branch.manager.errors.notFound';
    }
  }

  private extractErrorCode(error: HttpErrorResponse): string | null {
    const body = error.error as { errorMessage?: { errorCode?: string; code?: string } } | null;
    return body?.errorMessage?.errorCode ?? body?.errorMessage?.code ?? null;
  }

  private translate(key: string): string {
    return this.i18n.fanyi(key);
  }
}
