import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STColumn, STModule, STChange } from '@delon/abc/st';
import { Store } from '@ngrx/store';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';

import {
  CustomerPointResponse,
  CustomerResponse,
  CustomerVoucherResponse,
  PointTransactionResponse,
  PointWalletBalanceResponse,
  VoucherResponse
} from './customer.model';
import { CustomerService } from './customer.service';
import { RedeemModalComponent } from './redeem-modal/redeem-modal.component';
import { VoucherFormComponent } from './voucher-form/voucher-form.component';
import { selectContextToken } from '../../auth/store/auth.selectors';

import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';

@Component({
  selector: 'app-customer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzInputModule,
    NzSelectModule,
    NzFormModule,
    NzGridModule,
    NzTabsModule,
    NzStatisticModule,
    NzSpinModule,
    NzSwitchModule,
    STModule,
    I18nPipe
  ],
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.less']
})
export class CustomerComponent implements OnInit {
  private i18n = inject(ALAIN_I18N_TOKEN);
  private customerService = inject(CustomerService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private store = inject(Store);
  private cdr = inject(ChangeDetectorRef);

  private readonly VN_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/;

  organizationId: string | null = null;
  branchId: string | null = null;
  hasVoucherCreatePermission = false;
  hasRedeemPermission = false;

  // Active Tab Index
  activeTabIndex = 0;

  // Tab 1: Customer Lookup & Wallet
  searchPhone = '';
  searching = false;
  currentCustomer: CustomerResponse | null = null;
  walletBalance: PointWalletBalanceResponse | null = null;

  pointHistory: PointTransactionResponse[] = [];
  pointTotal = 0;
  pointPage = 1;
  pointSize = 10;
  pointLoading = false;

  customerVouchers: CustomerVoucherResponse[] = [];
  voucherTotal = 0;
  voucherPage = 1;
  voucherSize = 10;
  voucherLoading = false;

  // Tab 2: System Vouchers
  systemVouchersList: VoucherResponse[] = [];
  displaySystemVouchers: VoucherResponse[] = [];
  sysVoucherTotal = 0;
  sysVoucherPage = 1;
  sysVoucherSize = 10;
  sysVoucherLoading = false;

  // Filters for System Vouchers
  searchVoucherTitle = '';
  filterVoucherStatus = 'ALL';

  // Delon ST Columns for Point History
  pointColumns: STColumn[] = [];

  // Delon ST Columns for System Vouchers
  sysVoucherColumns: STColumn[] = [];

  private parseTokenPayload(token: string | null): Record<string, unknown> | null {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  // Member Customers List State
  memberCustomersList: CustomerPointResponse[] = [];
  memberCustomerTotal = 0;
  memberCustomerPage = 1;
  memberCustomerSize = 10;
  memberCustomerLoading = false;

  memberCustomerColumns: STColumn[] = [];

  private initColumns(): void {
    this.pointColumns = [
      { title: this.i18n.fanyi('customer.history.col.type'), render: 'type', width: 130 },
      { title: this.i18n.fanyi('customer.history.col.amount'), render: 'amount', width: 120 },
      { title: this.i18n.fanyi('customer.history.col.balanceAfter'), index: 'balanceAfter', width: 120, type: 'number' },
      { title: this.i18n.fanyi('customer.history.col.source'), index: 'source' },
      { title: this.i18n.fanyi('customer.history.col.referenceId'), index: 'referenceId' },
      { title: this.i18n.fanyi('customer.history.col.createdAt'), index: 'createdAt', width: 160, type: 'date' }
    ];

    this.sysVoucherColumns = [
      { title: this.i18n.fanyi('customer.sys-voucher.col.title'), index: 'title', width: 220 },
      { title: this.i18n.fanyi('customer.sys-voucher.col.discountPercent'), index: 'discountPercent', width: 100, format: item => `${item.discountPercent}%` },
      {
        title: this.i18n.fanyi('customer.sys-voucher.col.minBillAmount'),
        index: 'minBillAmount',
        width: 140,
        format: item => `${item.minBillAmount?.toLocaleString('vi-VN')} ₫`
      },
      { title: this.i18n.fanyi('customer.sys-voucher.col.pointsRequired'), index: 'pointsRequired', width: 110, format: item => `${item.pointsRequired} ${this.i18n.fanyi('voucher.points')}` },
      { title: this.i18n.fanyi('customer.sys-voucher.col.isActive'), width: 130, render: 'isActive' },
      { title: this.i18n.fanyi('customer.sys-voucher.col.actions'), width: 120, fixed: 'right', render: 'actions' }
    ];

    this.memberCustomerColumns = [
      { title: this.i18n.fanyi('customer.column.phone'), index: 'customerPhone', width: 160 },
      { title: this.i18n.fanyi('customer.column.points'), index: 'currentPoints', width: 140, type: 'number' },
      { title: this.i18n.fanyi('customer.column.lifetime-points'), index: 'lifetimePoints', width: 160, type: 'number' },
      { title: this.i18n.fanyi('customer.column.updated-at'), index: 'updatedAt', width: 160, type: 'date' },
      {
        title: this.i18n.fanyi('customer.column.actions'),
        width: 140,
        buttons: [
          {
            text: this.i18n.fanyi('customer.action.view-wallet'),
            type: 'link',
            click: (record: CustomerPointResponse) => this.selectCustomerFromList(record)
          }
        ]
      }
    ];
  }

  ngOnInit(): void {
    this.initColumns();

    this.store.select(selectContextToken).subscribe(token => {
      const payload = this.parseTokenPayload(token);
      if (payload) {
        this.organizationId = (payload['organizationId'] as string) || null;
        this.branchId = (payload['branchId'] as string) || null;
        const permissions: string[] = (payload['permission'] as string[]) || [];
        this.hasVoucherCreatePermission = permissions.includes('VOUCHER_CREATE') || permissions.includes('ADMIN');
        this.hasRedeemPermission = permissions.includes('CUSTOMER_VOUCHER_REDEEM') || permissions.includes('ADMIN');

        // Load member customers list for this organization
        this.loadMemberCustomers();

        // Dynamically resolve branchId if not present in context token (e.g. Owner)
        if (this.organizationId) {
          if (!this.branchId) {
            this.customerService.getOrganizationBranches(this.organizationId).subscribe({
              next: branches => {
                if (branches && branches.length > 0) {
                  this.branchId = branches[0].id;
                }
                this.loadSystemVouchers();
              },
              error: () => {
                this.loadSystemVouchers();
              }
            });
          } else {
            this.loadSystemVouchers();
          }
        }
      }
    });
  }

  loadMemberCustomers(): void {
    if (!this.organizationId) return;

    this.memberCustomerLoading = true;
    this.cdr.markForCheck();

    this.customerService
      .getOrganizationCustomers(this.organizationId, this.searchPhone, {
        page: this.memberCustomerPage,
        size: this.memberCustomerSize
      })
      .subscribe({
        next: res => {
          this.memberCustomersList = res.data;
          this.memberCustomerTotal = res.totalElement;
          this.memberCustomerLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.memberCustomerLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  selectCustomerFromList(customerPoint: CustomerPointResponse): void {
    this.searchPhone = customerPoint.customerPhone || '';
    this.currentCustomer = {
      id: customerPoint.customerId,
      phone: customerPoint.customerPhone,
      createdAt: '',
      updatedAt: customerPoint.updatedAt
    };
    this.loadCustomerWalletAndHistory();
  }

  onMemberCustomerSTChange(e: STChange): void {
    if (e.type === 'pi') {
      this.memberCustomerPage = e.pi!;
      this.loadMemberCustomers();
    } else if (e.type === 'ps') {
      this.memberCustomerSize = e.ps!;
      this.memberCustomerPage = 1;
      this.loadMemberCustomers();
    }
  }

  searchCustomer(): void {
    const rawPhone = this.searchPhone.trim();
    if (!rawPhone || !this.VN_PHONE_REGEX.test(rawPhone)) {
      this.message.warning(this.i18n.fanyi('customer.msg.invalid-phone'));
      return;
    }

    if (!this.organizationId) {
      this.message.error(this.i18n.fanyi('customer.msg.org-not-found'));
      return;
    }

    this.searching = true;
    this.cdr.markForCheck();

    this.customerService.identifyCustomer({ phone: rawPhone, restaurantId: this.organizationId }).subscribe({
      next: customer => {
        this.currentCustomer = customer;
        this.searching = false;
        this.message.success(this.i18n.fanyi('customer.msg.identify-success', { phone: customer.phone }));
        this.loadCustomerWalletAndHistory();
      },
      error: err => {
        this.searching = false;
        const msg = err?.error?.errorMessage?.message || err?.message || this.i18n.fanyi('customer.msg.identify-error');
        this.message.error(msg);
        this.cdr.markForCheck();
      }
    });
  }

  resetCustomerSearch(): void {
    this.searchPhone = '';
    this.currentCustomer = null;
    this.walletBalance = null;
    this.pointHistory = [];
    this.customerVouchers = [];
    this.loadMemberCustomers();
    this.cdr.markForCheck();
  }

  loadCustomerWalletAndHistory(): void {
    if (!this.currentCustomer || !this.organizationId) return;

    const customerId = this.currentCustomer.id;

    // Load Wallet Balance
    this.customerService.getWalletBalance(customerId, this.organizationId).subscribe({
      next: balance => {
        this.walletBalance = balance;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error(this.i18n.fanyi('customer.msg.load-wallet-error'));
      }
    });

    // Load Point History
    this.loadPointHistory();

    // Load Customer Vouchers
    this.loadCustomerVouchers();
  }

  loadPointHistory(): void {
    if (!this.currentCustomer || !this.organizationId) return;

    this.pointLoading = true;
    this.cdr.markForCheck();

    this.customerService
      .getPointHistory(this.currentCustomer.id, this.organizationId, {
        page: this.pointPage,
        size: this.pointSize
      })
      .subscribe({
        next: res => {
          this.pointHistory = res.data;
          this.pointTotal = res.totalElement;
          this.pointLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.pointLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadCustomerVouchers(): void {
    if (!this.currentCustomer || !this.branchId) return;

    this.voucherLoading = true;
    this.cdr.markForCheck();

    this.customerService
      .getCustomerVouchers(this.currentCustomer.id, this.branchId, {
        page: this.voucherPage,
        size: this.voucherSize
      })
      .subscribe({
        next: res => {
          this.customerVouchers = res.data;
          this.voucherTotal = res.totalElement;
          this.voucherLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.voucherLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  onPointSTChange(e: STChange): void {
    if (e.type === 'pi') {
      this.pointPage = e.pi!;
      this.loadPointHistory();
    } else if (e.type === 'ps') {
      this.pointSize = e.ps!;
      this.pointPage = 1;
      this.loadPointHistory();
    }
  }

  // System Vouchers (Tab 2)
  loadSystemVouchers(): void {
    if (!this.branchId) return;

    this.sysVoucherLoading = true;
    this.cdr.markForCheck();

    this.customerService
      .getVouchers(this.branchId, {
        page: this.sysVoucherPage,
        size: this.sysVoucherSize
      })
      .subscribe({
        next: res => {
          this.systemVouchersList = res.data;
          this.filterSystemVouchers();
          this.sysVoucherLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.sysVoucherLoading = false;
          this.message.error(this.i18n.fanyi('customer.msg.load-vouchers-error'));
          this.cdr.markForCheck();
        }
      });
  }

  filterSystemVouchers(): void {
    let filtered = [...this.systemVouchersList];

    if (this.filterVoucherStatus === 'ACTIVE') {
      filtered = filtered.filter(v => v.isActive === 1);
    } else if (this.filterVoucherStatus === 'INACTIVE') {
      filtered = filtered.filter(v => v.isActive === 0);
    }

    if (this.searchVoucherTitle.trim()) {
      const q = this.searchVoucherTitle.trim().toLowerCase();
      filtered = filtered.filter(v => v.title.toLowerCase().includes(q));
    }

    this.displaySystemVouchers = filtered;
    this.sysVoucherTotal = filtered.length;
    this.cdr.markForCheck();
  }

  searchVouchers(): void {
    this.filterSystemVouchers();
  }

  resetVoucherFilter(): void {
    this.searchVoucherTitle = '';
    this.filterVoucherStatus = 'ALL';
    this.filterSystemVouchers();
  }

  onSysVoucherSTChange(e: STChange): void {
    if (e.type === 'pi') {
      this.sysVoucherPage = e.pi!;
      this.loadSystemVouchers();
    } else if (e.type === 'ps') {
      this.sysVoucherSize = e.ps!;
      this.sysVoucherPage = 1;
      this.loadSystemVouchers();
    }
  }

  toggleVoucherStatus(voucher: VoucherResponse, active: boolean): void {
    const updateReq = {
      title: voucher.title,
      discountPercent: voucher.discountPercent,
      minBillAmount: voucher.minBillAmount,
      pointsRequired: voucher.pointsRequired,
      isActive: active ? 1 : 0
    };
    this.customerService.updateVoucher(voucher.id, updateReq).subscribe({
      next: () => {
        voucher.isActive = active ? 1 : 0;
        const idx = this.systemVouchersList.findIndex(v => v.id === voucher.id);
        if (idx > -1) {
          this.systemVouchersList[idx].isActive = active ? 1 : 0;
        }
        const msgKey = active ? 'customer.msg.toggle-status-enable-success' : 'customer.msg.toggle-status-disable-success';
        this.message.success(this.i18n.fanyi(msgKey, { title: voucher.title }));
        this.filterSystemVouchers();
      },
      error: err => {
        const msg = err?.error?.errorMessage?.message || err?.message || this.i18n.fanyi('customer.msg.toggle-status-error');
        this.message.error(msg);
        this.loadSystemVouchers();
      }
    });
  }

  openCreateVoucherModal(): void {
    if (!this.branchId) return;

    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: VoucherFormComponent,
      nzWidth: 600,
      nzFooter: null,
      nzData: {
        restaurantId: this.branchId
      }
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadSystemVouchers();
      }
    });
  }

  openEditVoucherModal(voucher: VoucherResponse): void {
    if (!this.branchId) return;

    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: VoucherFormComponent,
      nzWidth: 600,
      nzFooter: null,
      nzData: {
        voucher,
        restaurantId: this.branchId
      }
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadSystemVouchers();
      }
    });
  }

  openRedeemModal(mode: 'redeem' | 'give'): void {
    if (!this.currentCustomer || !this.branchId) return;

    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: RedeemModalComponent,
      nzWidth: 700,
      nzFooter: null,
      nzData: {
        customerId: this.currentCustomer.id,
        customerPhone: this.currentCustomer.phone,
        currentPoints: this.walletBalance?.currentPoints || 0,
        restaurantId: this.branchId,
        mode
      }
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadCustomerWalletAndHistory();
        this.loadMemberCustomers();
      }
    });
  }
}
