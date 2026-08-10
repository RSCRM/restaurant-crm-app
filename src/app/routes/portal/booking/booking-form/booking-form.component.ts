import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { Store } from '@ngrx/store';
import { differenceInCalendarDays } from 'date-fns';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { selectContextToken } from '../../../auth/store/auth.selectors';
import { BookingStatus, BookingResponse, TableSearchResponse, RestaurantTableStatus } from '../booking.model';
import { BookingService } from '../booking.service';

interface TableAvailability extends TableSearchResponse {
  isAvailable: boolean;
  reason?: string;
}

@Component({
  selector: 'app-booking-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzButtonModule,
    NzListModule,
    NzTagModule,
    NzSpinModule,
    NzGridModule,
    NzTooltipModule,
    I18nPipe
  ],
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.less']
})
export class BookingFormComponent implements OnInit, OnDestroy {
  private i18n = inject(ALAIN_I18N_TOKEN);
  private fb = inject(FormBuilder);
  private bookingService = inject(BookingService);
  private store = inject(Store);
  private modalRef = inject(NzModalRef);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  private refreshTimerId: ReturnType<typeof setInterval> | null = null;
  form!: FormGroup;
  branchId: string | null = null;
  loading = false;
  submitting = false;
  isEditMode = false;
  bookingId: string | null = null;
  bookingData: BookingResponse | null = null;

  // Raw data from API
  allBookings: BookingResponse[] = [];
  allTables: TableSearchResponse[] = [];

  // Display data
  tablesWithAvailability: TableAvailability[] = [];
  selectedTableId: string | null = null;

