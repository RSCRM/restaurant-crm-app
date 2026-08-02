import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STChange, STColumn, STModule } from '@delon/abc/st';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { Store } from '@ngrx/store';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzQRCodeModule } from 'ng-zorro-antd/qr-code';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabComponent, NzTabsComponent } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Subscription } from 'rxjs';

import {
  AttendanceBranchResponse,
  AttendanceQrResponse,
  AttendanceResponse,
  AttendanceStatus,
  EmployeeAttendanceResponse
} from './attendance.model';
import { AttendanceService } from './attendance.service';
import { AuthService } from '../../auth/services/auth.service';
import { selectContextToken, selectHasPermission } from '../../auth/store/auth.selectors';

@Component({
  selector: 'app-attendance',
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
    NzFormModule,
    NzGridModule,
    NzTabsComponent,
    NzTabComponent,
    NzDatePickerModule,
    NzAlertModule,
    NzQRCodeModule,
    NzSelectModule,
    NzSpinModule,
    STModule,
    I18nPipe
  ],
  templateUrl: './attendance.component.html',
  styles: [
    `
      .attendance-container {
        max-width: 900px;
        margin: 0 auto;
      }
      .qr-card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        text-align: center;
      }
      .countdown-timer {
        font-size: 16px;
        font-weight: 500;
        color: #f5222d;
      }
      .check-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px;
      }
      .status-box {
        width: 100%;
        max-width: 480px;
        margin-bottom: 24px;
        text-align: center;
      }
      .action-box {
        width: 100%;
        max-width: 480px;
      }
    `
  ]
})
export class AttendanceComponent implements OnInit, OnDestroy {
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);
  private readonly message = inject(NzMessageService);
  private readonly store = inject(Store);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly i18n = inject(ALAIN_I18N_TOKEN);
  private readonly destroyRef = inject(DestroyRef);

  // Permissions
  hasQrDisplay = false;
  hasSelfWrite = false;
  hasSelfRead = false;
  hasBranchRead = false;

  // Active check-in state
  currentAttendance: AttendanceResponse | null = null;
  loadingStatus = false;
  submittingCheck = false;
  qrTokenInput = '';

  // History Tab state
  historyList: AttendanceResponse[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loadingHistory = false;
  dateRange: Date[] = [];

  branchList: EmployeeAttendanceResponse[] = [];
  branchDate = new Date();
  loadingBranch = false;
  ownerContext = false;
  branches: AttendanceBranchResponse[] = [];
  selectedBranchId: string | null = null;
  selectedEmployeeId: string | null = null;
  employeeHistory: AttendanceResponse[] = [];
  employeeHistoryTotal = 0;
  employeeHistoryPage = 1;
  employeeHistorySize = 10;
  employeeHistoryLoading = false;
  employeeDateRange: Date[] = [];

  // Manager QR Tab state
  qrData: AttendanceQrResponse | null = null;
  loadingQr = false;
  qrSecondsRemaining = 0;
  private qrTimerId?: ReturnType<typeof setInterval>;
  private attendanceEventsSubscription?: Subscription;

  columns: STColumn[] = [];
  branchColumns: STColumn[] = [];

  ngOnInit(): void {
    // Translate column headers and listen to language switches
    this.updateColumns();
    this.i18n.change.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateColumns();
      this.cdr.markForCheck();
    });

    this.store
      .select(selectContextToken)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(token => {
        if (!token) return;
        const payload = this.authService.parseJwtPayload(token);
        this.ownerContext = payload['orgRole'] === 'OWNER';
        this.selectedBranchId = typeof payload['branchId'] === 'string' ? payload['branchId'] : null;
        const organizationId = payload['organizationId'];
        if (this.ownerContext && typeof organizationId === 'string') {
          this.loadBranches(organizationId);
        }
      });

    // Check permissions
    this.store
      .select(selectHasPermission('ATTENDANCE_QR_DISPLAY'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(has => {
        this.hasQrDisplay = has;
        this.cdr.markForCheck();
      });

    this.store
      .select(selectHasPermission('ATTENDANCE_SELF_WRITE'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(has => {
        this.hasSelfWrite = has;
        if (has) {
          this.loadCurrentStatus();
        }
        this.cdr.markForCheck();
      });

    this.store
      .select(selectHasPermission('ATTENDANCE_SELF_READ'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(has => {
        this.hasSelfRead = has;
        if (has) {
          this.loadHistory();
        }
        this.cdr.markForCheck();
      });

    this.store
      .select(selectHasPermission('ATTENDANCE_BRANCH_READ'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(has => {
        this.hasBranchRead = has;
        if (has) {
          this.loadBranchAttendance();
          this.startAttendanceRealtime();
        }
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.clearQrTimer();
    this.attendanceEventsSubscription?.unsubscribe();
  }

  updateColumns(): void {
    this.columns = [
      { title: this.i18n.fanyi('attendance.workDate'), index: 'workDate', type: 'date', dateFormat: 'dd/MM/yyyy' },
      { title: this.i18n.fanyi('attendance.scheduledStart'), index: 'scheduledStart', type: 'date', dateFormat: 'HH:mm' },
      { title: this.i18n.fanyi('attendance.scheduledEnd'), index: 'scheduledEnd', type: 'date', dateFormat: 'HH:mm' },
      { title: this.i18n.fanyi('attendance.checkIn'), index: 'checkInAt', type: 'date', dateFormat: 'HH:mm:ss' },
      { title: this.i18n.fanyi('attendance.checkOut'), index: 'checkOutAt', type: 'date', dateFormat: 'HH:mm:ss' },
      { title: this.i18n.fanyi('attendance.status'), render: 'status' }
    ];
    this.branchColumns = [
      { title: this.i18n.fanyi('attendance.employee'), index: 'employeeName' },
      { title: this.i18n.fanyi('attendance.workDate'), index: 'workDate', type: 'date', dateFormat: 'dd/MM/yyyy' },
      { title: this.i18n.fanyi('attendance.scheduledStart'), index: 'scheduledStart', type: 'date', dateFormat: 'HH:mm' },
      { title: this.i18n.fanyi('attendance.scheduledEnd'), index: 'scheduledEnd', type: 'date', dateFormat: 'HH:mm' },
      { title: this.i18n.fanyi('attendance.checkIn'), index: 'checkInAt', type: 'date', dateFormat: 'HH:mm:ss' },
      { title: this.i18n.fanyi('attendance.checkOut'), index: 'checkOutAt', type: 'date', dateFormat: 'HH:mm:ss' },
      { title: this.i18n.fanyi('attendance.working'), render: 'working' },
      { title: this.i18n.fanyi('attendance.status'), render: 'branchStatus' }
    ];
  }

  loadBranchAttendance(): void {
    if (this.ownerContext && !this.selectedBranchId) return;
    this.loadingBranch = true;
    this.attendanceService
      .getBranchAttendance(this.formatDate(this.branchDate), this.selectedBranchId ?? undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.branchList = data;
          this.loadingBranch = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingBranch = false;
          this.message.error(this.i18n.fanyi('attendance.load-failed'));
          this.cdr.markForCheck();
        }
      });
  }

  loadBranches(organizationId: string): void {
    this.attendanceService
      .getOrganizationBranches(organizationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(branches => {
        this.branches = branches;
        this.selectedBranchId = branches[0]?.id ?? null;
        this.loadBranchAttendance();
        this.startAttendanceRealtime();
        this.cdr.markForCheck();
      });
  }

  onBranchChange(): void {
    this.qrData = null;
    this.selectedEmployeeId = null;
    this.employeeHistory = [];
    this.employeeHistoryTotal = 0;
    this.clearQrTimer();
    this.loadBranchAttendance();
    this.startAttendanceRealtime();
  }

  loadEmployeeHistory(): void {
    if (!this.selectedEmployeeId) return;
    this.employeeHistoryLoading = true;
    const from = this.employeeDateRange[0] ? this.formatDate(this.employeeDateRange[0]) : null;
    const to = this.employeeDateRange[1] ? this.formatDate(this.employeeDateRange[1]) : null;
    this.attendanceService
      .getEmployeeHistory(
        this.selectedEmployeeId,
        from,
        to,
        this.employeeHistoryPage,
        this.employeeHistorySize,
        this.selectedBranchId ?? undefined
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.employeeHistory = response.data;
          this.employeeHistoryTotal = response.totalElement;
          this.employeeHistoryLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.employeeHistoryLoading = false;
          this.message.error(this.i18n.fanyi('attendance.load-failed'));
          this.cdr.markForCheck();
        }
      });
  }

  onEmployeeHistoryChange(event: STChange): void {
    if (event.type === 'pi') {
      this.employeeHistoryPage = event.pi!;
      this.loadEmployeeHistory();
    } else if (event.type === 'ps') {
      this.employeeHistorySize = event.ps!;
      this.employeeHistoryPage = 1;
      this.loadEmployeeHistory();
    }
  }

  onEmployeeSelected(): void {
    this.employeeHistoryPage = 1;
    this.loadEmployeeHistory();
  }

  // Load active checked-in status from history
  loadCurrentStatus(): void {
    this.loadingStatus = true;
    this.cdr.markForCheck();

    this.attendanceService
      .getMyHistory(null, null, 1, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.loadingStatus = false;
          if (res.data && res.data.length > 0) {
            const latest = res.data[0];
            if (latest.checkInAt && !latest.checkOutAt) {
              this.currentAttendance = latest;
            } else {
              this.currentAttendance = null;
            }
          } else {
            this.currentAttendance = null;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingStatus = false;
          this.cdr.markForCheck();
        }
      });
  }

  // Check-in action
  checkIn(): void {
    if (!this.qrTokenInput.trim()) return;
    this.submittingCheck = true;
    this.cdr.markForCheck();

    this.attendanceService.checkIn({ qrToken: this.qrTokenInput.trim() }).subscribe({
      next: res => {
        this.submittingCheck = false;
        this.currentAttendance = res;
        this.qrTokenInput = '';
        this.message.success(this.i18n.fanyi('attendance.checkin-success'));
        this.loadHistory();
        this.cdr.markForCheck();
      },
      error: () => {
        this.submittingCheck = false;
        this.message.error(this.i18n.fanyi('attendance.checkin-failed'));
        this.cdr.markForCheck();
      }
    });
  }

  // Check-out action
  checkOut(): void {
    this.submittingCheck = true;
    this.cdr.markForCheck();

    this.attendanceService.checkOut().subscribe({
      next: () => {
        this.submittingCheck = false;
        this.currentAttendance = null;
        this.message.success(this.i18n.fanyi('attendance.checkout-success'));
        this.loadHistory();
        this.cdr.markForCheck();
      },
      error: () => {
        this.submittingCheck = false;
        this.message.error(this.i18n.fanyi('attendance.checkout-failed'));
        this.cdr.markForCheck();
      }
    });
  }

  // History Tab logic
  loadHistory(): void {
    this.loadingHistory = true;
    this.cdr.markForCheck();

    const fromStr = this.dateRange[0] ? this.formatDate(this.dateRange[0]) : null;
    const toStr = this.dateRange[1] ? this.formatDate(this.dateRange[1]) : null;

    this.attendanceService
      .getMyHistory(fromStr, toStr, this.currentPage, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.historyList = res.data;
          this.total = res.totalElement;
          this.loadingHistory = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingHistory = false;
          this.message.error(this.i18n.fanyi('attendance.load-failed'));
          this.cdr.markForCheck();
        }
      });
  }

  onSTChange(e: STChange): void {
    if (e.type === 'pi') {
      this.currentPage = e.pi!;
      this.loadHistory();
    } else if (e.type === 'ps') {
      this.pageSize = e.ps!;
      this.currentPage = 1;
      this.loadHistory();
    }
  }

  search(): void {
    this.currentPage = 1;
    this.loadHistory();
  }

  reset(): void {
    this.dateRange = [];
    this.currentPage = 1;
    this.loadHistory();
  }

  // Branch Manager Tab logic
  loadQr(force = false): void {
    this.loadingQr = true;
    this.cdr.markForCheck();
    this.clearQrTimer();

    if (this.ownerContext && !this.selectedBranchId) return;
    this.attendanceService.getCurrentQr(this.selectedBranchId ?? undefined, force).subscribe({
      next: res => {
        this.qrData = res;
        this.loadingQr = false;

        // Calculate countdown from expiresAt
        const expiresTime = new Date(res.expiresAt).getTime();
        const nowTime = Date.now();
        this.qrSecondsRemaining = Math.max(0, Math.floor((expiresTime - nowTime) / 1000));

        this.startQrTimer();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingQr = false;
        this.message.error(this.i18n.fanyi('attendance.qr-load-failed'));
        this.cdr.markForCheck();
      }
    });
  }

  private startQrTimer(): void {
    this.qrTimerId = setInterval(() => {
      if (this.qrSecondsRemaining > 0) {
        this.qrSecondsRemaining--;
        this.cdr.markForCheck();
      } else {
        // Expiry reached: refresh QR
        this.loadQr();
      }
    }, 1000);
  }

  private clearQrTimer(): void {
    if (this.qrTimerId) {
      clearInterval(this.qrTimerId);
      this.qrTimerId = undefined;
    }
  }

  // Helpers
  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getStatusColor(status: AttendanceStatus): string {
    return status === AttendanceStatus.ON_TIME ? 'success' : 'warning';
  }

  getStatusText(status: AttendanceStatus): string {
    return status === AttendanceStatus.ON_TIME ? 'Đúng giờ' : 'Đi muộn';
  }

  onSelectOtherTab(): void {
    this.clearQrTimer();
  }

  private startAttendanceRealtime(): void {
    this.attendanceEventsSubscription?.unsubscribe();
    if (!this.hasBranchRead || !this.selectedBranchId) return;
    this.attendanceEventsSubscription = this.attendanceService.watchBranchAttendance(this.selectedBranchId).subscribe(() => {
      this.loadBranchAttendance();
      if (this.selectedEmployeeId) this.loadEmployeeHistory();
    });
  }
}
