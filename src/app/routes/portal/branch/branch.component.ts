import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PageHeaderModule } from '@delon/abc/page-header';
import { Store } from '@ngrx/store';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { combineLatest, distinctUntilChanged } from 'rxjs';

import { BranchManagerFormComponent } from './branch-manager-form/branch-manager-form.component';
import { BranchManagerFormMode, BranchManagerResponse, OrganizationBranchResponse, OrganizationBranchStatus } from './branch.model';
import { BranchService } from './branch.service';
import { selectHasPermission, selectSelectedContext } from '../../auth/store/auth.selectors';
import { SelectedContext } from '../../auth/store/auth.state';

type BranchDisplay = Pick<OrganizationBranchResponse, 'id' | 'organizationId' | 'branchName'> &
  Partial<Omit<OrganizationBranchResponse, 'id' | 'organizationId' | 'branchName'>>;

@Component({
  selector: 'app-branch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderModule,
    NzAlertModule,
    NzButtonModule,
    NzCardModule,
    NzDescriptionsModule,
    NzEmptyModule,
    NzIconModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSkeletonModule,
    NzTagModule
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

  selectedContext: SelectedContext | null = null;
  branchOptions: OrganizationBranchResponse[] = [];
  selectedBranchId: string | null = null;
  branch: BranchDisplay | null = null;
  manager: BranchManagerResponse | null = null;
  loadingBranch = false;
  loadingManager = false;
  removingManager = false;
  errorMessage: string | null = null;
  managerErrorMessage: string | null = null;
  canAssignManager = false;

  ngOnInit(): void {
    combineLatest([this.store.select(selectSelectedContext), this.store.select(selectHasPermission('BRANCH_MANAGER_ASSIGN'))])
      .pipe(
        distinctUntilChanged(
          ([previousContext, previousPermission], [currentContext, currentPermission]) =>
            previousContext?.organizationId === currentContext?.organizationId &&
            previousContext?.branchId === currentContext?.branchId &&
            previousPermission === currentPermission
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ([context, canAssignManager]) => {
          this.selectedContext = context;
          this.canAssignManager = canAssignManager;
          this.prepareCurrentBranch(context);
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Không thể đọc context hiện tại';
          this.cdr.markForCheck();
        }
      });
  }

  onBranchChange(branchId: string): void {
    this.selectedBranchId = branchId;
    const selectedBranch = this.branchOptions.find(branch => branch.id === branchId);
    if (selectedBranch) {
      this.branch = selectedBranch;
    }
    this.loadBranchById(branchId);
    this.prepareManagerState(branchId);
  }

  reload(): void {
    this.prepareCurrentBranch(this.selectedContext);
  }

  openManagerForm(mode: BranchManagerFormMode): void {
    if (!this.branch || !this.canAssignManager) return;

    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: BranchManagerFormComponent,
      nzWidth: 560,
      nzData: {
        branch: {
          id: this.branch.id,
          branchName: this.branch.branchName,
          manager: this.manager
        },
        mode
      }
    });

    modalRef.afterClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (this.isBranchManagerResponse(result)) {
        this.manager = result;
        this.loadBranchById(result.branchId);
      }
      this.cdr.markForCheck();
    });
  }

  removeManager(): void {
    if (!this.branch || this.removingManager) return;

    this.removingManager = true;
    this.branchService.removeBranchManager(this.branch.id).subscribe({
      next: () => {
        this.manager = null;
        this.managerErrorMessage = null;
        this.removingManager = false;
        this.message.success('Gỡ quản lý chi nhánh thành công');
        this.cdr.markForCheck();
      },
      error: error => {
        this.removingManager = false;
        this.managerErrorMessage = this.getManagerErrorMessage(error);
        this.message.error(this.managerErrorMessage);
        this.cdr.markForCheck();
      }
    });
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

  getBranchStatusText(status: OrganizationBranchStatus | null | undefined): string {
    switch (status) {
      case OrganizationBranchStatus.ACTIVE:
        return 'Hoạt động';
      case OrganizationBranchStatus.CLOSED:
        return 'Đã đóng';
      case OrganizationBranchStatus.INACTIVE:
        return 'Tạm ngưng';
      default:
        return '-';
    }
  }

  private prepareCurrentBranch(context: SelectedContext | null): void {
    this.errorMessage = null;
    this.managerErrorMessage = null;
    this.branch = null;
    this.manager = null;

    if (!context?.organizationId) {
      this.errorMessage = 'Không tìm thấy tổ chức trong context hiện tại';
      return;
    }

    if (context.branchId) {
      this.selectedBranchId = context.branchId;
      this.branch = this.createBranchFromContext(context);
      this.loadBranchById(context.branchId);
      this.prepareManagerState(context.branchId);
      return;
    }

    this.loadFirstBranchByOrganization(context.organizationId);
  }

  private loadFirstBranchByOrganization(organizationId: string): void {
    this.loadingBranch = true;
    this.branchService.getBranches(organizationId, { page: 1, size: 50 }).subscribe({
      next: response => {
        this.branchOptions = response.data;
        const firstBranch = response.data[0] ?? null;
        this.selectedBranchId = firstBranch?.id ?? null;
        this.branch = firstBranch;
        this.loadingBranch = false;
        this.prepareManagerState(firstBranch?.id ?? null);
        this.cdr.markForCheck();
      },
      error: error => {
        this.loadingBranch = false;
        this.errorMessage = this.getErrorMessage(error);
        this.cdr.markForCheck();
      }
    });
  }

  private loadBranchById(branchId: string): void {
    this.loadingBranch = true;
    this.branchService.getBranch(branchId).subscribe({
      next: branch => {
        this.branch = branch;
        this.selectedBranchId = branch.id;
        this.loadingBranch = false;
        this.cdr.markForCheck();
      },
      error: error => {
        this.loadingBranch = false;
        this.errorMessage = this.getErrorMessage(error);
        this.cdr.markForCheck();
      }
    });
  }

  private prepareManagerState(branchId: string | null): void {
    this.manager = null;
    this.managerErrorMessage = null;

    if (!branchId) {
      this.loadingManager = false;
      return;
    }

    this.loadingManager = true;
    this.branchService.getBranchManager(branchId).subscribe({
      next: manager => {
        this.manager = manager;
        this.loadingManager = false;
        this.managerErrorMessage = null;
        this.cdr.markForCheck();
      },
      error: error => {
        this.manager = null;
        this.loadingManager = false;
        this.managerErrorMessage = this.isEmptyManagerError(error) ? null : this.getManagerErrorMessage(error);
        this.cdr.markForCheck();
      }
    });
  }

  private getManagerErrorMessage(error: unknown): string {
    const errorCode = this.extractErrorCode(error);

    switch (errorCode) {
      case 'BRANCH_MANAGER_1000':
        return 'Không tìm thấy nhân viên quản lý';
      case 'BRANCH_MANAGER_1002':
        return 'Nhân viên quản lý không hoạt động';
      case 'BRANCH_MANAGER_1004':
        return 'Nhân viên không thuộc chi nhánh này';
      default:
        return 'Không thể tải thông tin quản lý chi nhánh';
    }
  }

  private isEmptyManagerError(error: unknown): boolean {
    if (!this.isRecord(error)) return false;
    const status = error['status'];
    if (status === 404) return true;
    const errorCode = this.extractErrorCode(error);
    return errorCode === 'BRANCH_MANAGER_1001' || errorCode === 'BRANCH_MANAGER_NOT_FOUND';
  }

  private getErrorMessage(error: unknown): string {
    if (this.extractStatus(error) === 0) {
      return 'Không kết nối được backend qua proxy. Kiểm tra API gateway/backend và proxy.conf.js';
    }

    const errorCode = this.extractErrorCode(error);

    switch (errorCode) {
      case 'BRANCH_1004':
      case 'BRANCH_1000':
        return 'Không tìm thấy chi nhánh';
      case 'BRANCH_MANAGER_1000':
        return 'Không tìm thấy nhân viên quản lý';
      case 'BRANCH_MANAGER_1002':
        return 'Nhân viên quản lý không hoạt động';
      case 'BRANCH_MANAGER_1004':
        return 'Nhân viên không thuộc chi nhánh này';
      case 'BRANCH_MANAGER_1005':
        return 'Nhân viên chưa có vai trò Manager';
      default:
        return 'Không thể tải dữ liệu chi nhánh';
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
      address: null,
      phone: null,
      status: undefined
    };
  }

  private isBranchManagerResponse(value: unknown): value is BranchManagerResponse {
    return this.isRecord(value) && typeof value['branchId'] === 'string';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
