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
    STModule
  ],
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.less']
})
export class CustomerComponent implements OnInit {
  private customerService = inject(CustomerService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private store = inject(Store);
  private cdr = inject(ChangeDetectorRef);

  private readonly VN_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/;

  restaurantId: string | null = null;
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
  pointColumns: STColumn[] = [
    { title: 'Loại giao dịch', render: 'type', width: 130 },
    { title: 'Số điểm', render: 'amount', width: 120 },
    { title: 'Số dư sau', index: 'balanceAfter', width: 120, type: 'number' },
    { title: 'Nguồn / Lý do', index: 'source' },
    { title: 'Mã tham chiếu', index: 'referenceId' },
    { title: 'Thời gian', index: 'createdAt', width: 160, type: 'date' }
  ];

  // Delon ST Columns for System Vouchers
  sysVoucherColumns: STColumn[] = [
    { title: 'Tiêu đề Voucher', index: 'title', width: 220 },
    { title: '% Giảm', index: 'discountPercent', width: 100, format: item => `${item.discountPercent}%` },
    {
      title: 'Đơn tối thiểu',
      index: 'minOrderAmount',
      width: 140,
      format: item => `${item.minOrderAmount?.toLocaleString('vi-VN')} ₫`
    },
    { title: 'Điểm đổi', index: 'pointCost', width: 110, format: item => `${item.pointCost} điểm` },
    { title: 'Hạn dùng', index: 'validDays', width: 110, format: item => `${item.validDays} ngày` },
    { title: 'Cho phép đổi', width: 130, render: 'isActive' },
    { title: 'Thao tác', width: 120, fixed: 'right', render: 'actions' }
  ];

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

  ngOnInit(): void {
    this.store.select(selectContextToken).subscribe(token => {
      const payload = this.parseTokenPayload(token);
      if (payload) {
        this.restaurantId = (payload['organizationId'] as string) || (payload['branchId'] as string) || null;
        const permissions: string[] = (payload['permission'] as string[]) || [];
        this.hasVoucherCreatePermission = permissions.includes('VOUCHER_CREATE') || permissions.includes('ADMIN');
        this.hasRedeemPermission = permissions.includes('CUSTOMER_VOUCHER_REDEEM') || permissions.includes('ADMIN');

        // Vouchers loaded on-demand when tab is opened or after CRUD operations
      }
    });
  }

  searchCustomer(): void {
    const rawPhone = this.searchPhone.trim();
    if (!rawPhone || !this.VN_PHONE_REGEX.test(rawPhone)) {
      this.message.warning('Vui lòng nhập số điện thoại Việt Nam hợp lệ (vd: 0966888888 hoặc 0901234567)!');
      return;
    }

    if (!this.restaurantId) {
      this.message.error('Không tìm thấy thông tin tổ chức/nhà hàng.');
      return;
    }

    this.searching = true;
    this.cdr.markForCheck();

    this.customerService.identifyCustomer({ phone: rawPhone, restaurantId: this.restaurantId }).subscribe({
      next: customer => {
        this.currentCustomer = customer;
        this.searching = false;
        this.message.success(`Định danh thành công khách hàng SĐT ${customer.phone}`);
        this.loadCustomerWalletAndHistory();
      },
      error: err => {
        this.searching = false;
        const msg = err?.error?.errorMessage?.message || err?.message || 'Lỗi khi tra cứu khách hàng.';
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
    this.cdr.markForCheck();
  }

  loadCustomerWalletAndHistory(): void {
    if (!this.currentCustomer || !this.restaurantId) return;

    const customerId = this.currentCustomer.id;

    // Load Wallet Balance
    this.customerService.getWalletBalance(customerId, this.restaurantId).subscribe({
      next: balance => {
        this.walletBalance = balance;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Lỗi khi tải số dư ví điểm.');
      }
    });

    // Load Point History
    this.loadPointHistory();

    // Load Customer Vouchers
    this.loadCustomerVouchers();
  }

  loadPointHistory(): void {
    if (!this.currentCustomer || !this.restaurantId) return;

    this.pointLoading = true;
    this.cdr.markForCheck();

    this.customerService
      .getPointHistory(this.currentCustomer.id, this.restaurantId, {
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
    if (!this.currentCustomer || !this.restaurantId) return;

    this.voucherLoading = true;
    this.cdr.markForCheck();

    this.customerService
      .getCustomerVouchers(this.currentCustomer.id, this.restaurantId, {
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
    if (!this.restaurantId) return;

    this.sysVoucherLoading = true;
    this.cdr.markForCheck();

    this.customerService
      .getVouchers(this.restaurantId, {
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
          this.message.error('Lỗi khi tải danh sách voucher hệ thống.');
          this.cdr.markForCheck();
        }
      });
  }

  filterSystemVouchers(): void {
    let filtered = [...this.systemVouchersList];

    if (this.filterVoucherStatus === 'ACTIVE') {
      filtered = filtered.filter(v => v.isActive);
    } else if (this.filterVoucherStatus === 'INACTIVE') {
      filtered = filtered.filter(v => !v.isActive);
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
    this.customerService.updateVoucher(voucher.id, { isActive: active }).subscribe({
      next: () => {
        voucher.isActive = active;
        this.message.success(`${active ? 'Bật' : 'Tắt'} quyền đổi voucher "${voucher.title}" thành công.`);
        this.filterSystemVouchers();
      },
      error: err => {
        const msg = err?.error?.errorMessage?.message || err?.message || 'Lỗi khi cập nhật trạng thái.';
        this.message.error(msg);
        this.loadSystemVouchers();
      }
    });
  }

  openCreateVoucherModal(): void {
    if (!this.restaurantId) return;

    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: VoucherFormComponent,
      nzWidth: 600,
      nzFooter: null,
      nzData: {
        restaurantId: this.restaurantId
      }
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadSystemVouchers();
      }
    });
  }

  openEditVoucherModal(voucher: VoucherResponse): void {
    if (!this.restaurantId) return;

    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: VoucherFormComponent,
      nzWidth: 600,
      nzFooter: null,
      nzData: {
        voucher,
        restaurantId: this.restaurantId
      }
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadSystemVouchers();
      }
    });
  }

  openRedeemModal(mode: 'redeem' | 'give'): void {
    if (!this.currentCustomer || !this.restaurantId) return;

    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: RedeemModalComponent,
      nzWidth: 700,
      nzFooter: null,
      nzData: {
        customerId: this.currentCustomer.id,
        customerPhone: this.currentCustomer.phone,
        currentPoints: this.walletBalance?.currentPoints || 0,
        restaurantId: this.restaurantId,
        mode
      }
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadCustomerWalletAndHistory();
      }
    });
  }
}
