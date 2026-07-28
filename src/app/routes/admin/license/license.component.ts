import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { STColumn, STComponent, STModule, STChange } from '@delon/abc/st';
import { PageHeaderModule } from '@delon/abc/page-header';

import { LicenseFormComponent } from './license-form/license-form.component';
import { LicenseService } from './license.service';
import { LicenseResponse, PagingResponse } from './license.model';

@Component({
  selector: 'app-license',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzPopconfirmModule,
    STModule
  ],
  templateUrl: './license.component.html'
})
export class LicenseComponent implements OnInit {
  @ViewChild('st') st!: STComponent;

  private licenseService = inject(LicenseService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  data: LicenseResponse[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;

  columns: STColumn[] = [
    { title: 'Mã', index: 'code', width: 120 },
    { title: 'Tên', index: 'name', width: 180 },
    {
      title: 'Giá',
      index: 'price',
      width: 130,
      type: 'number',
      format: item => `${item.price?.toLocaleString('vi-VN')} ₫`
    },
    { title: 'Chu kỳ', index: 'billingCycle', width: 100, render: 'billingCycle' },
    {
      title: 'Chi nhánh',
      index: 'maxBranch',
      width: 100,
      format: item => item.maxBranch === -1 ? '∞' : item.maxBranch
    },
    {
      title: 'Nhân viên',
      index: 'maxEmployee',
      width: 100,
      format: item => item.maxEmployee === -1 ? '∞' : item.maxEmployee
    },
    { title: 'Trạng thái', index: 'status', width: 110, render: 'status' },
    {
      title: 'Ngày tạo',
      index: 'createdAt',
      width: 160,
      type: 'date'
    },
    {
      title: 'Thao tác',
      width: 280,
      fixed: 'right',
      buttons: [
        {
          text: 'Sửa',
          icon: 'edit',
          iif: item => item.status === 'ACTIVE',
          click: item => this.openEdit(item)
        },
        {
          text: 'Chi tiết',
          icon: 'eye',
          click: item => this.goToDetail(item)
        },
        {
          text: 'Khóa',
          icon: 'lock',
          iif: item => item.status === 'ACTIVE',
          pop: 'Khóa license này?',
          click: item => this.lockLicense(item)
        },
        {
          text: 'Mở khóa',
          icon: 'unlock',
          iif: item => item.status !== 'ACTIVE',
          pop: 'Mở khóa license này?',
          click: item => this.reactivateLicense(item)
        },
        {
          text: 'Xóa',
          icon: 'delete',
          pop: 'Xác nhận xóa license này?',
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
    this.licenseService.getLicenses({
      page: this.currentPage,
      size: this.pageSize,
      direction: 'DESC',
      field: 'createdAt'
    }).subscribe({
      next: (res: PagingResponse<LicenseResponse>) => {
        this.data = res.data;
        this.total = res.totalElement;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
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
    this.licenseService.lockLicense(license.id).subscribe({
      next: () => {
        this.message.success('Khóa license thành công');
        this.loadData();
      }
    });
  }

  reactivateLicense(license: LicenseResponse): void {
    this.licenseService.reactivateLicense(license.id).subscribe({
      next: () => {
        this.message.success('Mở khóa license thành công');
        this.loadData();
      }
    });
  }

  deleteLicense(license: LicenseResponse): void {
    this.licenseService.deleteLicense(license.id).subscribe({
      next: () => {
        this.message.success('Xóa license thành công');
        this.loadData();
      }
    });
  }
}
