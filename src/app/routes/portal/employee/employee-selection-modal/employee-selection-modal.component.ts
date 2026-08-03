import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { I18NService } from '@core';
import { STChange, STColumn, STModule } from '@delon/abc/st';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, finalize } from 'rxjs';

import { EmployeeRoleBadgeComponent } from '../employee-role-badge/employee-role-badge.component';
import { EmployeeStatusBadgeComponent } from '../employee-status-badge/employee-status-badge.component';
import { EmployeeResponse, EmployeeRoleOption, EmployeeStatus } from '../employee.model';
import { EmployeeService } from '../employee.service';

export interface EmployeeSelectionModalData {
  organizationId: string | null;
  branchId: string | null;
  role?: string | null;
  status?: string | null;
}

@Component({
  selector: 'app-employee-selection-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    I18nPipe,
    NzButtonModule,
    NzEmptyModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    STModule,
    EmployeeRoleBadgeComponent,
    EmployeeStatusBadgeComponent
  ],
  templateUrl: './employee-selection-modal.component.html',
  styleUrl: './employee-selection-modal.component.less'
})
export class EmployeeSelectionModalComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private modalRef = inject(NzModalRef);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private i18n = inject<I18NService>(ALAIN_I18N_TOKEN);
  private modalData = inject<EmployeeSelectionModalData>(NZ_MODAL_DATA);
  private searchKeyword$ = new Subject<string>();

  data: EmployeeResponse[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;
  loadingRoles = false;
  keyword = '';
  role = this.modalData.role ?? null;
  status = this.modalData.status ?? EmployeeStatus.ACTIVE;
  selected: EmployeeResponse | null = null;

  statuses = [EmployeeStatus.ACTIVE, EmployeeStatus.INACTIVE, EmployeeStatus.TERMINATED];
  roles: EmployeeRoleOption[] = [];

  columns: STColumn[] = [
    { title: this.translate('employee.fields.employeeId'), render: 'employeeId', width: 240 },
    { title: this.translate('employee.fields.fullName'), render: 'identity', width: 260 },
    { title: this.translate('employee.fields.branch'), index: 'branchName', width: 190 },
    { title: this.translate('employee.fields.role'), render: 'role', width: 160 },
    { title: this.translate('employee.fields.status'), render: 'status', width: 150 },
    { title: this.translate('employee.fields.actions'), render: 'actions', width: 120, fixed: 'right' }
  ];

  ngOnInit(): void {
    this.searchKeyword$.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(keyword => {
      this.keyword = keyword;
      this.currentPage = 1;
      this.loadData();
    });

    this.loadRoles();
  }

  loadRoles(): void {
    this.loadingRoles = true;
    this.employeeService
      .getOrgRoles()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.roles = [];
          this.cdr.markForCheck();
          return EMPTY;
        }),
        finalize(() => {
          this.loadingRoles = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(roles => {
        this.roles = roles;
        const requestedRole = this.modalData.role;
        const matchedRole = requestedRole ? roles.find(role => role.id === requestedRole || role.name === requestedRole) : null;
        this.role = matchedRole?.id ?? requestedRole ?? null;
        this.loadData();
        this.cdr.markForCheck();
      });
  }

  loadData(): void {
    this.loading = true;
    this.employeeService
      .searchEmployees({
        organizationId: this.modalData.organizationId,
        branchId: this.modalData.branchId,
        keyword: this.keyword.trim() || null,
        role: this.role,
        status: this.status,
        page: this.currentPage,
        size: this.pageSize
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((_error: HttpErrorResponse) => {
          this.data = [];
          this.total = 0;
          this.cdr.markForCheck();
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(res => {
        this.data = res.data;
        this.total = res.totalElement;
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
    this.role = this.modalData.role ?? null;
    this.status = this.modalData.status ?? EmployeeStatus.ACTIVE;
    this.currentPage = 1;
    this.loadData();
  }

  select(employee: EmployeeResponse): void {
    this.selected = employee;
    this.modalRef.destroy(employee);
  }

  close(): void {
    this.modalRef.destroy();
  }

  onSTChange(event: STChange): void {
    if (event.type === 'pi') {
      this.currentPage = event.pi ?? 1;
      this.loadData();
    }

    if (event.type === 'ps') {
      this.pageSize = event.ps ?? 10;
      this.currentPage = 1;
      this.loadData();
    }
  }

  private translate(key: string): string {
    return this.i18n.fanyi(key);
  }
}
