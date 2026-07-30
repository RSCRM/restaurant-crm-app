import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18NService } from '@core';
import { PageHeaderModule } from '@delon/abc/page-header';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { Store } from '@ngrx/store';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { EMPTY, catchError, distinctUntilChanged, finalize } from 'rxjs';

import { BranchManagerResponse, OrganizationBranchResponse, OrganizationBranchStatus } from './branch.model';
import { BranchService } from './branch.service';
import { selectPermissions, selectSelectedContext } from '../../auth/store/auth.selectors';
import { SelectedContext } from '../../auth/store/auth.state';

type BranchDisplay = Pick<OrganizationBranchResponse, 'id' | 'organizationId' | 'branchName'> &
  Partial<Omit<OrganizationBranchResponse, 'id' | 'organizationId' | 'branchName'>>;
type ManagerModalMode = 'assign' | 'replace';

@Component({
  selector: 'app-branch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageHeaderModule,
    I18nPipe,
    NzAlertModule,
    NzButtonModule,
    NzCardModule,
    NzDescriptionsModule,
    NzEmptyModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzModalModule,
    NzSkeletonModule,
    NzTagModule
  ],
  templateUrl: './branch.component.html',
  styleUrl: './branch.component.less'
})
export class BranchComponent implements OnInit {
  private store = inject(Store);
  private branchService = inject(BranchService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private modal = inject(NzModalService);
  private notification = inject(NzNotificationService);
  private i18n = inject<I18NService>(ALAIN_I18N_TOKEN);

  selectedContext: SelectedContext | null = null;
  selectedBranchId: string | null = null;
  branch: BranchDisplay | null = null;
  manager: BranchManagerResponse | null = null;
  permissions: string[] = [];
  loadingBranch = false;
  loadingManager = false;
  submitting = false;
  removing = false;
  errorMessageKey: string | null = null;
  managerErrorMessageKey: string | null = null;
  managerModalVisible = false;
  managerModalMode: ManagerModalMode = 'assign';
  managerForm = new FormGroup({
    managerId: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  ngOnInit(): void {
    this.store
      .select(selectSelectedContext)
      .pipe(
        distinctUntilChanged(
          (previousContext, currentContext) =>
            previousContext?.organizationId === currentContext?.organizationId && previousContext?.branchId === currentContext?.branchId
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: context => {
          this.selectedContext = context;
          this.prepareCurrentBranch(context);
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessageKey = 'branch.errors.contextLoad';
          this.cdr.markForCheck();
        }
      });

    this.store
      .select(selectPermissions)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: permissions => {
          this.permissions = permissions;
          this.cdr.markForCheck();
        }
      });
  }

  reload(): void {
    this.prepareCurrentBranch(this.selectedContext);
  }

  getBranchStatusColor(status: OrganizationBranchStatus | null | undefined): string {
    switch (status) {
      case OrganizationBranchStatus.ACTIVE:
        return 'success';
      case OrganizationBranchStatus.CLOSED:
        return 'error';
      case OrganizationBranchStatus.INACTIVE:
        return 'warning';
      default:
        return 'default';
    }
  }

  getBranchStatusKey(status: OrganizationBranchStatus | null | undefined): string {
    switch (status) {
      case OrganizationBranchStatus.ACTIVE:
        return 'branch.status.active';
      case OrganizationBranchStatus.CLOSED:
        return 'branch.status.closed';
      case OrganizationBranchStatus.INACTIVE:
        return 'branch.status.inactive';
      default:
        return 'common.emptyValue';
    }
  }

  getManagerStatusColor(status: string | null | undefined): string {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'TERMINATED':
        return 'error';
      case 'INACTIVE':
        return 'warning';
      default:
        return 'default';
    }
  }

  hasManager(): boolean {
    return Boolean(this.manager?.employeeId || this.manager?.managerId);
  }

  canUpdateManager(): boolean {
    return this.selectedContext?.role === 'OWNER' || this.permissions.includes('BRANCH_MANAGER_UPDATE');
  }

  canRemoveManager(): boolean {
    return this.selectedContext?.role === 'OWNER' || this.permissions.includes('BRANCH_MANAGER_DELETE');
  }

  openManagerModal(mode: ManagerModalMode): void {
    this.managerModalMode = mode;
    this.managerForm.reset({ managerId: mode === 'replace' ? (this.manager?.employeeId ?? this.manager?.managerId ?? '') : '' });
    this.managerModalVisible = true;
    this.cdr.markForCheck();
  }

  closeManagerModal(): void {
    if (this.submitting) return;
    this.managerModalVisible = false;
    this.cdr.markForCheck();
  }

