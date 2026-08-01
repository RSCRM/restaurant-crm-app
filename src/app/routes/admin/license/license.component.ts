import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STColumn, STComponent, STModule, STChange } from '@delon/abc/st';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { catchError, EMPTY, finalize } from 'rxjs';

import { LicenseFormComponent } from './license-form/license-form.component';
import { LicenseResponse, PagingResponse } from './license.model';
import { LicenseService } from './license.service';

@Component({
  selector: 'app-license',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderModule, NzCardModule, NzButtonModule, NzIconModule, NzTagModule, NzPopconfirmModule, STModule, I18nPipe],
  templateUrl: './license.component.html',
  styleUrl: './license.component.less'
})
export class LicenseComponent implements OnInit {
  @ViewChild('st') st!: STComponent;

  private licenseService = inject(LicenseService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  data: LicenseResponse[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;
  searchValue = '';

  columns: STColumn[] = [
    { title: { i18n: 'app.license.code' }, index: 'code', width: 120 },
    { title: { i18n: 'app.license.name' }, index: 'name', width: 180 },
    {
      title: { i18n: 'app.license.price' },
      index: 'price',
      width: 130,
      type: 'number',
      format: item => `${item.price?.toLocaleString('vi-VN')} ₫`
    },
    { title: { i18n: 'app.license.billingCycle' }, index: 'billingCycle', width: 100, render: 'billingCycle' },
    {
      title: { i18n: 'app.license.maxBranch' },
      index: 'maxBranch',
      width: 100,
      format: item => (item.maxBranch === -1 ? '∞' : item.maxBranch)
    },
    {
      title: { i18n: 'app.license.maxEmployee' },
      index: 'maxEmployee',
      width: 100,
      format: item => (item.maxEmployee === -1 ? '∞' : item.maxEmployee)
    },
    { title: { i18n: 'app.license.status' }, index: 'status', width: 110, render: 'status' },
    {
      title: { i18n: 'app.license.createdAt' },
      index: 'createdAt',
      width: 160,
      type: 'date'
    },
    {
      title: { i18n: 'app.license.detail' },
      width: 280,
      fixed: 'right',
      buttons: [
        {
          i18n: 'app.license.edit',
          icon: 'edit',
          iif: item => item.status === 'ACTIVE',
          click: item => this.openEdit(item)
        },
        {
          i18n: 'app.license.detail',
          icon: 'eye',
          click: item => this.goToDetail(item)
        },
        {
          i18n: 'app.license.lock',
          icon: 'lock',
          iif: item => item.status === 'ACTIVE',
          pop: { titleI18n: 'app.license.lockConfirm' },
          click: item => this.lockLicense(item)
        },
        {
          i18n: 'app.license.unlock',
          icon: 'unlock',
          iif: item => item.status !== 'ACTIVE',
          pop: { titleI18n: 'app.license.unlockConfirm' },
          click: item => this.reactivateLicense(item)
        },
        {
          i18n: 'app.license.delete',
          icon: 'delete',
          pop: { titleI18n: 'app.license.deleteConfirm' },
          click: item => this.deleteLicense(item)
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
    this.licenseService
      .getLicenses({
        page: this.currentPage,
        size: this.pageSize,
        direction: 'DESC',
        field: 'createdAt',
        search: this.searchValue
      })
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
      .subscribe((res: PagingResponse<LicenseResponse>) => {
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

  openCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: LicenseFormComponent,
      nzWidth: 600,
      nzData: null
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  openEdit(license: LicenseResponse): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: LicenseFormComponent,
      nzWidth: 600,
      nzData: license
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  goToDetail(license: LicenseResponse): void {
    this.router.navigate(['/admin/license', license.id, 'detail']);
  }

  lockLicense(license: LicenseResponse): void {
    this.licenseService
      .lockLicense(license.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Khóa license thất bại');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success('Khóa license thành công');
        this.loadData();
      });
  }

  reactivateLicense(license: LicenseResponse): void {
    this.licenseService
      .reactivateLicense(license.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Mở khóa license thất bại');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success('Mở khóa license thành công');
        this.loadData();
      });
  }

  deleteLicense(license: LicenseResponse): void {
    this.licenseService
      .deleteLicense(license.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Xóa license thất bại');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success('Xóa license thành công');
        this.loadData();
      });
  }
}
