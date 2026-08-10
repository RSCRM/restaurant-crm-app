import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STColumn, STComponent, STModule, STChange } from '@delon/abc/st';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { catchError, EMPTY, finalize } from 'rxjs';

import { UserFormComponent } from './user-form/user-form.component';
import { PagingResponse, UserResponse, UserSearchRequest, UserStatus } from './user.model';
import { UserService } from './user.service';

@Component({
  selector: 'app-user',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzPopconfirmModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzSelectModule,
    FormsModule,
    STModule,
    I18nPipe
  ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.less'
})
export class UserComponent implements OnInit {
  @ViewChild('st') st!: STComponent;

  private userService = inject(UserService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  // Table state
  data: UserResponse[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;

  // Filter state
  filter: UserSearchRequest = {};
  showFilter = false;

  // Enum options
  statusOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Active', value: UserStatus.ACTIVE },
    { label: 'Blocked', value: UserStatus.BLOCKED },
    { label: 'Deleted', value: UserStatus.DELETED }
  ];

  roleOptions = [
    { label: 'Tất cả', value: null },
    { label: 'ADMIN', value: 'ADMIN' },
    { label: 'USER', value: 'USER' }
  ];

  columns: STColumn[] = [
    { title: { i18n: 'app.user.username' }, index: 'username', width: 150 },
    { title: { i18n: 'app.user.email' }, index: 'email', width: 200 },
    { title: { i18n: 'app.user.status' }, index: 'status', width: 120, render: 'status' },
    { title: { i18n: 'app.user.roles' }, index: 'roles', width: 200, render: 'roles' },
    {
      title: { i18n: 'app.user.actions' },
      width: 280,
      fixed: 'right',
      buttons: [
        {
          i18n: 'app.user.detail',
          icon: 'eye',
          click: item => this.goToDetail(item)
        },
        {
          i18n: 'app.user.editRoles',
          icon: 'edit',
          click: item => this.openEditRoles(item)
        },
        {
          i18n: 'app.user.delete',
          icon: 'delete',
          pop: { titleI18n: 'app.user.deleteConfirm' },
          click: item => this.deleteUser(item)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.userService
      .searchUsers(this.filter, this.currentPage, this.pageSize)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.data = [];
          this.total = 0;
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((res: PagingResponse<UserResponse>) => {
        this.data = res.data;
        this.total = res.totalElement;
        this.cdr.markForCheck();
      });
  }

  onSTChange(e: STChange): void {
    if (e.type === 'pi') {
      this.currentPage = e.pi!;
      this.loadData();
    } else if (e.type === 'ps') {
      this.pageSize = e.ps!;
      this.currentPage = 1;
      this.loadData();
    }
  }

  searchValue = '';

  search(): void {
    this.filter.username = this.searchValue || undefined;
    this.filter.email = this.searchValue || undefined;
    this.currentPage = 1;
    this.loadData();
  }

  clearFilter(): void {
    this.filter = {};
    this.searchValue = '';
    this.currentPage = 1;
    this.loadData();
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  get hasActiveFilter(): boolean {
    return this.searchValue !== '' || Object.values(this.filter).some(v => v !== null && v !== undefined && v !== '');
  }

  openCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: UserFormComponent,
      nzWidth: 600,
      nzFooter: null,
      nzData: null
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  openEditRoles(user: UserResponse): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: UserFormComponent,
      nzWidth: 600,
      nzFooter: null,
      nzData: { mode: 'roles', user }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  deleteUser(user: UserResponse): void {
    this.userService
      .deleteUser(user.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Xóa người dùng thất bại');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success('Xóa người dùng thành công');
        this.loadData();
      });
  }

  goToDetail(user: UserResponse): void {
    this.router.navigate(['/admin/user', user.id, 'detail']);
  }
}
