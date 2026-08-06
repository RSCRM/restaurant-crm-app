import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { NzTagModule } from 'ng-zorro-antd/tag';
import { combineLatest } from 'rxjs';

import { BookingFormComponent } from './booking-form/booking-form.component';
import { BookingResponse, BookingStatus } from './booking.model';
import { BookingService } from './booking.service';
import { selectHasPermission, selectSelectedBranchId, selectSelectedRole } from '../../auth/store/auth.selectors';

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
    STModule
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
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.3;
        }
        100% {
          opacity: 1;
        }
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
  private destroyRef = inject(DestroyRef);

  bookingStatus = BookingStatus; // Expose to template

  branchId: string | null = null;
  loading = false;
  hasCreatePermission = false;
  hasUpdatePermission = false;

  // Pagination & Lists
  bookingsList: BookingResponse[] = [];
  displayBookings: BookingResponse[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;

  // Filters
  searchPhone = '';
  filterStatus = 'ALL';

  private refreshIntervalId: ReturnType<typeof setInterval> | null = null;

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

    if (now < bTime) {
      return { type: 'none', text: '' };
    }

    const diffSec = Math.floor((now - bTime) / 1000);
    const limitSec = 15 * 60; // 15 minutes

    if (diffSec >= limitSec) {
      return { type: 'overdue', text: 'QUÁ LÂU CHƯA TỚI (>15 PHÚT)' };
    } else {
      const remainSec = limitSec - diffSec;
      const min = Math.floor(remainSec / 60);
      const sec = remainSec % 60;
      const minStr = min < 10 ? `0${min}` : min.toString();
      const secStr = sec < 10 ? `0${sec}` : sec.toString();
      return { type: 'countdown', text: `Hết hạn sau: ${minStr}:${secStr}` };
    }
  }

  ngOnInit(): void {
    combineLatest([
      this.store.select(selectSelectedBranchId),
      this.store.select(selectSelectedRole),
      this.store.select(selectHasPermission('BOOKING_CREATE')),
      this.store.select(selectHasPermission('BOOKING_UPDATE'))
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([branchId, role, canCreate, canUpdate]) => {
        const isManager = role === 'OWNER' || role === 'MANAGER';
        const previousBranchId = this.branchId;
        this.branchId = branchId;
        this.hasCreatePermission = canCreate || isManager;
        this.hasUpdatePermission = canUpdate || isManager;
        if (this.branchId && this.branchId !== previousBranchId) {
          this.loadData();
        }
        this.cdr.markForCheck();
      });

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
