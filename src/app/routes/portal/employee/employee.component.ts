import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STColumn, STModule } from '@delon/abc/st';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { Store } from '@ngrx/store';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { catchError, EMPTY, finalize, take } from 'rxjs';

import { mapApiError } from '../../../shared/utils/api-error';
import { selectPermissions } from '../../auth/store/auth.selectors';
import { OrgRoleResponse } from '../org-role/org-role.model';
import { OrgRoleService } from '../org-role/org-role.service';
import { EmployeeDetailComponent } from './employee-detail/employee-detail.component';
import { EmployeeFormComponent } from './employee-form/employee-form.component';
import { EmployeeRoleFormComponent } from './employee-role-form/employee-role-form.component';
import { EmployeeSalaryFormComponent } from './employee-salary-form/employee-salary-form.component';
import { EmployeeStatusFormComponent } from './employee-status-form/employee-status-form.component';
import { EmployeeUpdateFormComponent } from './employee-update-form/employee-update-form.component';
import { BranchOptionResponse, EmployeeResponse, EmployeeStatus } from './employee.model';
import { EmployeeService } from './employee.service';

@Component({
  selector: 'app-employee',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderModule, STModule, NzButtonModule, NzCardModule, NzIconModule, NzTagModule, I18nPipe],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.less'
})
export class EmployeeComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private orgRoleService = inject(OrgRoleService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private i18n = inject(ALAIN_I18N_TOKEN);
  private store = inject(Store);

  data: EmployeeResponse[] = [];
  branches: BranchOptionResponse[] = [];
  roles: OrgRoleResponse[] = [];
  loading = false;

  private permissions: string[] = [];

  get canAdd(): boolean {
    return this.has('EMPLOYEE_ADD') && this.branches.length > 0;
  }

  get canUpdate(): boolean {
    return this.has('EMPLOYEE_UPDATE');
  }

  /**
   * `GET /org-roles` nhận cả `ORG_ROLE_MANAGE` lẫn `EMPLOYEE_ROLE_ASSIGN`, chỉ cần một trong hai.
   * Dùng chung cho việc quyết định có gọi request hay không và có bật nút Gán vai trò hay không,
   * để hai chỗ không bao giờ lệch nhau.
   */
  private get canReadRoleList(): boolean {
    return this.has('ORG_ROLE_MANAGE') || this.has('EMPLOYEE_ROLE_ASSIGN');
  }

  get canAssignRole(): boolean {
    return this.canReadRoleList && this.roles.length > 0;
  }

  get canRevokeRole(): boolean {
    return this.has('EMPLOYEE_ROLE_REVOKE');
  }

  columns: STColumn[] = [
    { title: { i18n: 'app.employee.col.username' }, index: 'username', width: 140 },
    { title: { i18n: 'app.employee.col.fullName' }, index: 'fullName', width: 160, default: '-' },
    { title: { i18n: 'app.employee.col.email' }, index: 'email', width: 200 },
    { title: { i18n: 'app.employee.col.phone' }, index: 'phone', width: 130, default: '-' },
    { title: { i18n: 'app.employee.col.branch' }, width: 160, format: item => this.branchName(item as EmployeeResponse) },
    { title: { i18n: 'app.employee.col.orgRole' }, index: 'orgRoleName', width: 140, default: '-' },
    {
      title: { i18n: 'app.employee.col.salary' },
      index: 'salary',
      width: 130,
      format: item => (item['salary'] != null ? `${(item['salary'] as number).toLocaleString('vi-VN')} ₫` : '-')
    },
    { title: { i18n: 'app.employee.col.status' }, index: 'status', width: 130, render: 'status' },
    { title: { i18n: 'app.employee.col.startDate' }, index: 'startDate', width: 120 },
    {
      title: { i18n: 'app.employee.col.actions' },
      width: 480,
      fixed: 'right',
      buttons: [
        { i18n: 'app.employee.action.detail', icon: 'eye', click: item => this.openDetail(item as EmployeeResponse) },
        {
          i18n: 'app.employee.action.update',
          icon: 'edit',
          iif: () => this.canUpdate,
          iifBehavior: 'disabled',
          tooltip: this.i18n.fanyi('app.employee.tooltip.noPermission'),
          click: item => this.openUpdate(item as EmployeeResponse)
        },
        {
          i18n: 'app.employee.action.salary',
          icon: 'dollar-circle',
          iif: () => this.canUpdate,
          iifBehavior: 'disabled',
          tooltip: this.i18n.fanyi('app.employee.tooltip.noPermission'),
          click: item => this.openSalary(item as EmployeeResponse)
        },
        {
          i18n: 'app.employee.action.assignRole',
          icon: 'user-add',
          iif: () => this.canAssignRole,
          iifBehavior: 'disabled',
          tooltip: this.i18n.fanyi('app.employee.tooltip.noRoleList'),
          click: item => this.openAssignRole(item as EmployeeResponse)
        },
        {
          i18n: 'app.employee.action.revokeRole',
          icon: 'user-delete',
          iif: item => this.canRevokeRole && (item as EmployeeResponse).orgRoleName != null,
          iifBehavior: 'disabled',
          tooltip: this.i18n.fanyi('app.employee.tooltip.noRoleAssigned'),
          pop: { titleI18n: 'app.employee.revokeConfirm' },
          click: item => this.revokeRole(item as EmployeeResponse)
        },
        {
          i18n: 'app.employee.action.status',
          icon: 'swap',
          iif: () => this.canUpdate,
          iifBehavior: 'disabled',
          tooltip: this.i18n.fanyi('app.employee.tooltip.noPermission'),
          click: item => this.openStatus(item as EmployeeResponse)
        },
        {
          i18n: 'app.employee.action.delete',
          icon: 'delete',
          pop: { titleI18n: 'app.employee.deleteConfirm' },
          click: () => this.deleteEmployee()
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.store
      .select(selectPermissions)
      .pipe(take(1))
      .subscribe(permissions => {
        this.permissions = permissions;
      });

    this.loadData();
    this.loadBranches();
    this.loadRoles();
  }

  private has(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  branchName(employee: EmployeeResponse): string {
    return this.branches.find(b => b.id === employee.branchId)?.branchName ?? employee.branchId;
  }

  statusColor(status: EmployeeStatus): string {
    switch (status) {
      case EmployeeStatus.ACTIVE:
        return 'success';
      case EmployeeStatus.INACTIVE:
        return 'warning';
      default:
        return 'error';
    }
  }

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.employeeService
      .listEmployees()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.data = [];
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(employees => {
        this.data = employees;
        this.cdr.markForCheck();
      });
  }

  /** Thiếu quyền thì không gửi request; gọi mà rớt thì danh sách rỗng nên nút Thêm bị disable. */
  private loadBranches(): void {
    if (!this.has('ORGANIZATION_BRANCH_VIEW')) return;

    this.employeeService
      .listBranches()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.branches = [];
          return EMPTY;
        })
      )
      .subscribe(branches => {
        this.branches = branches;
        this.cdr.markForCheck();
      });
  }

  /** Thiếu cả hai permission thì không gửi request; gọi mà rớt thì nút Gán vai trò bị disable. */
  private loadRoles(): void {
    if (!this.canReadRoleList) return;

    this.orgRoleService
      .listRoles()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.roles = [];
          return EMPTY;
        })
      )
      .subscribe(roles => {
        this.roles = roles;
        this.cdr.markForCheck();
      });
  }

  openAdd(): void {
    this.openEmployeeModal(EmployeeFormComponent, { branches: this.branches });
  }

  openUpdate(employee: EmployeeResponse): void {
    this.openEmployeeModal(EmployeeUpdateFormComponent, { employee });
  }

  openSalary(employee: EmployeeResponse): void {
    this.openEmployeeModal(EmployeeSalaryFormComponent, { employee });
  }

  openStatus(employee: EmployeeResponse): void {
    this.openEmployeeModal(EmployeeStatusFormComponent, { employee });
  }

  openAssignRole(employee: EmployeeResponse): void {
    this.openEmployeeModal(EmployeeRoleFormComponent, { employee, roles: this.roles });
  }

  private openEmployeeModal(component: unknown, data: Record<string, unknown>): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: component as never,
      nzWidth: 600,
      nzData: data
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  openDetail(employee: EmployeeResponse): void {
    this.modal.create({
      nzTitle: undefined,
      nzContent: EmployeeDetailComponent,
      nzWidth: 600,
      nzData: { employee, branchName: this.branchName(employee) }
    });
  }

  /** B4 có tác dụng phụ tự hạ ACTIVE về INACTIVE nên phải tải lại cả bảng, không patch một dòng. */
  revokeRole(employee: EmployeeResponse): void {
    this.employeeService
      .revokeRole(employee.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.message.error(mapApiError(err, key => this.i18n.fanyi(key)));
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success(this.i18n.fanyi('app.employee.revokeSuccess'));
        this.loadData();
      });
  }

  /** Backend chưa có API xóa — nút giữ chỗ để gắn API sau. */
  deleteEmployee(): void {
    this.message.info(this.i18n.fanyi('app.employee.deleteUnsupported'));
  }
}
