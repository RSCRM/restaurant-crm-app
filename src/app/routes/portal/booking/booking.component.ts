import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { NzTagModule } from 'ng-zorro-antd/tag';
import { STColumn, STComponent, STModule, STChange } from '@delon/abc/st';
import { PageHeaderModule } from '@delon/abc/page-header';

import { selectContextToken } from '../../auth/store/auth.selectors';
import { BookingStatus, BookingResponse } from './booking.model';
import { BookingService } from './booking.service';
import { BookingFormComponent } from './booking-form/booking-form.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-booking',
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
    STModule,
    HasPermissionDirective
  ],
  templateUrl: './booking.component.html',
  styles: [
    `
      .countdown-active {
        color: #fa8c16;
        font-size: 12px;
        font-weight: 500;
        margin-top: 4px;
        display: block;
      }
      .overdue-pulse {
        color: #f5222d;
        font-size: 12px;
        font-weight: bold;
        animation: pulse 1.5s infinite;
        margin-top: 4px;
        display: block;
      }
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.3; }
        100% { opacity: 1; }
      }
    `
  ]
})
export class BookingComponent implements OnInit, OnDestroy {
  private bookingService = inject(BookingService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private store = inject(Store);
  private cdr = inject(ChangeDetectorRef);

  bookingStatus = BookingStatus; // Expose to template

  branchId: string | null = null;
  loading = false;

  // Pagination & Lists
  bookingsList: BookingResponse[] = [];
  displayBookings: BookingResponse[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;

  // Filters
  searchPhone = '';
  filterStatus = 'ALL';

  private refreshIntervalId: any;

  columns: STColumn[] = [
    { title: 'SĐT Khách hàng', index: 'customerPhone', width: 140 },
    { title: 'Số khách', index: 'guestCount', width: 100, type: 'number' },
    { title: 'Thời gian đặt', width: 180, render: 'bookingTime' },
    { title: 'Ghi chú', index: 'note' },
    { title: 'Trạng thái', width: 130, render: 'status' },
    { title: 'Thao tác', width: 220, fixed: 'right', render: 'actions' }
  ];

  getCountdownInfo(booking: BookingResponse): { type: 'none' | 'countdown' | 'overdue'; text: string } {
    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.CONFIRMED) {
      return { type: 'none', text: '' };
    }
    const bTime = new Date(booking.bookingTime).getTime();
    const now = Date.now();
    
    // Chưa đến giờ đặt bàn
    if (now < bTime) {
      return { type: 'none', text: '' };
    }
    
    const diffSec = Math.floor((now - bTime) / 1000);
    const limitSec = 0.5 * 60; // 15 minutes
    
    if (diffSec >= limitSec) {
      return { type: 'overdue', text: 'QUÁ LÂU CHƯA TỚI (>15 PHÚT)' };
    } else {
      const remainSec = limitSec - diffSec;
      const min = Math.floor(remainSec / 60);
      const sec = remainSec % 60;
      const minStr = min < 10 ? '0' + min : min.toString();
      const secStr = sec < 10 ? '0' + sec : sec.toString();
      return { type: 'countdown', text: `Hết hạn sau: ${minStr}:${secStr}` };
    }
  }

  private getBranchIdFromToken(token: string | null): string | null {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      return payload.branchId || null;
    } catch {
      return null;
    }
  }

  ngOnInit(): void {
    this.store.select(selectContextToken).subscribe(token => {
      this.branchId = this.getBranchIdFromToken(token);
      if (this.branchId) {
        this.loadData();
      }
    });

    // Start timer to check/refresh overdue status visually every 1 second (countdown)
    this.refreshIntervalId = setInterval(() => {
      this.cdr.markForCheck();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
  }

  loadData(): void {
    if (!this.branchId) return;
    this.loading = true;
    this.cdr.markForCheck();

    const pagingParams = {
      page: this.currentPage,
      size: this.pageSize
    };

    const request$ = this.searchPhone.trim()
      ? this.bookingService.getBookingsByCustomerPhone(this.searchPhone.trim(), pagingParams)
      : this.bookingService.getBookingsByBranch(this.branchId, pagingParams);

    request$.subscribe({
      next: res => {
        this.bookingsList = res.data;
        this.total = res.totalElement;
        this.filterData();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('Lỗi khi tải danh sách đặt bàn.');
        this.cdr.markForCheck();
      }
    });
  }

  filterData(): void {
    if (this.filterStatus === 'ALL') {
      this.displayBookings = [...this.bookingsList];
    } else {
      this.displayBookings = this.bookingsList.filter(b => b.status === this.filterStatus);
    }
    this.cdr.markForCheck();
  }

  search(): void {
    this.currentPage = 1;
    this.loadData();
  }

  reset(): void {
    this.searchPhone = '';
    this.filterStatus = 'ALL';
    this.currentPage = 1;
    this.loadData();
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

  openCreateBooking(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: BookingFormComponent,
      nzWidth: 700,
      nzFooter: null,
      nzData: null
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  updateStatus(booking: BookingResponse, status: BookingStatus): void {
    let confirmMsg = '';
    if (status === BookingStatus.SEATED) {
      confirmMsg = 'Xác nhận khách đã nhận bàn?';
    } else if (status === BookingStatus.CANCELLED) {
      confirmMsg = 'Bạn có chắc chắn muốn hủy đặt bàn này?';
    }

    this.modal.confirm({
      nzTitle: confirmMsg,
      nzOnOk: () => {
        this.loading = true;
        this.cdr.markForCheck();
        this.bookingService.updateBookingStatus(booking.id, { status }).subscribe({
          next: () => {
            this.loading = false;
            this.message.success('Cập nhật trạng thái thành công!');
            this.loadData();
          },
          error: err => {
            this.loading = false;
            const msg = err?.error?.errorMessage?.message || err?.message || 'Lỗi khi cập nhật trạng thái.';
            this.message.error(msg);
            this.cdr.markForCheck();
          }
        });
      }
    });
  }
}
