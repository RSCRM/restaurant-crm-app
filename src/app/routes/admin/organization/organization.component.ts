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

import { OrganizationFormComponent } from './organization-form/organization-form.component';
import { OrganizationResponse, OrganizationSearchRequest, OrganizationStatus, PagingResponse } from './organization.model';
import { OrganizationService } from './organization.service';

@Component({
  selector: 'app-organization',
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
  templateUrl: './organization.component.html',
  styleUrl: './organization.component.less'
})
export class OrganizationComponent implements OnInit {
  @ViewChild('st') st!: STComponent;

  private orgService = inject(OrganizationService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  // Table state
  data: OrganizationResponse[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;

  // Filter state
  filter: OrganizationSearchRequest = {};
  showFilter = false;
  searchValue = '';

  // Enum options for status select
  statusOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Active', value: OrganizationStatus.ACTIVE },
    { label: 'Inactive', value: OrganizationStatus.INACTIVE },
    { label: 'Suspended', value: OrganizationStatus.SUSPENDED }
  ];

  columns: STColumn[] = [
    { title: { i18n: 'app.organization.col.name' }, index: 'organizationName', width: 180 },
    { title: { i18n: 'app.organization.col.taxCode' }, index: 'taxCode', width: 130 },
    { title: { i18n: 'app.organization.col.address' }, index: 'address', width: 200 },
    { title: { i18n: 'app.organization.col.phone' }, index: 'phone', width: 130 },
    { title: { i18n: 'app.organization.col.email' }, index: 'email', width: 180 },
    { title: { i18n: 'app.organization.col.status' }, index: 'status', width: 120, render: 'status' },
    {
      title: { i18n: 'app.organization.col.createdAt' },
      index: 'createdAt',
      width: 160,
      type: 'date'
    },
    {
      title: { i18n: 'app.organization.col.actions' },
      width: 250,
      fixed: 'right',
      buttons: [
        {
          i18n: 'app.organization.action.detail',
          icon: 'eye',
          click: item => this.goToDetail(item)
        },
        {
          i18n: 'app.organization.action.edit',
          icon: 'edit',
          click: item => this.openEdit(item)
        },
        {
          i18n: 'app.organization.action.delete',
          icon: 'delete',
          pop: { titleI18n: 'app.organization.deleteConfirm' },
          click: item => this.deleteOrganization(item)
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

    this.orgService
      .searchOrganizations(this.filter, this.currentPage, this.pageSize)
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
      .subscribe((res: PagingResponse<OrganizationResponse>) => {
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

  search(): void {
    this.filter.organizationName = this.searchValue || undefined;
    this.filter.taxCode = this.searchValue || undefined;
    this.filter.phone = this.searchValue || undefined;
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
    return Object.values(this.filter).some(v => v !== null && v !== undefined && v !== '');
  }

  openCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: OrganizationFormComponent,
      nzWidth: 600,
      nzFooter: null,
      nzData: { mode: 'create' }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  openEdit(org: OrganizationResponse): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: OrganizationFormComponent,
      nzWidth: 600,
      nzFooter: null,
      nzData: { mode: 'edit', organization: org }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  deleteOrganization(org: OrganizationResponse): void {
    // TODO: implement delete when API is available
    this.message.info('Chức năng xóa tổ chức chưa được hỗ trợ');
  }

  goToDetail(org: OrganizationResponse): void {
    this.router.navigate(['/admin/organization', org.id, 'detail']);
  }
}
