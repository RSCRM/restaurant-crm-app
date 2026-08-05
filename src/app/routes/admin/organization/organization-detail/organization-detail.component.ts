import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STColumn, STComponent, STModule, STChange } from '@delon/abc/st';
import { I18nPipe } from '@delon/theme';
import { catchError, EMPTY, finalize } from 'rxjs';

import { OrganizationService } from '../organization.service';
import { OrganizationResponse } from '../organization.model';
import { GrantSubscriptionFormComponent } from './grant-subscription-form/grant-subscription-form.component';
import { LicenseService } from '../../license/license.service';
import { SubscriptionResponse, SubscriptionStatus } from '../../license/license.model';

@Component({
  selector: 'app-organization-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    PageHeaderModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzDescriptionsModule,
    NzSpinModule,
    NzSelectModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzDatePickerModule,
    STModule,
    I18nPipe
  ],
  templateUrl: './organization-detail.component.html',
  styleUrl: './organization-detail.component.less'
})
export class OrganizationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orgService = inject(OrganizationService);
  private licenseService = inject(LicenseService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  organization: OrganizationResponse | null = null;
  orgId = '';
  loading = true;

  // Subscription history
  subscriptions: SubscriptionResponse[] = [];
  subTotal = 0;
  subPageSize = 10;
  subCurrentPage = 1;
  subLoading = false;
  showFilter = false;
  hasActiveFilter = false;
  searchValue = '';

  filter: Record<string, any> = {};

  statusOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Revoked', value: 'REVOKED' }
  ];

  billingCycleOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Monthly', value: 'MONTHLY' },
    { label: 'Yearly', value: 'YEARLY' }
  ];

  priceFormatter = (value: number) => value != null ? `${value.toLocaleString('vi-VN')} ₫` : '';

  subColumns: STColumn[] = [
    { title: { i18n: 'app.license.code' }, index: 'license.code', width: 120 },
    { title: { i18n: 'app.license.name' }, index: 'license.name', width: 160 },
    { title: { i18n: 'app.license.subscription.startDate' }, index: 'startDate', width: 130, type: 'date' },
    { title: { i18n: 'app.license.subscription.endDate' }, index: 'endDate', width: 130, type: 'date' },
    { title: { i18n: 'app.license.status' }, render: 'status', width: 110 },
    { title: { i18n: 'app.license.billingCycle' }, render: 'billingCycle', width: 130 },
    { title: { i18n: 'app.license.price' }, render: 'price', width: 130 },
    { title: { i18n: 'app.license.maxBranch' }, render: 'maxBranch', width: 130 },
    { title: { i18n: 'app.license.maxEmployee' }, render: 'maxEmployee', width: 130 },
    {
      title: { i18n: 'app.license.actions' },
      width: 200,
      fixed: 'right',
      buttons: [
        {
          i18n: 'app.subscription.renew',
          icon: 'reload',
          iif: item => item.status === 'ACTIVE',
          pop: { titleI18n: 'app.subscription.renewConfirm' },
          click: item => this.renewSubscription(item.id)
        },
        {
          i18n: 'app.subscription.revoke',
          icon: 'stop',
          iif: item => item.status === 'ACTIVE',
          pop: { titleI18n: 'app.subscription.revokeConfirm' },
          click: item => this.revokeSubscription(item.id)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.orgId = this.route.snapshot.paramMap.get('id') || '';
    this.loadOrganization(this.orgId);
    this.loadSubscriptions();
  }

  private loadOrganization(id: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.orgService.getOrganizationById(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.organization = null;
        return EMPTY;
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe((res: OrganizationResponse) => {
      this.organization = res;
      this.cdr.markForCheck();
    });
  }

  loadSubscriptions(): void {
    this.subLoading = true;
    this.cdr.markForCheck();

    this.orgService.searchSubscriptions(
      this.orgId,
      this.filter,
      this.subCurrentPage,
      this.subPageSize
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => EMPTY),
      finalize(() => {
        this.subLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe(res => {
      this.subscriptions = res.data;
      this.subTotal = res.totalElement;
      this.cdr.markForCheck();
    });
  }

  onSubSTChange(e: STChange): void {
    if (e.type === 'pi' || e.type === 'ps') {
      this.subCurrentPage = e.pi!;
      this.subPageSize = e.ps!;
      this.loadSubscriptions();
    }
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  search(): void {
    if (this.searchValue) {
      this.filter['licenseName'] = this.searchValue;
      this.filter['licenseCode'] = this.searchValue;
    } else {
      delete this.filter['licenseName'];
      delete this.filter['licenseCode'];
    }
    this.hasActiveFilter = Object.values(this.filter).some(v => v != null && v !== '');
    this.subCurrentPage = 1;
    this.loadSubscriptions();
  }

  clearFilter(): void {
    this.filter = {};
    this.searchValue = '';
    this.hasActiveFilter = false;
    this.subCurrentPage = 1;
    this.loadSubscriptions();
  }

  renewSubscription(id: string): void {
    this.licenseService.renewSubscription(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.message.error('Gia hạn subscription thất bại');
        return EMPTY;
      })
    ).subscribe(() => {
      this.message.success('Gia hạn subscription thành công');
      this.loadSubscriptions();
    });
  }

  revokeSubscription(id: string): void {
    this.licenseService.revokeSubscription(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.message.error('Thu hồi subscription thất bại');
        return EMPTY;
      })
    ).subscribe(() => {
      this.message.success('Thu hồi subscription thành công');
      this.loadSubscriptions();
    });
  }

  openGrantSubscription(): void {
    const modalRef = this.modal.create({
      nzContent: GrantSubscriptionFormComponent,
      nzData: this.orgId,
      nzFooter: null,
      nzWidth: 780
    });

    modalRef.afterClose.subscribe((result: boolean) => {
      if (result) {
        this.loadSubscriptions();
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'warning';
      case 'SUSPENDED': return 'error';
      default: return 'default';
    }
  }

  getSubStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'EXPIRED': return 'warning';
      case 'REVOKED': return 'error';
      default: return 'default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'app.organization.status.active';
      case 'INACTIVE': return 'app.organization.status.inactive';
      case 'SUSPENDED': return 'app.organization.status.suspended';
      default: return status;
    }
  }

  getSubStatusText(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'app.license.status.active';
      case 'EXPIRED': return 'app.subscription.status.expired';
      case 'REVOKED': return 'app.subscription.status.revoked';
      default: return status;
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/organization']);
  }
}
