import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
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
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

import { Subject, debounceTime } from 'rxjs';

import { BookingFormComponent } from './booking-form/booking-form.component';
import { BookingResponse, BookingStatus, BookingSearchRequest, TableSearchResponse, PagingResponse } from './booking.model';
import { BookingService } from './booking.service';
import { selectContextToken } from '../../auth/store/auth.selectors';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';

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
    NzInputNumberModule,
    STModule,
    I18nPipe
  ],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.less']
})
export class BookingComponent implements OnInit, OnDestroy {
  private i18n = inject(ALAIN_I18N_TOKEN);
  private bookingService = inject(BookingService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private store = inject(Store);
  private cdr = inject(ChangeDetectorRef);

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
  showFilter = false;
  filterMinGuests: number | null = null;
  filterMaxGuests: number | null = null;
  sortBy = '';
  sortDirection = '';

  private searchSubject = new Subject<string>();
  private refreshIntervalId: ReturnType<typeof setInterval> | null = null;

  columns: STColumn[] = [];
  tablesMap = new Map<string, string>();

  loadTables(): void {
    if (!this.branchId) return;
    this.bookingService.getTables(this.branchId, { page: 1, size: 100 }).subscribe({
      next: (res: PagingResponse<TableSearchResponse>) => {
        if (res?.data) {
          res.data.forEach((t: TableSearchResponse) => this.tablesMap.set(t.id, t.tableNumber));
        }
        this.initColumns();
        this.cdr.markForCheck();
      }
    });
  }

  getTableNumber(tableId: string | null): string | null {
    if (!tableId) return null;
    return this.tablesMap.get(tableId) || null;
  }

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
      return { type: 'overdue', text: this.i18n.fanyi('booking.countdown.overdue') };
    } else {
      const remainSec = limitSec - diffSec;
      const min = Math.floor(remainSec / 60);
      const sec = remainSec % 60;
      const minStr = min < 10 ? `0${min}` : min.toString();
      const secStr = sec < 10 ? `0${sec}` : sec.toString();
      return { type: 'countdown', text: `${this.i18n.fanyi('booking.countdown.prefix')}${minStr}:${secStr}` };
    }
  }

  private parseTokenPayload(token: string | null): Record<string, unknown> | null {
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
          .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  private initColumns(): void {
    const tableTitle = this.i18n.fanyi('booking.column.table');
    this.columns = [
      {
        title: this.i18n.fanyi('booking.column.phone'),
        index: 'customerPhone',
        width: 140,
        sort: true
      },
      {
        title: tableTitle && tableTitle !== 'booking.column.table' ? tableTitle : 'Bàn',
        index: 'tableNumber',
        width: 110,
        render: 'tableNumber'
      },
      {
        title: this.i18n.fanyi('booking.column.guests'),
        index: 'guestCount',
        width: 100,
        type: 'number',
        sort: true
      },
      {
        title: this.i18n.fanyi('booking.column.time'),
        index: 'bookingTime',
        width: 180,
        render: 'bookingTime',
        sort: true
      },
      {
        title: this.i18n.fanyi('booking.column.note'),
        index: 'note'
      },
      {
        title: this.i18n.fanyi('booking.column.status'),
        index: 'status',
        width: 120,
        render: 'status',
        sort: true
      },
      {
        title: this.i18n.fanyi('booking.column.actions'),
        width: 330,
        fixed: 'right',
        render: 'actions'
      }
    ];
  }

  ngOnInit(): void {
    this.initColumns();

    this.i18n.change.subscribe(() => {
      this.initColumns();
      this.cdr.markForCheck();
    });

    this.searchSubject.pipe(debounceTime(100)).subscribe(val => {
      this.searchPhone = val;
      this.currentPage = 1;
      this.loadData();
    });

    this.store.select(selectContextToken).subscribe(token => {
      const payload = this.parseTokenPayload(token);
      if (payload) {
        this.branchId = (payload['branchId'] as string) || null;
        const permissions: string[] = (payload['permission'] as string[]) || [];
        const isManager = payload['role'] === 'ADMIN' || payload['orgRole'] === 'OWNER' || payload['orgRole'] === 'MANAGER';
        this.hasCreatePermission = permissions.includes('BOOKING_CREATE') || isManager;
        this.hasUpdatePermission = permissions.includes('BOOKING_UPDATE') || isManager;
        if (this.branchId) {
          this.loadTables();
          this.loadData();
        }
      } else {
        this.branchId = null;
        this.bookingsList = [];
        this.displayBookings = [];
        this.total = 0;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });

    let tickCount = 0;
    this.refreshIntervalId = setInterval(() => {
      tickCount++;
      if (tickCount % 5 === 0 && this.branchId && !this.loading) {
        this.loadTables();
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
  }

  onSearchChange(value: string): void {
    this.searchPhone = value;
    this.currentPage = 1;
    this.loadData();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadData();
  }

  loadData(): void {
    if (!this.branchId) {
      this.loading = false;
      this.bookingsList = [];
      this.displayBookings = [];
      this.total = 0;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    const pagingParams = {
      page: this.currentPage,
      size: this.pageSize
    };

    const searchRequest: BookingSearchRequest = {
      branchId: this.branchId,
      searchKeyword: this.searchPhone.trim() || null,
      status: this.filterStatus !== 'ALL' ? this.filterStatus : null,
      minGuests: this.filterMinGuests,
      maxGuests: this.filterMaxGuests
    };

    this.bookingService.searchBookings(searchRequest, pagingParams).subscribe({
      next: res => {
        this.bookingsList = res.data;
        this.total = res.totalElement;
        this.filterData();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error(this.i18n.fanyi('booking.msg.load-error'));
        this.cdr.markForCheck();
      }
    });
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
    this.cdr.markForCheck();
  }

  get hasActiveFilter(): boolean {
    return this.filterStatus !== 'ALL' || this.filterMinGuests !== null || this.filterMaxGuests !== null;
  }

  filterData(): void {
    // Filters (status, minGuests, maxGuests) are already applied server-side
    // via searchBookings(). Only apply client-side sorting here.
    let filtered = [...this.bookingsList];

    if (this.sortBy && this.sortDirection) {
      const field = this.sortBy;
      const isAsc = this.sortDirection === 'ASC';
      filtered.sort((a: any, b: any) => {
        const valA = a[field];
        const valB = b[field];
        if (valA == null) return isAsc ? 1 : -1;
        if (valB == null) return isAsc ? -1 : 1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return isAsc ? valA - valB : valB - valA;
        }
        return isAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    this.displayBookings = filtered;
    this.cdr.markForCheck();
  }

  search(): void {
    this.currentPage = 1;
    this.loadData();
  }

  reset(): void {
    this.searchPhone = '';
    this.filterStatus = 'ALL';
    this.filterMinGuests = null;
    this.filterMaxGuests = null;
    this.sortBy = '';
    this.sortDirection = '';
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
    } else if (e.type === 'sort' && e.sort && e.sort.column) {
      const col = e.sort.column;
      const indexStr = (Array.isArray(col.index) ? col.index[0] : (col.index as string)) || '';
      const sortDir = e.sort.map ? e.sort.map[indexStr] : undefined;

      this.sortBy = sortDir ? indexStr : '';
      this.sortDirection = sortDir === 'ascend' ? 'ASC' : sortDir === 'descend' ? 'DESC' : '';
      this.filterData();
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

  openEditBooking(booking: BookingResponse): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: BookingFormComponent,
      nzWidth: 700,
      nzFooter: null,
      nzData: booking
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  updateStatus(booking: BookingResponse, status: BookingStatus): void {
    if (status === BookingStatus.SEATED && !booking.tableId) {
      this.message.warning(this.i18n.fanyi('booking.warning.no-table'));
      return;
    }

    let confirmMsg = '';
    if (status === BookingStatus.SEATED) {
      confirmMsg = this.i18n.fanyi('booking.confirm.seated');
    } else if (status === BookingStatus.CANCELLED) {
      confirmMsg = this.i18n.fanyi('booking.confirm.cancel');
    }

    this.modal.confirm({
      nzTitle: confirmMsg,
      nzOnOk: () => {
        this.loading = true;
        this.cdr.markForCheck();
        this.bookingService.updateBookingStatus(booking.id, { status }).subscribe({
          next: () => {
            this.loading = false;
            if (status === BookingStatus.SEATED) {
              this.message.success(this.i18n.fanyi('booking.success.seated'));
            } else {
              this.message.success(status === BookingStatus.CANCELLED ? this.i18n.fanyi('booking.success.cancel') : this.i18n.fanyi('booking.success.update-status'));
            }
            this.loadData();
          },
          error: err => {
            this.loading = false;
            const msg = err?.error?.errorMessage?.message || err?.message || 'Error updating status.';
            this.message.error(msg);
            this.cdr.markForCheck();
          }
        });
      }
    });
  }
}
