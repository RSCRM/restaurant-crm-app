import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STColumn, STComponent, STModule, STChange } from '@delon/abc/st';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { LicenseDetailResponse, LicenseResponse, OrganizationSubscriptionResponse, SubscriptionStatus } from '../license.model';
import { LicenseService } from '../license.service';
import { SubscriptionFormComponent } from '../subscription-form/subscription-form.component';

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
    STModule,
    I18nPipe
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
  private i18n = inject(ALAIN_I18N_TOKEN);

  license: LicenseResponse | null = null;
  loading = true;

  subscriptions: OrganizationSubscriptionResponse[] = [];
  subTotal = 0;
  subCurrentPage = 1;
  subPageSize = 10;
  subLoading = false;

  licenseId = '';

  subColumns: STColumn[] = [
    { title: this.i18n.fanyi('organization.title-short'), index: 'organization.name', width: 180 },
    { title: this.i18n.fanyi('subscription.start-date'), index: 'subscription.startDate', width: 120, type: 'date' },
    { title: this.i18n.fanyi('subscription.end-date'), index: 'subscription.endDate', width: 120, type: 'date' },
    { title: this.i18n.fanyi('profile.status'), render: 'status', width: 110 },
    { title: this.i18n.fanyi('license.billing-cycle'), render: 'billingCycle', width: 100 },
    { title: this.i18n.fanyi('license.price'), render: 'price', width: 130 },
    { title: this.i18n.fanyi('license.max-branches-short'), render: 'maxBranch', width: 100 },
    { title: this.i18n.fanyi('license.max-employees-short'), render: 'maxEmployee', width: 100 },
    {
      title: this.i18n.fanyi('user.action'),
      width: 180,
      fixed: 'right',
      buttons: [
        {
          text: this.i18n.fanyi('subscription.renew'),
          icon: 'reload',
          iif: item => item.subscription.status !== 'REVOKED',
          pop: this.i18n.fanyi('subscription.confirm-renew'),
          click: item => this.renewSubscription(item.subscription.id)
        },
        {
          text: this.i18n.fanyi('subscription.revoke'),
          icon: 'stop',
          iif: item => item.subscription.status !== 'REVOKED',
          pop: this.i18n.fanyi('subscription.confirm-revoke'),
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
        this.message.success(this.i18n.fanyi('subscription.renew-success'));
        this.loadDetail();
      }
    });
  }

  revokeSubscription(subscriptionId: string): void {
    this.licenseService.revokeSubscription(subscriptionId).subscribe({
      next: () => {
        this.message.success(this.i18n.fanyi('subscription.revoke-success'));
        this.loadDetail();
      }
    });
  }

  lockLicense(): void {
    if (!this.license) return;
    this.licenseService.lockLicense(this.license.id).subscribe({
      next: () => {
        this.message.success(this.i18n.fanyi('license.lock-success'));
        this.loadDetail();
      }
    });
  }

  reactivateLicense(): void {
    if (!this.license) return;
    this.licenseService.reactivateLicense(this.license.id).subscribe({
      next: () => {
        this.message.success(this.i18n.fanyi('license.unlock-success'));
        this.loadDetail();
      }
    });
  }

  getSubStatusColor(status: SubscriptionStatus): string {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return 'success';
      case SubscriptionStatus.EXPIRED:
        return 'warning';
      case SubscriptionStatus.REVOKED:
        return 'error';
      default:
        return 'default';
    }
  }

  getSubStatusText(status: SubscriptionStatus): string {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return this.i18n.fanyi('status.active');
      case SubscriptionStatus.EXPIRED:
        return this.i18n.fanyi('status.expired');
      case SubscriptionStatus.REVOKED:
        return this.i18n.fanyi('status.revoked');
      default:
        return status;
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/license']);
  }
}
