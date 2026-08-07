import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STColumn, STModule } from '@delon/abc/st';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { Store } from '@ngrx/store';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { finalize, Observable, Subscription } from 'rxjs';

import { PersonalScheduleResponse, ScheduleEmployeeResponse } from './schedule.model';
import { ScheduleService } from './schedule.service';
import { AuthService } from '../../auth/services/auth.service';
import { selectContextToken } from '../../auth/store/auth.selectors';

@Component({
  selector: 'app-schedule',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    PageHeaderModule,
    STModule,
    NzButtonModule,
    NzCardModule,
    NzDatePickerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzModalModule,
    NzSelectModule,
    NzTagModule,
    I18nPipe
  ],
  templateUrl: './schedule.component.html'
})
export class ScheduleComponent implements OnInit {
  private readonly service = inject(ScheduleService);
  private readonly authService = inject(AuthService);
  private readonly store = inject(Store);
  private readonly message = inject(NzMessageService);
  private readonly i18n = inject(ALAIN_I18N_TOKEN);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  selectedDate: Date | null = new Date();
  allSchedules: PersonalScheduleResponse[] = [];
  schedules: PersonalScheduleResponse[] = [];
  employees: Array<{ id: string; name: string }> = [];
  managedEmployees: ScheduleEmployeeResponse[] = [];
  selectedEmployeeId: string | null = null;
  loading = false;
  creating = false;
  createVisible = false;
  createDateRange: Date[] = [new Date(), new Date()];
  createForm = { employeeIds: [] as string[], startTime: '08:00', endTime: '16:00', note: '' };
  managerMode = false;
  columns: STColumn[] = [];
  private loadSubscription?: Subscription;

