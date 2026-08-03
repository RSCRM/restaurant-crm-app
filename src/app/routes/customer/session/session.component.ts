import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { interval } from 'rxjs';

import { customerErrorMessage, extractErrorCode, SESSION_ENDED, SESSION_EXPIRED } from '../customer-error';
import { CustomerQrService } from '../customer-qr.service';
import { CustomerSessionStore } from '../customer-session.store';
import { QrSessionResponse } from '../customer.model';

const HEARTBEAT_INTERVAL_MS = 60000;

@Component({
  selector: 'app-customer-session',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzAlertModule, NzButtonModule, NzCardModule, NzDescriptionsModule, NzSpinModule, NzTagModule, NzTypographyModule],
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.less']
})
export class SessionComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly message = inject(NzMessageService);
  private readonly qrService = inject(CustomerQrService);
  private readonly sessionStore = inject(CustomerSessionStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly session = this.sessionStore.session;

  current: QrSessionResponse | null = null;
  loading = true;
  refreshing = false;
  errorText = '';

  get isOwner(): boolean {
    return this.current?.role === 'OWNER';
  }

  get groupJoinUrl(): string {
    return this.current?.groupQrToken ? `${window.location.origin}/#/customer/join?gqr=${this.current.groupQrToken}` : '';
  }

  ngOnInit(): void {
    if (!this.sessionStore.isActive()) {
      this.router.navigate(['/customer/scan']);
      return;
    }
    this.loadSession();
    interval(HEARTBEAT_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.sendHeartbeat());
  }

  refreshGroupQr(): void {
    this.refreshing = true;
    this.cdr.markForCheck();
    this.qrService.refreshGroupQr().subscribe({
      next: response => {
        this.refreshing = false;
        this.current = response;
        this.message.success('Đã tạo mã QR nhóm mới.');
        this.cdr.markForCheck();
      },
      error: error => {
        this.refreshing = false;
        this.message.error(customerErrorMessage(error));
        this.cdr.markForCheck();
      }
    });
  }

  leave(): void {
    this.sessionStore.clear();
    this.router.navigate(['/customer/scan']);
  }

  private loadSession(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.qrService.getSession().subscribe({
      next: response => {
        this.loading = false;
        this.current = response;
        this.cdr.markForCheck();
      },
      error: error => {
        this.loading = false;
        this.handleSessionError(error);
      }
    });
  }

  private sendHeartbeat(): void {
    this.qrService.heartbeat().subscribe({
      next: response => {
        this.current = response;
        this.cdr.markForCheck();
      },
      error: error => this.handleSessionError(error)
    });
  }

  private handleSessionError(error: unknown): void {
    const code = extractErrorCode(error);
    if (code === SESSION_ENDED || code === SESSION_EXPIRED) {
      this.sessionStore.clear();
      this.message.error(customerErrorMessage(error));
      this.router.navigate(['/customer/scan']);
      return;
    }
    this.errorText = customerErrorMessage(error);
    this.cdr.markForCheck();
  }
}
