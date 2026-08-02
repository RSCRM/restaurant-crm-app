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
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { PersonalScheduleResponse } from './schedule.model';
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
    NzIconModule,
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

  dateRange: Date[] = [new Date(), new Date()];
  schedules: PersonalScheduleResponse[] = [];
  loading = false;
  managerMode = false;
  columns: STColumn[] = [];

  ngOnInit(): void {
    this.i18n.change.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateColumns());
    this.store
      .select(selectContextToken)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(token => {
        if (!token) return;
        const dataScope = this.authService.parseJwtPayload(token)['dataScope'];
        this.managerMode = dataScope === 'BRANCH' || dataScope === 'ORGANIZATION';
        this.updateColumns();
        this.load();
      });
  }

  showToday(): void {
    const today = new Date();
    this.dateRange = [today, today];
    this.load();
  }

  showThisWeek(): void {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    this.dateRange = [monday, sunday];
    this.load();
  }

  load(): void {
    const [from, to] = this.dateRange;
    if (!from || !to) return;
    if (Math.floor((to.getTime() - from.getTime()) / 86_400_000) >= 31) {
      this.message.warning(this.i18n.fanyi('schedule.range-exceeded'));
      return;
    }

    this.loading = true;
    const request$ = this.managerMode
      ? this.service.getManagedSchedules(this.formatDate(from), this.formatDate(to))
      : this.service.getPersonalSchedule(this.formatDate(from), this.formatDate(to));
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: schedules => {
        this.schedules = schedules;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error(this.i18n.fanyi('schedule.load-failed'));
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
      ...(this.managerMode ? [{ title: this.i18n.fanyi('schedule.employee'), index: 'employeeName' }] : []),
      { title: this.i18n.fanyi('schedule.date'), render: 'date', width: 120 },
      { title: this.i18n.fanyi('schedule.time'), render: 'time', width: 150 },
      { title: this.i18n.fanyi('schedule.branch'), index: 'branchName' },
      { title: this.i18n.fanyi('schedule.note'), render: 'note' },
      { title: this.i18n.fanyi('schedule.status'), render: 'status', width: 130 }
    ];
    this.cdr.markForCheck();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDate(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute, second = 0] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  }
}
