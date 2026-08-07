import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { I18NService } from '@core';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STChange, STColumn, STModule } from '@delon/abc/st';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { Store } from '@ngrx/store';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { EMPTY, catchError, distinctUntilChanged, finalize } from 'rxjs';

import { BranchDetailComponent, BranchDetailModalResult } from './branch-detail/branch-detail.component';
import { BranchFormComponent } from './branch-form/branch-form.component';
import { BranchManagerComponent } from './branch-manager/branch-manager.component';
import { OrganizationBranchResponse, OrganizationBranchStatus } from './branch.model';
import { BranchService } from './branch.service';
import { selectPermissions, selectSelectedContext } from '../../auth/store/auth.selectors';
import { SelectedContext } from '../../auth/store/auth.state';

@Component({
  selector: 'app-branch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderModule,
    I18nPipe,
    NzAlertModule,
    NzButtonModule,
    NzEmptyModule,
    NzIconModule,
    NzPopconfirmModule,
    NzSkeletonModule,
    NzTagModule,
    STModule
  ],
  templateUrl: './branch.component.html',
  styleUrl: './branch.component.less'
})
export class BranchComponent implements OnInit {
  private store = inject(Store);
  private branchService = inject(BranchService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private i18n = inject<I18NService>(ALAIN_I18N_TOKEN);

  selectedContext: SelectedContext | null = null;
  permissions: string[] = [];
  data: OrganizationBranchResponse[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;
  firstLoaded = false;
  errorMessageKey: string | null = null;

  columns: STColumn[] = [
    { title: this.translate('branch.branchName'), render: 'branchName', width: 240 },
    { title: this.translate('branch.branchAddress'), index: 'address', width: 260 },
    { title: this.translate('branch.branchPhone'), index: 'phone', width: 150 },
    { title: this.translate('branch.status.title'), render: 'status', width: 140 },
    { title: this.translate('branch.manager.current'), render: 'manager', width: 260 },
    { title: this.translate('employee.fields.actions'), render: 'actions', width: 220 }
  ];

  ngOnInit(): void {
    this.store
      .select(selectSelectedContext)
      .pipe(
        distinctUntilChanged(
          (previous, current) =>
            previous?.organizationId === current?.organizationId &&
            previous?.branchId === current?.branchId &&
            previous?.role === current?.role
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: context => {
          this.selectedContext = context;
          this.currentPage = 1;
          this.loadData();
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
      .subscribe(permissions => {
        this.permissions = permissions;
        this.cdr.markForCheck();
      });
  }

  loadData(): void {
    const organizationId = this.selectedContext?.organizationId;
    if (!organizationId) {
      this.data = [];
      this.total = 0;
      this.firstLoaded = true;
      this.errorMessageKey = 'branch.errors.missingOrganization';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.errorMessageKey = null;
    this.branchService
      .getBranches(organizationId, { page: this.currentPage, size: this.pageSize })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error: HttpErrorResponse) => {
          this.data = [];
          this.total = 0;
          this.errorMessageKey = this.getErrorKey(error);
          this.cdr.markForCheck();
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.firstLoaded = true;
          this.cdr.markForCheck();
        })
      )
      .subscribe(res => {
        this.data = res.data;
        this.total = res.totalElement;
        this.errorMessageKey = null;
        this.cdr.markForCheck();
      });
  }

  reload(): void {
    this.loadData();
  }

  onSTChange(event: STChange): void {
    if (event.type === 'pi') {
      this.currentPage = event.pi ?? 1;
      this.loadData();
      return;
    }

    if (event.type === 'ps') {
      this.pageSize = event.ps ?? 10;
      this.currentPage = 1;
      this.loadData();
    }
  }

  openCreate(): void {
    const organizationId = this.selectedContext?.organizationId;
    if (!organizationId) return;

    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: BranchFormComponent,
      nzWidth: 560,
      nzFooter: null,
      nzData: { organizationId, branch: null }
    });

    modalRef.afterClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.loadData();
    });
  }

  openEdit(branch: OrganizationBranchResponse): void {
    const organizationId = this.selectedContext?.organizationId ?? branch.organizationId;
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: BranchFormComponent,
      nzWidth: 560,
      nzFooter: null,
      nzData: { organizationId, branch }
    });

    modalRef.afterClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.loadData();
    });
  }

  openDetail(branch: OrganizationBranchResponse): void {
    this.loading = true;
    this.branchService
      .getBranch(branch.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error: HttpErrorResponse) => {
          this.message.error(this.translate(this.getErrorKey(error)));
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(detail => {
        const modalRef = this.modal.create({
          nzTitle: this.translate('branch.detail.title'),
          nzContent: BranchDetailComponent,
          nzWidth: 640,
          nzFooter: null,
          nzData: { branch: detail, canEdit: this.canManageBranch() }
        });

        modalRef.afterClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result?: BranchDetailModalResult) => {
          if (result?.action === 'edit') {
            this.openEdit(result.branch);
          }
        });
      });
  }

  deleteBranch(branch: OrganizationBranchResponse): void {
    this.loading = true;
    this.branchService
      .deleteBranch(branch.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error: HttpErrorResponse) => {
          this.message.error(this.translate(this.getErrorKey(error)));
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success(this.translate('branch.messages.deleted'));
        this.loadData();
      });
  }

  openManagerModal(branch: OrganizationBranchResponse): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: BranchManagerComponent,
      nzWidth: 480,
      nzFooter: null,
      nzData: { branch }
    });

    modalRef.afterClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((changed?: boolean) => {
      if (changed) this.loadData();
    });
  }

  canManageBranch(): boolean {
    return this.hasPermission('ORGANIZATION_BRANCH_MANAGE');
  }

  canAssignManager(): boolean {
    return true;
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
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
    return status ? `branch.status.${status.toLowerCase()}` : 'common.emptyValue';
  }

  getManagerName(branch: OrganizationBranchResponse): string | null {
    return branch.managerName || branch.managerUsername || null;
  }

  private getErrorKey(error: HttpErrorResponse): string {
    if (error.status === 0) return 'branch.errors.backendConnection';
    const code = this.extractErrorCode(error);
    if (code === 'BRANCH_1000' || code === 'BRANCH_1004') return 'branch.errors.branchNotFound';
    return 'branch.errors.load';
  }

  private extractErrorCode(error: HttpErrorResponse): string | null {
    const body = error.error as { errorMessage?: { errorCode?: string; code?: string } } | null;
    return body?.errorMessage?.errorCode ?? body?.errorMessage?.code ?? null;
  }

  private translate(key: string): string {
    return this.i18n.fanyi(key);
  }
}
