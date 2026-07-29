import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTabComponent, NzTabsComponent } from 'ng-zorro-antd/tabs';
import { RouterModule } from '@angular/router';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STColumn, STComponent, STModule, STChange } from '@delon/abc/st';

import { selectContextToken } from '../../auth/store/auth.selectors';
import {
  CustomerResponse,
  CustomerPointResponse,
  CustomerPointHistoryResponse,
  CustomerVoucherResponse,
  VoucherResponse
} from './customer.model';
import { CustomerService } from './customer.service';

@Component({
  selector: 'app-customer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PageHeaderModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzInputModule,
    NzSelectModule,
    NzFormModule,
    NzGridModule,
    NzTabComponent,
    NzTabsComponent,
    RouterModule,
    NzSwitchModule,
    NzModalModule,
    NzDatePickerModule,
    STModule
  ],
  templateUrl: './customer.component.html',
  styles: [
    `
      .balance-card {
        background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
        color: #fff;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        margin-bottom: 20px;
        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
      }
      .balance-amount {
        font-size: 36px;
        font-weight: bold;
        margin: 10px 0;
      }
      .balance-label {
        font-size: 14px;
        opacity: 0.8;
      }
      .voucher-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }
      .voucher-card {
        border: 1px solid #f0f0f0;
        border-radius: 8px;
        background: #fff;
        overflow: hidden;
        transition: all 0.3s;
        position: relative;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }
      .voucher-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
      .voucher-header {
        padding: 12px 16px;
        border-bottom: 1px dashed #f0f0f0;
        font-weight: bold;
        font-size: 15px;
        background: #fafafa;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .voucher-body {
        padding: 16px;
      }
      .voucher-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 13px;
      }
      .voucher-row:last-child {
        margin-bottom: 0;
      }
      .voucher-label {
        color: #8c8c8c;
      }
      .voucher-value {
        font-weight: 500;
        color: #262626;
      }
    `
  ]
})
export class CustomerComponent implements OnInit {
  private customerService = inject(CustomerService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private store = inject(Store);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  // Identity and auth context
  organizationId: string | null = null;
  branchId: string | null = null;
  hasReadPermission = false;
  hasCreatePermission = false;
  hasRedeemPermission = false;

  // Search and Loading
  searchPhone = '';
  searchLoading = false;
  loadingWallet = false;
  loadingHistory = false;
  loadingVouchers = false;
  loadingCatalog = false;

  // Customer Data
  customer: CustomerResponse | null = null;
  wallet: CustomerPointResponse | null = null;
  pointHistory: CustomerPointHistoryResponse[] = [];
  customerVouchers: CustomerVoucherResponse[] = [];
  activeVouchers: VoucherResponse[] = [];

  // Paging Parameters
  historyPage = 1;
  historySize = 5;
  historyTotal = 0;

  voucherPage = 1;
  voucherSize = 6;
  voucherTotal = 0;

  catalogPage = 1;
  catalogSize = 10;
  catalogTotal = 0;

  // Voucher Creation Form
  voucherForm!: FormGroup;

  // Tables Columns Definition
  historyColumns: STColumn[] = [
    {
      title: 'Loại giao dịch',
      index: 'transactionType',
      width: 120,
      render: 'type'
    },
    {
      title: 'Số điểm',
      index: 'pointsChanged',
      width: 100,
      render: 'points'
    },
    { title: 'Mã tham chiếu', index: 'referenceId', width: 180 },
    {
      title: 'Thời gian',
      index: 'createdAt',
      type: 'date',
      dateFormat: 'yyyy-MM-dd HH:mm'
    }
  ];

  catalogColumns: STColumn[] = [
    { title: 'Tiêu đề Voucher', index: 'title', width: 220 },
    {
      title: 'Giảm giá',
      index: 'discountPercent',
      width: 100,
      format: (item: any) => `${item.discountPercent}%`
    },
    {
      title: 'Hóa đơn tối thiểu',
      index: 'minBillAmount',
      width: 150,
      format: (item: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.minBillAmount)
    },
    {
      title: 'Điểm yêu cầu',
      index: 'pointsRequired',
      width: 120,
      format: (item: any) => (item.pointsRequired === 0 ? 'Miễn phí' : `${item.pointsRequired} điểm`)
    },
    {
      title: 'Hạn đổi',
      index: 'expiredAt',
      width: 160,
      render: 'expiredAt'
    },
    {
      title: 'Cho phép đổi',
      width: 120,
      render: 'isActive'
    }
  ];

  private parseToken(token: string | null): any {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  ngOnInit(): void {
    // Initialize voucher form
    this.voucherForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      discountPercent: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      minBillAmount: [0, [Validators.required, Validators.min(0)]],
      pointsRequired: [0, [Validators.required, Validators.min(0)]],
      expiredAt: [null]
    });

    // Listen to token
    this.store.select(selectContextToken).subscribe(token => {
      const payload = this.parseToken(token);
      if (payload) {
        this.organizationId = payload.organizationId || null;
        this.branchId = payload.branchId || null;
        const permissions = payload.permission || [];
        const isOwner = payload.orgRole === 'OWNER';
        this.hasReadPermission = isOwner || permissions.includes('CUSTOMER_READ');
        this.hasCreatePermission = isOwner || permissions.includes('VOUCHER_CREATE');
        this.hasRedeemPermission = isOwner || permissions.includes('CUSTOMER_VOUCHER_REDEEM');
        
        if (this.branchId) {
          this.loadVoucherCatalog();
        }
      }
      this.cdr.markForCheck();
    });
  }

