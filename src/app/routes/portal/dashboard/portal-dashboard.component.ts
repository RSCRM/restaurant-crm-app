import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderModule } from '@delon/abc/page-header';
import { Store } from '@ngrx/store';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';

import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { distinctUntilChanged } from 'rxjs';

import { AuthService } from '../../auth/services/auth.service';
import { AuthActions } from '../../auth/store/auth.actions';
import { selectSelectedContext } from '../../auth/store/auth.selectors';
import { SelectedContext } from '../../auth/store/auth.state';
import { OrganizationService } from '../../admin/organization/organization.service';
import { BranchManagerResponse, OrganizationBranchResponse } from '../branch/branch.model';
import { BranchService } from '../branch/branch.service';

interface DashboardSummary {
  todayOrders: number;
  revenue: number;
  bookings: number;
  newCustomers: number;
}
import { I18nPipe } from '@delon/theme';


@Component({
  selector: 'app-portal-dashboard',
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
    NzGridModule,
    NzIconModule,
    NzSelectModule,
    NzSkeletonModule,
    NzStatisticModule,
    I18nPipe,
    NzTypographyModule,
    NzTagModule
  ],
  templateUrl: './portal-dashboard.component.html',
  styleUrl: './portal-dashboard.component.less'
})
export class PortalDashboardComponent implements OnInit {
  private store = inject(Store);
  private branchService = inject(BranchService);
  private organizationService = inject(OrganizationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  loadingContext = true;
  loadingSummary = false;
  loadingManager = false;
  selectedContext: SelectedContext | null = null;
  currentOrganizationName: string | null = null;
  currentBranchId: string | null = null;
  currentBranchName: string | null = null;
  currentRole: string | null = null;
  dashboardSummary: DashboardSummary = {
    todayOrders: 0,
    revenue: 0,
    bookings: 0,
    newCustomers: 0
  };
  manager: BranchManagerResponse | null = null;
  dashboardError: string | null = null;
  summaryMessage = 'Backend chưa cung cấp API dashboard summary';
  managerMessage: string | null = null;
  branchOptions: OrganizationBranchResponse[] = [];

  ngOnInit(): void {
    this.store
      .select(selectSelectedContext)
      .pipe(
        distinctUntilChanged(
          (previous, current) =>
            previous?.organizationId === current?.organizationId &&
            previous?.branchId === current?.branchId &&
            previous?.role === current?.role &&
            previous?.dataScope === current?.dataScope
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: context => {
          this.applyContext(context);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingContext = false;
          this.dashboardError = 'Không thể đọc context hiện tại';
          this.cdr.markForCheck();
        }
      });
  }

  onBranchChange(branchId: string): void {
    this.currentBranchId = branchId;
    const selected = this.branchOptions.find(branch => branch.id === branchId);
    this.currentBranchName = selected?.branchName ?? branchId;
    this.persistSelectedBranch(branchId);
  }

  goToBranch(): void {
    this.router.navigate(['/portal/branch']);
  }

  private applyContext(context: SelectedContext | null): void {
    this.loadingContext = false;
    this.dashboardError = null;
    this.selectedContext = context;
    this.currentOrganizationName = null;
    this.currentBranchId = context?.branchId ?? null;
    this.currentBranchName = null;
    this.currentRole = context?.role ?? null;

    if (!context?.organizationId) {
      this.dashboardError = 'Không tìm thấy organization trong context hiện tại';
      return;
    }

    this.loadOrganizationDetail(context.organizationId);

    if (context.branchId) {
      this.loadBranchDetail(context.branchId);
      this.loadDashboardSummary(context.branchId);
      this.loadManagerSummary(context.branchId);
      return;
    }

    this.loadBranchesByOrganization(context.organizationId);
  }

  private loadBranchesByOrganization(organizationId: string): void {
    this.loadingContext = true;
    this.branchService.getBranches(organizationId, { page: 1, size: 50 }).subscribe({
      next: response => {
        this.branchOptions = response.data;
        const firstBranch = response.data[0] ?? null;
        this.currentBranchId = firstBranch?.id ?? null;
        this.currentBranchName = firstBranch?.branchName ?? null;
        this.loadingContext = false;
        if (firstBranch) {
          this.persistSelectedBranch(firstBranch.id);
        }
        this.cdr.markForCheck();
      },
      error: error => {
        this.loadingContext = false;
        this.dashboardError = this.getErrorMessage(error);
        this.cdr.markForCheck();
      }
    });
  }

  private loadBranchDetail(branchId: string): void {
    this.branchService.getBranch(branchId).subscribe({
      next: branch => {
        this.currentBranchId = branch.id;
        this.currentBranchName = branch.branchName;
        this.persistSelectedBranch(branch.id);
        this.cdr.markForCheck();
      },
      error: error => {
        this.dashboardError = this.getErrorMessage(error);
        this.cdr.markForCheck();
      }
    });
  }

  private loadDashboardSummary(_branchId: string): void {
    this.loadingSummary = true;
    this.dashboardSummary = {
      todayOrders: 0,
      revenue: 0,
      bookings: 0,
      newCustomers: 0
    };
    this.loadingSummary = false;
    this.cdr.markForCheck();
  }

  private loadManagerSummary(branchId: string): void {
    this.loadingManager = true;
    this.manager = null;
    this.managerMessage = null;
    this.branchService.getBranchManager(branchId).subscribe({
      next: manager => {
        this.manager = manager;
        this.loadingManager = false;
        this.managerMessage = null;
        this.cdr.markForCheck();
      },
      error: error => {
        this.manager = null;
        this.loadingManager = false;
        this.managerMessage = this.isEmptyManagerError(error) ? null : this.getManagerErrorMessage(error);
        this.cdr.markForCheck();
      }
    });
  }

  private loadOrganizationDetail(organizationId: string): void {
    this.organizationService.getOrganizationById(organizationId).subscribe({
      next: organization => {
        this.currentOrganizationName = organization.organizationName;
        this.cdr.markForCheck();
      },
      error: () => {
        this.currentOrganizationName = organizationId;
        this.cdr.markForCheck();
      }
    });
  }

  private persistSelectedBranch(branchId: string): void {
    if (!this.selectedContext?.organizationId) return;

    const selectedContext: SelectedContext = {
      ...this.selectedContext,
      branchId
    };
    this.selectedContext = selectedContext;
    this.authService.setSelectedContext(selectedContext);
    this.store.dispatch(AuthActions.updateSelectedContext({ selectedContext }));
  }

  private getErrorMessage(error: unknown): string {
    const errorCode = this.extractErrorCode(error);

    switch (errorCode) {
      case 'BRANCH_1004':
      case 'BRANCH_1000':
        return 'Không tìm thấy chi nhánh trong context hiện tại';
      default:
        return 'Không thể tải dữ liệu dashboard theo context hiện tại';
    }
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
