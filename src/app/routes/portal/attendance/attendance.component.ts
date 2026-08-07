import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STChange, STColumn, STModule } from '@delon/abc/st';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { Store } from '@ngrx/store';
import { Html5Qrcode } from 'html5-qrcode';
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
  styleUrl: './attendance.component.less'
})
export class AttendanceComponent implements OnInit, OnDestroy {
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);
  private readonly message = inject(NzMessageService);
  private readonly store = inject(Store);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly i18n = inject(ALAIN_I18N_TOKEN);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  // Permissions
  hasQrDisplay = false;
  hasSelfWrite = false;
  hasSelfRead = false;
  hasBranchRead = false;

  // Active check-in state
  currentAttendance: AttendanceResponse | null = null;
  checkoutCompleted = false;
  loadingStatus = false;
  submittingCheck = false;
  qrTokenInput = '';
  scannerStarting = false;
  scannerError = '';
  private attendanceQrScanner?: Html5Qrcode;

  // History Tab state
  historyList: AttendanceResponse[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loadingHistory = false;
  historyDate: Date | null = null;

  branchList: EmployeeAttendanceResponse[] = [];
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
  employeeHistoryDate: Date | null = null;

  // Manager QR Tab state
  qrData: AttendanceQrResponse | null = null;
  checkInQrUrl = '';
  checkOutQrUrl = '';
  loadingQr = false;
  qrSecondsRemaining = 0;
  private qrTimerId?: ReturnType<typeof setInterval>;
  private dailyRefreshTimerId?: ReturnType<typeof setTimeout>;
  private attendanceEventsSubscription?: Subscription;

  columns: STColumn[] = [];
  branchColumns: STColumn[] = [];
  branchHistoryColumns: STColumn[] = [];

  ngOnInit(): void {
    this.scheduleDailyRefresh();

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
        if (this.ownerContext) {
          this.loadBranches();
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
          if (!this.handlePendingAttendance()) this.loadCurrentStatus();
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
          this.loadEmployeeHistory();
          this.startAttendanceRealtime();
        }
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.clearQrTimer();
    clearTimeout(this.dailyRefreshTimerId);
    this.attendanceEventsSubscription?.unsubscribe();
    void this.stopAttendanceScanner();
  }

  updateColumns(): void {
    this.columns = [
      { title: this.i18n.fanyi('attendance.workDate'), index: 'workDate', type: 'date', dateFormat: 'dd/MM/yyyy', className: 'text-left' },
      {
        title: this.i18n.fanyi('attendance.scheduledStart'),
        index: 'scheduledStart',
        type: 'date',
        dateFormat: 'HH:mm',
        className: 'text-left'
      },
      {
        title: this.i18n.fanyi('attendance.scheduledEnd'),
        index: 'scheduledEnd',
        type: 'date',
        dateFormat: 'HH:mm',
        className: 'text-left'
      },
      { title: this.i18n.fanyi('attendance.checkIn'), index: 'checkInAt', type: 'date', dateFormat: 'HH:mm:ss', className: 'text-left' },
      { title: this.i18n.fanyi('attendance.checkOut'), index: 'checkOutAt', type: 'date', dateFormat: 'HH:mm:ss', className: 'text-left' },
      { title: this.i18n.fanyi('attendance.status'), render: 'status', className: 'text-left' }
    ];
    this.branchColumns = [
      { title: this.i18n.fanyi('attendance.employee-code'), index: 'username', className: 'text-left' },
      { title: this.i18n.fanyi('attendance.employee-name'), index: 'employeeName', className: 'text-left' },
      { title: this.i18n.fanyi('attendance.workDate'), index: 'workDate', type: 'date', dateFormat: 'dd/MM/yyyy', className: 'text-left' },
      {
        title: this.i18n.fanyi('attendance.scheduledStart'),
        index: 'scheduledStart',
        type: 'date',
        dateFormat: 'HH:mm',
        className: 'text-left'
      },
      {
        title: this.i18n.fanyi('attendance.scheduledEnd'),
        index: 'scheduledEnd',
        type: 'date',
        dateFormat: 'HH:mm',
        className: 'text-left'
      },
      { title: this.i18n.fanyi('attendance.checkIn'), index: 'checkInAt', type: 'date', dateFormat: 'HH:mm:ss', className: 'text-left' },
      { title: this.i18n.fanyi('attendance.checkOut'), index: 'checkOutAt', type: 'date', dateFormat: 'HH:mm:ss', className: 'text-left' },
      { title: this.i18n.fanyi('attendance.working'), render: 'working', className: 'text-left' },
      { title: this.i18n.fanyi('attendance.status'), render: 'branchStatus', className: 'text-left' }
    ];
    this.branchHistoryColumns = [
      { title: this.i18n.fanyi('attendance.employee-code'), index: 'username', className: 'text-left' },
      { title: this.i18n.fanyi('attendance.employee-name'), index: 'employeeName', className: 'text-left' },
      ...this.columns
    ];
  }

  loadBranchAttendance(): void {
    if (this.ownerContext && !this.selectedBranchId) return;
    this.loadingBranch = true;
    this.attendanceService
      .getBranchAttendance(this.formatDate(new Date()), this.selectedBranchId ?? undefined)
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

  loadBranches(): void {
    this.attendanceService
      .getOrganizationBranches()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(branches => {
        this.branches = branches;
        if (!branches.some(branch => branch.id === this.selectedBranchId)) {
          this.selectedBranchId = branches[0]?.id ?? null;
        }
        this.loadBranchAttendance();
        this.loadEmployeeHistory();
        this.startAttendanceRealtime();
        this.cdr.markForCheck();
      });
  }

  onBranchChange(): void {
    this.qrData = null;
    this.selectedEmployeeId = null;
    this.employeeHistoryDate = null;
    this.employeeHistory = [];
    this.employeeHistoryTotal = 0;
    this.clearQrTimer();
    this.loadBranchAttendance();
    this.loadEmployeeHistory();
    this.startAttendanceRealtime();
  }

  loadEmployeeHistory(): void {
    this.employeeHistoryLoading = true;
    this.attendanceService
      .getBranchHistory(
        this.selectedEmployeeId,
        this.employeeHistoryDate ? this.formatDate(this.employeeHistoryDate) : null,
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

  resetEmployeeHistory(): void {
    this.employeeHistoryDate = null;
    this.employeeHistoryPage = 1;
    this.selectedEmployeeId = null;
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
          this.checkoutCompleted = false;
          if (res.data && res.data.length > 0) {
            const latest = res.data[0];
            this.checkoutCompleted = latest.workDate === this.formatDate(new Date()) && !!latest.checkOutAt;
            if (latest.checkInAt && !latest.checkOutAt) {
              this.currentAttendance = latest;
            } else {
              this.currentAttendance = null;
            }
          } else {
            this.currentAttendance = null;
          }
          if (this.checkoutCompleted) {
            void this.stopAttendanceScanner();
          } else {
            setTimeout(() => this.startAttendanceScanner());
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
        this.checkoutCompleted = false;
        this.qrTokenInput = '';
        this.message.success(this.i18n.fanyi('attendance.checkin-success'));
        this.loadHistory();
        setTimeout(() => this.startAttendanceScanner());
        this.cdr.markForCheck();
      },
      error: () => {
        this.submittingCheck = false;
        this.message.error(this.i18n.fanyi('attendance.checkin-failed'));
        setTimeout(() => this.startAttendanceScanner());
        this.cdr.markForCheck();
      }
    });
  }

  // Check-out action
  checkOut(qrToken: string): void {
    this.submittingCheck = true;
    this.cdr.markForCheck();

    this.attendanceService.checkOutWithQr(qrToken).subscribe({
      next: () => {
        this.submittingCheck = false;
        this.currentAttendance = null;
        this.checkoutCompleted = true;
        this.message.success(this.i18n.fanyi('attendance.checkout-success'));
        this.loadHistory();
        void this.stopAttendanceScanner();
        this.cdr.markForCheck();
      },
      error: () => {
        this.submittingCheck = false;
        this.message.error(this.i18n.fanyi('attendance.checkout-failed'));
        setTimeout(() => this.startAttendanceScanner());
        this.cdr.markForCheck();
      }
    });
  }

  // History Tab logic
  loadHistory(): void {
    this.loadingHistory = true;
    this.cdr.markForCheck();

    const date = this.historyDate ? this.formatDate(this.historyDate) : null;

    this.attendanceService
      .getMyHistory(date, date, this.currentPage, this.pageSize)
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
    this.historyDate = null;
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
        const loginUrl = `${window.location.origin}/#/auth/login`;
        this.checkInQrUrl = `${loginUrl}?attendanceAction=check-in&qrToken=${encodeURIComponent(res.qrToken)}`;
        this.checkOutQrUrl = `${loginUrl}?attendanceAction=check-out&qrToken=${encodeURIComponent(res.qrToken)}`;
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
    void this.stopAttendanceScanner();
  }

  onCheckInTabSelected(): void {
    this.loadCurrentStatus();
  }

  startAttendanceScanner(): void {
    if (this.scannerStarting || this.attendanceQrScanner?.isScanning) return;
    if (!document.getElementById('attendance-qr-reader')) return;

    this.scannerStarting = true;
    this.scannerError = '';
    this.cdr.markForCheck();
    this.attendanceQrScanner ??= new Html5Qrcode('attendance-qr-reader', {
      verbose: false,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true }
    });

    this.attendanceQrScanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: (width, height) => {
            const size = Math.floor(Math.min(width, height) * 0.8);
            return { width: size, height: size };
          }
        },
        decodedText => {
          this.ngZone.run(() => {
            void this.stopAttendanceScanner();
            this.handleScannedAttendance(decodedText);
          });
        },
        () => {}
      )
      .then(() => {
        this.scannerStarting = false;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.scannerStarting = false;
        this.scannerError = this.i18n.fanyi('attendance.scanner-camera-error');
        this.cdr.markForCheck();
      });
  }

  async onAttendanceQrFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    await this.stopAttendanceScanner();
    const fileScanner = new Html5Qrcode('attendance-qr-file', {
      verbose: false,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true }
    });
    try {
      // Luôn resize về kích thước tối ưu (không quá lớn, không quá nhỏ)
      const resizedFile = await this.resizeQrFile(file, 800);
      let value: string;
      try {
        value = await fileScanner.scanFile(resizedFile, false);
      } catch {
        // Nếu resize 800px vẫn fail → thử với file gốc
        value = await fileScanner.scanFile(file, false);
      }
      this.handleScannedAttendance(value);
    } catch {
      this.message.error(this.i18n.fanyi('attendance.scanner-file-error'));
      setTimeout(() => this.startAttendanceScanner());
    } finally {
      input.value = '';
      fileScanner.clear();
    }
  }

  /**
   * Resize ảnh QR về kích thước tối ưu để thư viện decode được.
   * Ảnh quá lớn sẽ bị thu nhỏ, ảnh quá nhỏ sẽ được phóng to.
   *
   * @param file File ảnh gốc
   * @param targetSize Kích thước mong muốn cho cạnh ngắn nhất (px), mặc định 800
   */
  private async resizeQrFile(file: File, targetSize = 800): Promise<File> {
    const image = await createImageBitmap(file);
    try {
      const minEdge = Math.min(image.width, image.height);
      const scale = targetSize / minEdge;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext('2d')!;
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(value => (value ? resolve(value) : reject(new Error('Cannot resize QR image'))), 'image/png')
      );
      return new File([blob], file.name, { type: 'image/png' });
    } finally {
      image.close();
    }
  }

  private async stopAttendanceScanner(): Promise<void> {
    this.scannerStarting = false;
    if (this.attendanceQrScanner?.isScanning) {
      try {
        await this.attendanceQrScanner.stop();
      } catch {
        // Scanner may already be stopped.
      }
    }
  }

  private startAttendanceRealtime(): void {
    this.attendanceEventsSubscription?.unsubscribe();
    if (!this.hasBranchRead || !this.selectedBranchId) return;
    this.attendanceEventsSubscription = this.attendanceService.watchBranchAttendance(this.selectedBranchId).subscribe(() => {
      this.loadBranchAttendance();
      this.loadEmployeeHistory();
    });
  }

  private scheduleDailyRefresh(): void {
    const now = new Date();
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    this.dailyRefreshTimerId = setTimeout(
      () => {
        if (this.hasBranchRead) this.loadBranchAttendance();
        this.scheduleDailyRefresh();
      },
      nextDay.getTime() - now.getTime() + 1000
    );
  }

  private handlePendingAttendance(): boolean {
    const pending = this.authService.consumePendingAttendance();
    if (!pending) return false;
    if (pending.action === 'check-out') {
      this.checkOut(pending.qrToken);
    } else {
      this.qrTokenInput = pending.qrToken;
      this.checkIn();
    }
    return true;
  }

  private handleScannedAttendance(value: string): void {
    const params = new URLSearchParams(value.includes('?') ? value.slice(value.indexOf('?') + 1) : '');
    const qrToken = params.get('qrToken') ?? value;
    if (params.get('attendanceAction') === 'check-out') {
      this.checkOut(qrToken);
    } else {
      this.qrTokenInput = qrToken;
      this.checkIn();
    }
  }

  employeeFilterOption = (input: string, option: { nzValue: string; nzLabel: string | number | null }): boolean => {
    const search = input.toLowerCase();
    const label = option.nzLabel ? String(option.nzLabel).toLowerCase() : '';
    return label.includes(search);
  };
}