  ngOnInit(): void {
    this.i18n.change.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateColumns());
    this.store
      .select(selectContextToken)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(token => {
        if (!token) return;
        const payload = this.authService.parseJwtPayload(token);
        const orgRole = payload['orgRole'];
        this.managerMode = orgRole === 'MANAGER' || orgRole === 'OWNER';
        this.updateColumns();
        if (this.managerMode) this.loadManagedEmployees();
        this.load();
      });
  }

  showToday(): void {
    this.selectedDate = new Date();
    this.load();
  }

  showThisWeek(): void {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    this.selectedDate = null;
    this.selectedEmployeeId = null;
    this.load(monday, sunday);
  }

  reloadAll(): void {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.selectedDate = null;
    this.selectedEmployeeId = null;
    this.load(startOfMonth, endOfMonth);
  }

  load(from?: Date | null, to?: Date | null): void {
    let effectiveFrom = from !== undefined ? from : this.selectedDate;
    let effectiveTo = to !== undefined ? to : effectiveFrom;

    // Nếu không có ngày → tự động lấy tuần hiện tại
    if (!effectiveFrom || !effectiveTo) {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      effectiveFrom = monday;
      effectiveTo = sunday;
    }

    this.loadSubscription?.unsubscribe();
    this.loading = true;
    this.cdr.markForCheck();

    try {
      const fromDate = this.formatDate(effectiveFrom);
      const toDate = this.formatDate(effectiveTo);

      let request$: Observable<PersonalScheduleResponse[]>;
      if (!this.managerMode) {
        request$ = this.service.getPersonalSchedule(fromDate, toDate);
      } else if (this.selectedEmployeeId) {
        // Có chọn nhân viên cụ thể → gọi API lấy lịch riêng nhân viên đó
        request$ = this.service.getStaffSchedule(this.selectedEmployeeId, fromDate, toDate);
      } else {
        // Không chọn nhân viên → lấy tất cả
        request$ = this.service.getManagedSchedules(fromDate, toDate);
      }

      this.loadSubscription = request$
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.loading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: schedules => {
            this.allSchedules = schedules;
            this.schedules = schedules;
            this.employees = Array.from(
              new Map(schedules.map(schedule => [schedule.employeeId, { id: schedule.employeeId, name: schedule.employeeName }])).values()
            );
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.loading = false;
            this.message.error(this.i18n.fanyi('schedule.load-failed'));
            this.cdr.markForCheck();
          }
        });
    } catch (e) {
      console.error(e);
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  filterByEmployee(): void {
    this.schedules = this.selectedEmployeeId
      ? this.allSchedules.filter(schedule => schedule.employeeId === this.selectedEmployeeId)
      : this.allSchedules;
    this.cdr.markForCheck();
  }

  employeeFilterOption = (input: string, option: { nzValue: string; nzLabel: string | number | null }): boolean => {
    const search = input.toLowerCase();
    const label = option.nzLabel ? String(option.nzLabel).toLowerCase() : '';
    if (label.includes(search)) return true;
    const employee = this.managedEmployees.find(e => e.id === option.nzValue);
    if (employee) {
      return (
        employee.name.toLowerCase().includes(search) ||
        (employee.fullName && employee.fullName.toLowerCase().includes(search)) ||
        (employee.email && employee.email.toLowerCase().includes(search)) ||
        false
      );
    }
    return false;
  };

  openCreate(): void {
    const date = this.selectedDate ?? new Date();
    this.createDateRange = [date, date];
    this.createForm = { employeeIds: [], startTime: '08:00', endTime: '16:00', note: '' };
    this.createVisible = true;
  }

  createSchedules(): void {
    const [from, to] = this.createDateRange;
    if (
      !this.createForm.employeeIds ||
      this.createForm.employeeIds.length === 0 ||
      !from ||
      !to ||
      this.createForm.startTime >= this.createForm.endTime
    ) {
      this.message.warning(this.i18n.fanyi('schedule.create-invalid'));
      return;
    }
    if (Math.floor((to.getTime() - from.getTime()) / 86_400_000) >= 31) {
      this.message.warning(this.i18n.fanyi('schedule.range-exceeded'));
      return;
    }

    this.creating = true;
    this.service
      .createSchedules({
        ...this.createForm,
        from: this.formatDate(from),
        to: this.formatDate(to)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: schedules => {
          this.creating = false;
          this.createVisible = false;
          const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
          const totalRequested = days * this.createForm.employeeIds.length;

          if (schedules.length === 0) {
            this.message.warning('Tất cả ngày và nhân viên được chọn đều đã có lịch làm việc!');
          } else if (schedules.length < totalRequested) {
            this.message.success(`Đã tạo thành công ${schedules.length} lịch làm việc (bỏ qua các ca trùng lịch)`);
          } else {
            this.message.success(this.i18n.fanyi('schedule.create-success', { count: schedules.length }));
          }
          this.load();
        },
        error: error => {
          this.creating = false;
          this.message.error(error?.error?.errorMessage?.message ?? this.i18n.fanyi('schedule.create-failed'));
          this.cdr.markForCheck();
        }
      });
  }

  getStatus(schedule: PersonalScheduleResponse): 'current' | 'upcoming' | 'completed' {
    const now = Date.now();
    const start = this.toDate(schedule.workDate, schedule.startTime).getTime();
    const end = this.toDate(schedule.workDate, schedule.endTime).getTime();
    return now < start ? 'upcoming' : now <= end ? 'current' : 'completed';
  }

  private updateColumns(): void {
    this.columns = [
      ...(this.managerMode
        ? [
            { title: this.i18n.fanyi('schedule.employee-code'), index: 'employeeName' },
            { title: this.i18n.fanyi('schedule.employee-name'), index: 'employeeFullName' }
          ]
        : []),
      { title: this.i18n.fanyi('schedule.date'), render: 'date', width: 120 },
      { title: this.i18n.fanyi('schedule.time'), render: 'time', width: 150 },
      { title: this.i18n.fanyi('schedule.branch'), index: 'branchName' },
      { title: this.i18n.fanyi('schedule.note'), render: 'note' },
      { title: this.i18n.fanyi('schedule.status'), render: 'status', width: 130 }
    ];
    this.cdr.markForCheck();
  }

  private loadManagedEmployees(): void {
    this.service
      .getManagedEmployees()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: employees => {
          this.managedEmployees = employees;
          this.cdr.markForCheck();
        },
        error: () => this.message.error(this.i18n.fanyi('schedule.employee-load-failed'))
      });
  }

  private formatDate(date: Date | string): string {
    if (!date) return '';
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  }

  private toDate(date: string | null | undefined, time: string | null | undefined): Date {
    if (!date) return new Date();
    const timeStr = time || '00:00:00';
    try {
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute, second = 0] = timeStr.split(':').map(Number);
      return new Date(year, month - 1, day, hour, minute, second);
    } catch {
      return new Date();
    }
  }
}