  private getBranchIdFromToken(token: string | null): string | null {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      return payload.branchId || null;
    } catch {
      return null;
    }
  }

  ngOnInit(): void {
    this.bookingData = this.modalRef.getConfig().nzData || null;
    if (this.bookingData) {
      this.isEditMode = true;
      this.bookingId = this.bookingData.id;
      this.selectedTableId = this.bookingData.tableId;
    }

    this.initForm();
    this.store.select(selectContextToken).subscribe(token => {
      const id = this.getBranchIdFromToken(token);
      this.branchId = id;
      if (id) {
        this.loadData();
      }
    });

    // Recheck availability when booking time, duration, or guest count changes
    this.form.valueChanges.subscribe(() => {
      this.calculateAvailability();
    });

    // Polling every 3 seconds while modal is open so checkout/release table status is updated in real-time
    this.refreshTimerId = setInterval(() => {
      if (this.branchId && !this.submitting) {
        this.loadData(true);
      }
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      customerPhone: [this.bookingData?.customerPhone || '', [Validators.required, Validators.pattern(/^\d{9,15}$/)]],
      customerName: [''], // Optional
      bookingTime: [this.bookingData ? new Date(this.bookingData.bookingTime) : null, [Validators.required]],
      duration: [3, [Validators.required, Validators.min(0.1)]], // Dining duration in hours, defaults to 3
      note: [this.bookingData?.note || '']
    });
  }

  private loadData(silent = false): void {
    if (!this.branchId) return;
    if (!silent) {
      this.loading = true;
      this.cdr.markForCheck();
    }

    let tablesLoaded = false;
    let bookingsLoaded = false;

    const checkBothLoaded = () => {
      if (tablesLoaded && bookingsLoaded) {
        this.loading = false;
        this.calculateAvailability();
      }
    };

    this.bookingService.getTables(this.branchId, { page: 1, size: 100 }).subscribe({
      next: tableRes => {
        this.allTables = tableRes.data || [];
        tablesLoaded = true;
        checkBothLoaded();
      },
      error: () => {
        if (!silent) {
          this.loading = false;
          this.message.error(this.i18n.fanyi('booking-form.msg.table-load-error'));
        }
        this.cdr.markForCheck();
      }
    });

    this.bookingService.getBookingsByBranch(this.branchId, { page: 1, size: 1000 }).subscribe({
      next: bookingRes => {
        this.allBookings = (bookingRes.data || []).filter(
          b => (b.status === BookingStatus.PENDING || b.status === BookingStatus.CONFIRMED) && b.id !== this.bookingId
        );
        bookingsLoaded = true;
        checkBothLoaded();
      },
      error: () => {
        if (!silent) {
          this.loading = false;
          this.message.error(this.i18n.fanyi('booking-form.msg.history-load-error'));
        }
        this.cdr.markForCheck();
      }
    });
  }

  disabledDate = (current: Date): boolean => {
    // Cannot select past days
    return differenceInCalendarDays(current, new Date()) < 0;
  };

  calculateAvailability(): void {
    const bookingTimeVal = this.form.get('bookingTime')?.value;
    const durationVal = this.form.get('duration')?.value;

    if (!bookingTimeVal || !durationVal) {
      // Clear availability if form is incomplete
      this.tablesWithAvailability = this.allTables.map(t => ({
        ...t,
        isAvailable: false,
        reason: this.i18n.fanyi('booking-form.reason.select-time')
      }));
      this.cdr.markForCheck();
      return;
    }

    const targetStart = new Date(bookingTimeVal).getTime();
    const targetEnd = targetStart + durationVal * 60 * 60 * 1000;
    const bufferStart = targetStart - 3 * 60 * 60 * 1000; // Block 3h before to avoid overlap with previous diners

    const now = Date.now();
    const activeDiningEnd = now + 3 * 60 * 60 * 1000; // Active dining window for currently OCCUPIED tables (3h)

    this.tablesWithAvailability = this.allTables.map(table => {
      // 1. Check if table is currently OCCUPIED by active diners (walk-in or seated)
      // and target booking time overlaps with current active dining window [now, activeDiningEnd]
      if (table.status === RestaurantTableStatus.OCCUPIED || (table.status as string) === 'OCCUPIED') {
        if (targetStart < activeDiningEnd && targetEnd > now) {
          return {
            ...table,
            isAvailable: false,
            reason: this.i18n.fanyi('booking-form.reason.occupied')
          };
        }
      }

      // 2. Check overlap with existing PENDING or CONFIRMED bookings on the same table
      const overlappingBooking = this.allBookings.find(booking => {
        if (booking.tableId !== table.id) return false;

        const bStart = new Date(booking.bookingTime).getTime();
        const bEnd = bStart + 3 * 60 * 60 * 1000; // Assume default dining time is 3 hours for existing bookings

        // Overlap condition:
        // A booking overlaps if its duration intersects with our target window [bufferStart, targetEnd]
        return bStart < targetEnd && bEnd > bufferStart;
      });

      if (overlappingBooking) {
        const overlapTime = new Date(overlappingBooking.bookingTime).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit'
        });
        return {
          ...table,
          isAvailable: false,
          reason: this.i18n.fanyi('booking-form.reason.reserved', { time: overlapTime, phone: overlappingBooking.customerPhone })
        };
      }

      return {
        ...table,
        isAvailable: true
      };
    });

    // Keep selection if table is still available, otherwise reset selection
    if (this.selectedTableId) {
      const selectedTable = this.tablesWithAvailability.find(t => t.id === this.selectedTableId);
      if (!selectedTable || !selectedTable.isAvailable) {
        this.selectedTableId = null;
      }
    }

    this.cdr.markForCheck();
  }

  selectTable(table: TableAvailability): void {
    if (!table.isAvailable) return;
    this.selectedTableId = table.id;
    this.cdr.markForCheck();
  }

  private extractErrorMessage(err: any, fallback: string): string {
    if (!err) return fallback;
    const e = err.error;
    if (!e) return err.message || fallback;

    let msg = '';
    if (typeof e.errorMessage === 'string') {
      msg = e.errorMessage;
    } else if (typeof e.errorMessage === 'object' && e.errorMessage?.message) {
      msg = e.errorMessage.message;
    } else if (typeof e.message === 'string') {
      msg = e.message;
    }

    if (msg === 'BOOKING_TIME_MUST_BE_FUTURE' || msg.includes('FUTURE')) {
      return this.i18n.fanyi('booking.msg.future-required');
    }

    return msg || err.message || fallback;
  }

  submit(): void {
    if (this.form.invalid || !this.branchId) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.submitting = true;
    this.cdr.markForCheck();

    const rawForm = this.form.value;
    const nameStr = rawForm.customerName ? `Khách: ${rawForm.customerName.trim()}. ` : '';
    const noteStr = rawForm.note ? `Ghi chú: ${rawForm.note.trim()}` : '';

    const request = {
      branchId: this.branchId,
      tableId: this.selectedTableId,
      customerPhone: rawForm.customerPhone.trim(),
      bookingTime: new Date(rawForm.bookingTime).toISOString(),
      guestCount: 1,
      note: (nameStr + noteStr).trim() || null
    };

    if (this.isEditMode && this.bookingId) {
      this.bookingService.updateBooking(this.bookingId, request).subscribe({
        next: () => {
          this.submitting = false;
          this.message.success(this.i18n.fanyi('booking-form.msg.update-success'));
          this.modalRef.close(true);
        },
        error: err => {
          this.submitting = false;
          const msg = this.extractErrorMessage(err, this.i18n.fanyi('booking-form.msg.update-error'));
          this.message.error(msg);
          this.cdr.markForCheck();
        }
      });
    } else {
      this.bookingService.createBooking(request).subscribe({
        next: () => {
          this.submitting = false;
          this.message.success(this.i18n.fanyi('booking-form.msg.create-success'));
          this.modalRef.close(true);
        },
        error: err => {
          this.submitting = false;
          const msg = this.extractErrorMessage(err, this.i18n.fanyi('booking-form.msg.create-error'));
          this.message.error(msg);
          this.cdr.markForCheck();
        }
      });
    }
  }

  cancel(): void {
    this.modalRef.close(null);
  }
}