  submitManager(): void {
    if (this.managerForm.invalid) {
      this.managerForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const branchId = this.selectedBranchId;
    const managerId = this.managerForm.controls.managerId.value.trim();
    if (!branchId || !managerId) return;

    this.submitting = true;
    this.managerErrorMessageKey = null;
    this.branchService
      .assignBranchManager(branchId, { managerId })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error: HttpErrorResponse) => {
          this.submitting = false;
          this.managerErrorMessageKey = this.getManagerErrorKey(error);
          this.notification.error(this.translate('common.error'), this.translate(this.managerErrorMessageKey));
          this.cdr.markForCheck();
          return EMPTY;
        }),
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(manager => {
        this.manager = manager;
        this.managerModalVisible = false;
        this.notification.success(
          this.translate('common.success'),
          this.translate(this.managerModalMode === 'replace' ? 'branch.manager.replaceSuccess' : 'branch.manager.assignSuccess')
        );
        this.loadManager(branchId);
        this.cdr.markForCheck();
      });
  }

  confirmRemoveManager(): void {
    const branchId = this.selectedBranchId;
    if (!branchId) return;

    this.modal.confirm({
      nzTitle: this.translate('branch.manager.remove'),
      nzContent: this.translate('branch.manager.confirmRemove'),
      nzOkText: this.translate('branch.manager.remove'),
      nzOkDanger: true,
      nzCancelText: this.translate('common.cancel'),
      nzOnOk: () => this.removeManager(branchId)
    });
  }

  private prepareCurrentBranch(context: SelectedContext | null): void {
    this.errorMessageKey = null;
    this.managerErrorMessageKey = null;
    this.branch = null;
    this.manager = null;

    if (!context?.organizationId) {
      this.errorMessageKey = 'branch.errors.missingOrganization';
      return;
    }

    if (!context.branchId) {
      this.errorMessageKey = 'branch.errors.missingBranch';
      return;
    }

    this.selectedBranchId = context.branchId;
    this.branch = this.createBranchFromContext(context);
    this.loadManager(context.branchId);
  }

  private loadManager(branchId: string | null): void {
    this.manager = null;
    this.managerErrorMessageKey = null;

    if (!branchId) {
      this.loadingManager = false;
      return;
    }

    this.loadingManager = true;
    this.branchService
      .getBranchManager(branchId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error: HttpErrorResponse) => {
          this.manager = null;
          this.loadingManager = false;
          this.managerErrorMessageKey = this.getManagerErrorKey(error);
          this.cdr.markForCheck();
          return EMPTY;
        }),
        finalize(() => {
          this.loadingManager = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(manager => {
        this.manager = manager;
        this.mergeBranchFromManager(manager);
        this.managerErrorMessageKey = null;
        this.cdr.markForCheck();
      });
  }

  private removeManager(branchId: string): void {
    this.removing = true;
    this.managerErrorMessageKey = null;
    this.cdr.markForCheck();

    this.branchService
      .removeBranchManager(branchId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error: HttpErrorResponse) => {
          this.removing = false;
          this.managerErrorMessageKey = this.getManagerErrorKey(error);
          this.notification.error(this.translate('common.error'), this.translate(this.managerErrorMessageKey));
          this.cdr.markForCheck();
          return EMPTY;
        }),
        finalize(() => {
          this.removing = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(manager => {
        this.manager = manager;
        this.mergeBranchFromManager(manager);
        this.notification.success(this.translate('common.success'), this.translate('branch.manager.removeSuccess'));
        this.loadManager(branchId);
        this.cdr.markForCheck();
      });
  }

  private getErrorKey(error: unknown): string {
    if (this.extractStatus(error) === 0) {
      return 'branch.errors.backendConnection';
    }

    const errorCode = this.extractErrorCode(error);

    switch (errorCode) {
      case 'BRANCH_1004':
      case 'BRANCH_1000':
        return 'branch.errors.branchNotFound';
      case 'BRANCH_MANAGER_1000':
      case 'BRANCH_MANAGER_NOT_FOUND':
        return 'branch.manager.errors.notFound';
      case 'BRANCH_MANAGER_1002':
      case 'BRANCH_MANAGER_INACTIVE':
        return 'branch.manager.errors.inactive';
      case 'BRANCH_MANAGER_1004':
      case 'BRANCH_MANAGER_INVALID_BRANCH':
        return 'branch.manager.errors.invalidBranch';
      case 'BRANCH_MANAGER_1005':
      case 'BRANCH_MANAGER_INVALID_ROLE':
        return 'branch.manager.errors.invalidRole';
      case 'BRANCH_MANAGER_1003':
      case 'BRANCH_MANAGER_INVALID_REQUEST':
        return 'branch.manager.errors.invalidRequest';
      case 'BRANCH_MANAGER_1006':
      case 'BRANCH_MANAGER_EXPIRED':
        return 'branch.manager.errors.expired';
      default:
        return 'branch.errors.load';
    }
  }

  private getManagerErrorKey(error: unknown): string {
    const key = this.getErrorKey(error);
    return key === 'branch.errors.load' ? 'branch.manager.loadError' : key;
  }

  private translate(key: string): string {
    return this.i18n.fanyi(key);
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

  private extractStatus(error: unknown): number | null {
    if (!this.isRecord(error)) return null;
    const status = error['status'];
    return typeof status === 'number' ? status : null;
  }

  private createBranchFromContext(context: SelectedContext): BranchDisplay | null {
    if (!context.branchId) return null;

    return {
      id: context.branchId,
      organizationId: context.organizationId ?? '',
      branchName: context.branchName ?? context.branchId,
      branchAddress: null,
      branchPhone: null,
      branchStatus: null,
      managerId: null
    };
  }

  private mergeBranchFromManager(manager: BranchManagerResponse): void {
    if (!manager.branchId) return;

    this.branch = {
      id: this.branch?.id ?? manager.branchId,
      organizationId: this.branch?.organizationId ?? this.selectedContext?.organizationId ?? '',
      managerId: manager.managerId ?? this.branch?.managerId ?? null,
      branchName: this.branch?.branchName || manager.branchName,
      branchAddress: this.branch?.branchAddress ?? manager.branchAddress ?? null,
      branchPhone: this.branch?.branchPhone ?? manager.branchPhone ?? null,
      branchStatus: this.branch?.branchStatus ?? manager.branchStatus ?? manager.branchStauts ?? null,
      createdAt: this.branch?.createdAt ?? '',
      updatedAt: this.branch?.updatedAt ?? ''
    };

    if (this.hasBranchDetails()) {
      this.errorMessageKey = null;
    }
  }

  private hasBranchDetails(): boolean {
    return Boolean(this.branch?.branchAddress || this.branch?.branchPhone || this.branch?.branchStatus);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
