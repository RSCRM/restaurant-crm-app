import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { STColumn, STComponent, STModule, STChange } from '@delon/abc/st';
import { PageHeaderModule } from '@delon/abc/page-header';

import { SubscriptionFormComponent } from '../subscription-form/subscription-form.component';
import { LicenseService } from '../license.service';
import { LicenseDetailResponse, LicenseResponse, LicenseStatus, SubscriptionStatus } from '../license.model';

@Component({
  selector: 'app-license-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    PageHeaderModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzDescriptionsModule,
    NzPopconfirmModule,
    NzSpinModule,
    STModule
  ],
  templateUrl: './license-detail.component.html'
})
export class LicenseDetailComponent implements OnInit {
  @ViewChild('st') st!: STComponent;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private licenseService = inject(LicenseService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  license: LicenseResponse | null = null;
  loading = true;

  subscriptions: { organization: { id: string; name: string }; subscription: any }[] = [];
  subTotal = 0;
  subCurrentPage = 1;
  subPageSize = 10;
  subLoading = false;

  licenseId = '';

  subColumns: STColumn[] = [
    { title: 'Tổ chức', index: 'organization.name', width: 180 },
    { title: 'Ngày bắt đầu', index: 'subscription.startDate', width: 120, type: 'date' },
    { title: 'Ngày kết thúc', index: 'subscription.endDate', width: 120, type: 'date' },
    { title: 'Trạng thái', render: 'status', width: 110 },
    { title: 'Chu kỳ', render: 'billingCycle', width: 100 },
    { title: 'Giá', render: 'price', width: 130 },
    { title: 'CN tối đa', render: 'maxBranch', width: 100 },
    { title: 'NV tối đa', render: 'maxEmployee', width: 100 },
    {
      title: 'Thao tác',
      width: 180,
      fixed: 'right',
      buttons: [
        {
          text: 'Gia hạn',
          icon: 'reload',
          iif: item => item.subscription.status !== 'REVOKED',
          pop: 'Gia hạn subscription này?',
          click: item => this.renewSubscription(item.subscription.id)
        },
        {
          text: 'Thu hồi',
          icon: 'stop',
          iif: item => item.subscription.status !== 'REVOKED',
          pop: 'Thu hồi subscription này? Hành động này không thể hoàn tác.',
          click: item => this.revokeSubscription(item.subscription.id)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.licenseId = this.route.snapshot.paramMap.get('id') || '';
    this.loadDetail();
  }

  loadDetail(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.licenseService.getLicenseDetail(this.licenseId, this.subCurrentPage - 1, this.subPageSize).subscribe({
      next: (res: LicenseDetailResponse) => {
        this.license = res.license;
        this.subscriptions = res.organizations;
        this.subTotal = res.pagination.totalElements;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSubSTChange(e: STChange): void {
    if (e.type === 'pi') {
      this.subCurrentPage = e.pi!;
      this.loadDetail();
    } else if (e.type === 'ps') {
      this.subPageSize = e.ps!;
      this.subCurrentPage = 1;
      this.loadDetail();
    }
  }

  openGrantSubscription(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: SubscriptionFormComponent,
      nzWidth: 500,
      nzData: this.licenseId
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadDetail();
    });
  }

  renewSubscription(subscriptionId: string): void {
    this.licenseService.renewSubscription(subscriptionId).subscribe({
      next: () => {
        this.message.success('Gia hạn subscription thành công');
        this.loadDetail();
      }
    });
  }

  revokeSubscription(subscriptionId: string): void {
    this.licenseService.revokeSubscription(subscriptionId).subscribe({
      next: () => {
        this.message.success('Thu hồi subscription thành công');
        this.loadDetail();
      }
    });
  }

  lockLicense(): void {
    if (!this.license) return;
    this.licenseService.lockLicense(this.license.id).subscribe({
      next: () => {
        this.message.success('Khóa license thành công');
        this.loadDetail();
      }
    });
  }

  reactivateLicense(): void {
    if (!this.license) return;
    this.licenseService.reactivateLicense(this.license.id).subscribe({
      next: () => {
        this.message.success('Mở khóa license thành công');
        this.loadDetail();
      }
    });
  }

  getSubStatusColor(status: SubscriptionStatus): string {
    switch (status) {
      case SubscriptionStatus.ACTIVE: return 'success';
      case SubscriptionStatus.EXPIRED: return 'warning';
      case SubscriptionStatus.REVOKED: return 'error';
      default: return 'default';
    }
  }

  getSubStatusText(status: SubscriptionStatus): string {
    switch (status) {
      case SubscriptionStatus.ACTIVE: return 'Hoạt động';
      case SubscriptionStatus.EXPIRED: return 'Hết hạn';
      case SubscriptionStatus.REVOKED: return 'Đã thu hồi';
      default: return status;
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/license']);
  }
}
