import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STChange, STColumn, STModule } from '@delon/abc/st';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { I18NService } from '@core';
import { Store } from '@ngrx/store';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';

import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, finalize } from 'rxjs';

import { selectPermissions, selectSelectedContext } from '../../auth/store/auth.selectors';
import { SelectedContext } from '../../auth/store/auth.state';
import { OrganizationBranchResponse } from '../branch/branch.model';
import { BranchService } from '../branch/branch.service';
import { EmployeeDetailComponent } from './employee-detail/employee-detail.component';
import { EmployeeFormComponent } from './employee-form/employee-form.component';
import { EmployeeResponse, EmployeeRoleOption, EmployeeStatus } from './employee.model';
import { EmployeeRoleBadgeComponent } from './employee-role-badge/employee-role-badge.component';
import { EmployeeService } from './employee.service';
import { EmployeeStatusBadgeComponent } from './employee-status-badge/employee-status-badge.component';

import { I18nPipe } from '@delon/theme';

import { UserProfileResponse } from '../profile/profile.model';
import { ProfileService } from '../profile/profile.service';

@Component({
  selector: 'app-employee',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DatePipe,
    PageHeaderModule,
    I18nPipe,
    NzAlertModule,
    NzButtonModule,
    NzCardModule,
    NzEmptyModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSkeletonModule,
    NzTagModule,
    STModule,
    NzTypographyModule,
    EmployeeRoleBadgeComponent,
    EmployeeStatusBadgeComponent
  ],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.less'
})
export class EmployeeComponent implements OnInit {
  private store = inject(Store);
  private employeeService = inject(EmployeeService);
  private branchService = inject(BranchService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private i18n = inject<I18NService>(ALAIN_I18N_TOKEN);
  private searchKeyword$ = new Subject<string>();

  selectedContext: SelectedContext | null = null;
  permissions: string[] = [];
  data: EmployeeResponse[] = [];
  branches: OrganizationBranchResponse[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;
  loadingBranches = false;
  firstLoaded = false;
  errorMessageKey: string | null = null;

  keyword = '';
  filterRole: string | null = null;
  filterStatus: string | null = null;
  filterBranchId: string | null = null;
  sortField: string | null = 'createdAt';
  sortDirection: 'ASC' | 'DESC' | null = 'DESC';

  statuses = [EmployeeStatus.ACTIVE, EmployeeStatus.INACTIVE, EmployeeStatus.TERMINATED];
  roles: EmployeeRoleOption[] = [
    { id: 'MANAGER', name: 'MANAGER' },
    { id: 'CASHIER', name: 'CASHIER' },
    { id: 'WAITER', name: 'WAITER' },
    { id: 'CHEF', name: 'CHEF' }
  ];

  columns: STColumn[] = [
    { title: this.translate('employee.fields.employeeId'), render: 'employeeId', width: 190, sort: true },
    { title: this.translate('employee.fields.fullName'), render: 'identity', width: 240, sort: true },
    { title: this.translate('employee.fields.username'), index: 'username', width: 160, sort: true },
    { title: this.translate('employee.fields.email'), index: 'email', width: 220 },
    { title: this.translate('employee.fields.phone'), index: 'phone', width: 140 },
    { title: this.translate('employee.fields.branch'), render: 'branch', width: 190 },
    { title: this.translate('employee.fields.role'), render: 'role', width: 140 },
    { title: this.translate('employee.fields.status'), render: 'status', width: 150 },
    { title: this.translate('employee.fields.userStatus'), render: 'userStatus', width: 140 },
    { title: this.translate('employee.fields.startDate'), index: 'startDate', width: 140, type: 'date', sort: true },
    { title: this.translate('employee.fields.endDate'), render: 'endDate', width: 140 },
    { title: this.translate('employee.fields.updatedAt'), render: 'updatedAt', width: 160 },
    { title: this.translate('employee.fields.actions'), render: 'actions', width: 320, fixed: 'right' }
  ];

  ngOnInit(): void {
    this.searchKeyword$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(keyword => {
        this.keyword = keyword;
        this.currentPage = 1;
        this.loadData();
      });

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
      .subscribe(context => {
        this.selectedContext = context;
        this.filterBranchId = context?.branchId ?? null;
        this.currentPage = 1;
        this.loadBranches();
        this.loadData();
        this.cdr.markForCheck();
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
      this.errorMessageKey = 'employee.errors.missingOrganization';
      this.firstLoaded = true;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.errorMessageKey = null;
    this.employeeService
      .getEmployees({
        organizationId,
        branchId: this.filterBranchId,
        keyword: this.keyword.trim() || null,
        role: this.filterRole,
        status: this.filterStatus,
        page: this.currentPage,
        size: this.pageSize,
        field: this.sortField,
        direction: this.sortDirection
      })
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

  loadBranches(): void {
    const organizationId = this.selectedContext?.organizationId;
    if (!organizationId) {
      this.branches = [];
      return;
    }

    this.loadingBranches = true;
    this.branchService
      .getBranches(organizationId, { page: 1, size: 200 })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.branches = [];
          this.cdr.markForCheck();
          return EMPTY;
        }),
        finalize(() => {
          this.loadingBranches = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(res => {
        this.branches = res.data;
        this.cdr.markForCheck();
      });
  }

  search(): void {
    this.currentPage = 1;
    this.loadData();
  }

  onKeywordChange(keyword: string): void {
    this.keyword = keyword;
    this.searchKeyword$.next(keyword);
  }

  reset(): void {
    this.keyword = '';
    this.filterRole = null;
    this.filterStatus = null;
    this.filterBranchId = this.selectedContext?.branchId ?? null;
    this.currentPage = 1;
    this.sortField = 'createdAt';
    this.sortDirection = 'DESC';
    this.loadData();
  }

  reload(): void {
    this.loadBranches();
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
      return;
    }

    if (event.type === 'sort') {
      const sort = (event as STChange & { sort?: { column?: { index?: unknown }; value?: string } }).sort;
      this.sortField = sort?.column?.index ? String(sort.column.index) : this.sortField;
      this.sortDirection = sort?.value === 'ascend' ? 'ASC' : sort?.value === 'descend' ? 'DESC' : null;
      this.currentPage = 1;
      this.loadData();
    }
  }

  openCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: EmployeeFormComponent,
      nzWidth: 760,
      nzFooter: null,
      nzData: {
        employee: null,
        organizationId: this.selectedContext?.organizationId ?? null,
        selectedBranchId: this.filterBranchId ?? this.selectedContext?.branchId ?? null,
        branches: this.branches,
        roles: this.roles
      }
    });

    modalRef.afterClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.loadData();
    });
  }

  openEdit(employee: EmployeeResponse): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: EmployeeFormComponent,
      nzWidth: 760,
      nzFooter: null,
      nzData: {
        employee,
        organizationId: this.selectedContext?.organizationId ?? null,
        selectedBranchId: employee.branchId ?? this.selectedContext?.branchId ?? null,
        branches: this.branches,
        roles: this.roles
      }
    });

    modalRef.afterClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.loadData();
    });
  }

  openDetail(employee: EmployeeResponse): void {
    this.loading = true;
    this.employeeService
      .getEmployee(employee.id)
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
        this.modal.create({
          nzTitle: this.translate('employee.detail.title'),
          nzContent: EmployeeDetailComponent,
          nzWidth: 720,
          nzFooter: null,
          nzData: detail
        });
      });
  }

  deleteEmployee(employee: EmployeeResponse): void {
    this.loading = true;
    this.employeeService
      .deleteEmployee(employee.id)
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
        this.message.success(this.translate('employee.messages.deleted'));
        this.loadData();
      });
  }

  enableEmployee(employee: EmployeeResponse): void {
    this.updateAccountStatus(employee, true);
  }

  disableEmployee(employee: EmployeeResponse): void {
    this.updateAccountStatus(employee, false);
  }

  canManage(): boolean {
    return this.selectedContext?.role === 'OWNER' || this.permissions.includes('STAFF_MANAGE') || this.permissions.includes('EMPLOYEE_MANAGE');
  }

  canView(): boolean {
    return this.selectedContext?.role === 'OWNER' || this.permissions.includes('STAFF_VIEW') || this.canManage();
  }

  canUseBranchFilter(): boolean {
    return !this.selectedContext?.branchId;
  }

  getUserStatusColor(employee: EmployeeResponse): string {
    return employee.enabled ? 'success' : 'error';
  }

  getUserStatusKey(employee: EmployeeResponse): string {
    return employee.enabled ? 'employee.userStatus.enabled' : 'employee.userStatus.disabled';
  }

  private updateAccountStatus(employee: EmployeeResponse, enabled: boolean): void {
    this.loading = true;
    const request$ = enabled ? this.employeeService.enableEmployee(employee.id) : this.employeeService.disableEmployee(employee.id);

    request$
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
        this.message.success(this.translate(enabled ? 'employee.messages.enabled' : 'employee.messages.disabled'));
        this.loadData();
      });
  }

  private getErrorKey(error: HttpErrorResponse): string {
    if (error.status === 0) return 'employee.errors.backendConnection';
    return 'employee.errors.operationFailed';
  }

  private translate(key: string): string {
    return this.i18n.fanyi(key);
  }
}
