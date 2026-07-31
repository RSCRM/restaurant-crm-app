import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STColumn, STComponent, STModule, STChange } from '@delon/abc/st';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { LicenseFormComponent } from './license-form/license-form.component';
import { LicenseResponse, PagingResponse } from './license.model';
import { LicenseService } from './license.service';

@Component({
  selector: 'app-license',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderModule, NzCardModule, NzButtonModule, NzIconModule, NzTagModule, NzPopconfirmModule, STModule, I18nPipe],
  templateUrl: './license.component.html'
})
export class LicenseComponent implements OnInit {
  @ViewChild('st') st!: STComponent;

  private licenseService = inject(LicenseService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private i18n = inject(ALAIN_I18N_TOKEN);

  data: LicenseResponse[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;

  columns: STColumn[] = [
    { title: this.i18n.fanyi('license.code'), index: 'code', width: 120 },
    { title: this.i18n.fanyi('license.name'), index: 'name', width: 180 },
    {
      title: this.i18n.fanyi('license.price'),
      index: 'price',
      width: 130,
      type: 'number',
      format: item => `${item.price?.toLocaleString('vi-VN')} ₫`
    },
    { title: this.i18n.fanyi('license.billing-cycle'), index: 'billingCycle', width: 100, render: 'billingCycle' },
    {
      title: this.i18n.fanyi('license.max-branches'),
      index: 'maxBranch',
      width: 100,
      format: item => (item.maxBranch === -1 ? '∞' : item.maxBranch)
    },
    {
      title: this.i18n.fanyi('license.max-employees'),
      index: 'maxEmployee',
      width: 100,
      format: item => (item.maxEmployee === -1 ? '∞' : item.maxEmployee)
    },
    { title: this.i18n.fanyi('profile.status'), index: 'status', width: 110, render: 'status' },
    {
      title: this.i18n.fanyi('profile.createdAt'),
      index: 'createdAt',
      width: 160,
      type: 'date'
    },
    {
      title: this.i18n.fanyi('user.action'),
      width: 280,
      fixed: 'right',
      buttons: [
        {
          text: this.i18n.fanyi('user.action.edit'),
          icon: 'edit',
          iif: item => item.status === 'ACTIVE',
          click: item => this.openEdit(item)
        },
        {
          text: this.i18n.fanyi('user.action.detail'),
          icon: 'eye',
          click: item => this.goToDetail(item)
        },
        {
          text: this.i18n.fanyi('action.lock'),
          icon: 'lock',
          iif: item => item.status === 'ACTIVE',
          pop: this.i18n.fanyi('license.confirm-lock'),
          click: item => this.lockLicense(item)
        },
        {
          text: this.i18n.fanyi('action.unlock'),
          icon: 'unlock',
          iif: item => item.status !== 'ACTIVE',
          pop: this.i18n.fanyi('license.confirm-unlock'),
          click: item => this.reactivateLicense(item)
        },
        {
          text: this.i18n.fanyi('action.delete'),
          icon: 'delete',
          pop: this.i18n.fanyi('license.confirm-delete'),
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
    this.licenseService
      .getLicenses({
        page: this.currentPage,
        size: this.pageSize,
        direction: 'DESC',
        field: 'createdAt'
      })
      .subscribe({
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
        this.message.success(this.i18n.fanyi('license.lock-success'));
        this.loadData();
      }
    });
  }

  reactivateLicense(license: LicenseResponse): void {
    this.licenseService.reactivateLicense(license.id).subscribe({
      next: () => {
        this.message.success(this.i18n.fanyi('license.unlock-success'));
        this.loadData();
      }
    });
  }

  deleteLicense(license: LicenseResponse): void {
    this.licenseService.deleteLicense(license.id).subscribe({
      next: () => {
        this.message.success(this.i18n.fanyi('license.delete-success'));
        this.loadData();
      }
    });
  }
}