  // =========================================================================
  // 1. CUSTOMER LOOKUP & INFO
  // =========================================================================
  searchCustomer(): void {
    if (!this.searchPhone.trim()) {
      this.message.warning('Vui lòng nhập số điện thoại khách hàng.');
      return;
    }
    if (!this.organizationId) {
      this.message.error('Không tìm thấy ID tổ chức trong ngữ cảnh.');
      return;
    }

    this.searchLoading = true;
    this.customer = null;
    this.wallet = null;
    this.pointHistory = [];
    this.customerVouchers = [];
    this.cdr.markForCheck();

    this.customerService.identifyCustomer(this.searchPhone.trim(), this.organizationId).subscribe({
      next: res => {
        this.customer = res.data;
        this.searchLoading = false;
        this.message.success('Định danh thành viên thành công!');
        this.loadCustomerWallet();
        this.loadCustomerHistory();
        this.loadCustomerVouchers();
        this.cdr.markForCheck();
      },
      error: err => {
        this.searchLoading = false;
        const msg = err?.error?.errorMessage?.message || err?.message || 'Lỗi khi định danh thành viên.';
        this.message.error(msg);
        this.cdr.markForCheck();
      }
    });
  }

  loadCustomerWallet(): void {
    if (!this.customer || !this.organizationId) return;
    this.loadingWallet = true;
    this.cdr.markForCheck();

    this.customerService.getWalletBalance(this.customer.id, this.organizationId).subscribe({
      next: res => {
        this.wallet = res.data;
        this.loadingWallet = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingWallet = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadCustomerHistory(): void {
    if (!this.customer || !this.organizationId) return;
    this.loadingHistory = true;
    this.cdr.markForCheck();

    this.customerService.getPointHistory(this.customer.id, this.organizationId, {
      page: this.historyPage,
      size: this.historySize
    }).subscribe({
      next: res => {
        this.pointHistory = res.data.data;
        this.historyTotal = res.data.totalElement;
        this.loadingHistory = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingHistory = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadCustomerVouchers(): void {
    if (!this.customer || !this.branchId) return;
    this.loadingVouchers = true;
    this.cdr.markForCheck();

    this.customerService.getCustomerVouchers(this.customer.id, this.branchId, {
      page: this.voucherPage,
      size: this.voucherSize
    }).subscribe({
      next: res => {
        this.customerVouchers = res.data.data;
        this.voucherTotal = res.data.totalElement;
        this.loadingVouchers = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingVouchers = false;
        this.cdr.markForCheck();
      }
    });
  }

  onHistoryChange(e: STChange): void {
    if (e.type === 'pi') {
      this.historyPage = e.pi!;
      this.loadCustomerHistory();
    }
  }

  // =========================================================================
  // 2. VOUCHER REDEMPTION (ĐỔI ĐIỂM)
  // =========================================================================
  openRedeemModal(tpl: any): void {
    if (!this.customer) {
      this.message.warning('Vui lòng tìm kiếm khách hàng trước khi thực hiện đổi voucher.');
      return;
    }
    if (!this.activeVouchers || this.activeVouchers.length === 0) {
      this.message.warning('Hiện tại không có voucher nào đang mở hoạt động để đổi.');
      return;
    }
    this.modal.create({
      nzTitle: 'Đổi Điểm Nhận Voucher',
      nzContent: tpl,
      nzWidth: 500,
      nzFooter: null
    });
  }

  redeemVoucher(voucher: VoucherResponse): void {
    if (!this.customer || !this.branchId) return;
    if (this.wallet && this.wallet.currentPoints < voucher.pointsRequired) {
      this.message.error('Số dư điểm tích lũy của khách hàng không đủ để đổi voucher này.');
      return;
    }

    this.modal.confirm({
      nzTitle: `Quy đổi voucher: ${voucher.title}?`,
      nzContent: voucher.pointsRequired === 0 
        ? 'Voucher này hoàn toàn miễn phí. Khách sẽ nhận trực tiếp!'
        : `Lịch đặt của khách sẽ bị trừ ${voucher.pointsRequired} điểm tích lũy.`,
      nzOnOk: () => {
        this.loadingVouchers = true;
        this.cdr.markForCheck();

        const request = {
          customerId: this.customer!.id,
          branchId: this.branchId!,
          voucherId: voucher.id
        };

        this.customerService.redeemVoucher(request).subscribe({
          next: () => {
            this.message.success('Quy đổi voucher thành công!');
            this.loadCustomerWallet();
            this.loadCustomerHistory();
            this.loadCustomerVouchers();
          },
          error: err => {
            this.loadingVouchers = false;
            const msg = err?.error?.errorMessage?.message || err?.message || 'Lỗi khi quy đổi voucher.';
            this.message.error(msg);
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  // =========================================================================
  // 3. VOUCHER CATALOG MANAGEMENT
  // =========================================================================
  loadVoucherCatalog(): void {
    if (!this.branchId) return;
    this.loadingCatalog = true;
    this.cdr.markForCheck();

    this.customerService.getActiveVouchers(this.branchId, {
      page: this.catalogPage,
      size: this.catalogSize
    }).subscribe({
      next: res => {
        this.activeVouchers = res.data.data;
        this.catalogTotal = res.data.totalElement;
        this.loadingCatalog = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingCatalog = false;
        this.cdr.markForCheck();
      }
    });
  }

  onCatalogChange(e: STChange): void {
    if (e.type === 'pi') {
      this.catalogPage = e.pi!;
      this.loadVoucherCatalog();
    }
  }

  toggleVoucherActive(voucher: VoucherResponse, active: boolean): void {
    if (!this.branchId) return;
    const request = {
      title: voucher.title,
      discountPercent: voucher.discountPercent,
      minBillAmount: voucher.minBillAmount,
      pointsRequired: voucher.pointsRequired,
      isActive: active ? 1 : 0,
      expiredAt: voucher.expiredAt
    };

    this.customerService.updateVoucher(voucher.id, request).subscribe({
      next: () => {
        this.message.success(active ? 'Đã cho phép đổi voucher!' : 'Đã ngưng cho phép đổi voucher!');
        this.loadVoucherCatalog();
      },
      error: err => {
        const msg = err?.error?.errorMessage?.message || err?.message || 'Lỗi khi cập nhật trạng thái voucher.';
        this.message.error(msg);
        this.loadVoucherCatalog(); // Refresh list to revert switch UI
      }
    });
  }

  openCreateVoucherModal(tpl: any): void {
    this.voucherForm.reset({
      title: '',
      discountPercent: 10,
      minBillAmount: 0,
      pointsRequired: 0,
      expiredAt: null
    });

    const modalRef = this.modal.create({
      nzTitle: 'Tạo Voucher Hệ Thống Mới',
      nzContent: tpl,
      nzWidth: 550,
      nzOnOk: () => {
        if (!this.voucherForm.valid) {
          // Trigger validation
          Object.values(this.voucherForm.controls).forEach(control => {
            if (control.invalid) {
              control.markAsDirty();
              control.updateValueAndValidity({ onlySelf: true });
            }
          });
          return false;
        }

        const formVal = this.voucherForm.value;
        const request = {
          branchId: this.branchId!,
          title: formVal.title,
          discountPercent: formVal.discountPercent,
          minBillAmount: formVal.minBillAmount,
          pointsRequired: formVal.pointsRequired,
          isActive: 1, // Default active
          expiredAt: formVal.expiredAt ? new Date(formVal.expiredAt).toISOString() : undefined
        };

        this.loadingCatalog = true;
        this.cdr.markForCheck();

        this.customerService.createVoucher(request).subscribe({
          next: () => {
            this.message.success('Tạo Voucher mới thành công!');
            this.loadVoucherCatalog();
          },
          error: err => {
            this.loadingCatalog = false;
            const msg = err?.error?.errorMessage?.message || err?.message || 'Lỗi khi tạo voucher.';
            this.message.error(msg);
            this.cdr.markForCheck();
          }
        });
        return true;
      }
    });
  }
}
