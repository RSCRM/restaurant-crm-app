import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { getHttpErrorMessage } from '@core';
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
import { BookingStatus, BookingResponse, TableSearchResponse } from '../booking.model';
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
export class BookingFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bookingService = inject(BookingService);
  private store = inject(Store);
  private modalRef = inject(NzModalRef);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private i18n = inject(ALAIN_I18N_TOKEN);

  form!: FormGroup;
  branchId: string | null = null;
  loading = false;
  submitting = false;

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
    this.initForm();
    this.store.select(selectContextToken).subscribe(token => {
      const id = this.getBranchIdFromToken(token);
      this.branchId = id;
      if (id) {
        this.loadData();
      } else {
        this.message.error(this.i18n.fanyi('booking.branch-required'));
      }
    });

    // Recheck availability when booking time, duration, or guest count changes
    this.form.valueChanges.subscribe(() => {
      this.calculateAvailability();
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      customerPhone: ['', [Validators.required, Validators.pattern(/^\d{9,15}$/)]],
      customerName: [''], // Optional
      bookingTime: [null, [Validators.required]],
      duration: [3, [Validators.required, Validators.min(0.1)]], // Dining duration in hours, defaults to 3
      guestCount: [2, [Validators.required, Validators.min(1)]],
      note: ['']
    });
  }

  private loadData(): void {
    if (!this.branchId) return;
    this.loading = true;
    this.cdr.markForCheck();

    // Load tables (size 100 to get all tables of this branch)
    // and load active bookings of this branch (size 1000 for conflict check)
    // using Promise.all or manual subscriptions. Let's subscribe to both.
    this.bookingService.getTables({ page: 1, size: 100 }).subscribe({
      next: tableRes => {
        this.allTables = tableRes.data;
        this.checkDataLoaded();
      },
      error: () => {
        this.loading = false;
        this.message.error(this.i18n.fanyi('booking.tables-load-failed'));
        this.cdr.markForCheck();
      }
    });

    this.bookingService.getBookingsByBranch(this.branchId, { page: 1, size: 1000 }).subscribe({
      next: bookingRes => {
        // Filter out cancelled or expired bookings for conflict checking
        this.allBookings = bookingRes.data.filter(b => b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.EXPIRED);
        this.checkDataLoaded();
      },
      error: () => {
        this.loading = false;
        this.message.error(this.i18n.fanyi('booking.history-load-failed'));
        this.cdr.markForCheck();
      }
    });
  }

  private loadedCount = 0;
  private checkDataLoaded(): void {
    this.loadedCount++;
    if (this.loadedCount >= 2) {
      this.loading = false;
      this.calculateAvailability();
    }
  }

  disabledDate = (current: Date): boolean => {
    // Cannot select past days
    return differenceInCalendarDays(current, new Date()) < 0;
  };

  calculateAvailability(): void {
    const bookingTimeVal = this.form.get('bookingTime')?.value;
    const durationVal = this.form.get('duration')?.value;
    const guestCountVal = this.form.get('guestCount')?.value;

    if (!bookingTimeVal || !durationVal || !guestCountVal) {
      // Clear availability if form is incomplete
      this.tablesWithAvailability = this.allTables.map(t => ({
        ...t,
        isAvailable: false,
        reason: this.i18n.fanyi('booking.availability-incomplete')
      }));
      this.cdr.markForCheck();
      return;
    }

    const targetStart = new Date(bookingTimeVal).getTime();
    const targetEnd = targetStart + durationVal * 60 * 60 * 1000;
    const bufferStart = targetStart - 3 * 60 * 60 * 1000; // Block 3h before to avoid overlap with previous diners

    this.tablesWithAvailability = this.allTables.map(table => {
      // 1. Check Capacity
      if (table.capacity < guestCountVal) {
        return {
          ...table,
          isAvailable: false,
          reason: this.i18n.fanyi('booking.capacity-insufficient', {
            capacity: table.capacity,
            guests: guestCountVal
          })
        };
      }

      // 2. Check overlap with existing bookings on the same table
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
          reason: this.i18n.fanyi('booking.table-conflict', {
            time: overlapTime,
            phone: overlappingBooking.customerPhone
          })
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
    const nameStr = rawForm.customerName ? `${this.i18n.fanyi('booking.customer-prefix')}: ${rawForm.customerName.trim()}. ` : '';
    const noteStr = rawForm.note ? `${this.i18n.fanyi('booking.note-prefix')}: ${rawForm.note.trim()}` : '';

    const request = {
      branchId: this.branchId,
      tableId: this.selectedTableId,
      customerPhone: rawForm.customerPhone.trim(),
      bookingTime: new Date(rawForm.bookingTime).toISOString(),
      guestCount: rawForm.guestCount,
      note: (nameStr + noteStr).trim() || null
    };

    this.bookingService.createBooking(request).subscribe({
      next: () => {
        this.submitting = false;
        this.message.success(this.i18n.fanyi('booking.create-success'));
        this.modalRef.close(true);
      },
      error: err => {
        this.submitting = false;
        this.message.error(getHttpErrorMessage(this.i18n, err, 'booking.create-failed'));
        this.cdr.markForCheck();
      }
    });
  }

  cancel(): void {
    this.modalRef.close(null);
  }
}
