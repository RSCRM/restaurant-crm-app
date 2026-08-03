import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { interval } from 'rxjs';

import { customerErrorMessage, extractErrorCode, OTP_TICKET_INVALID } from '../customer-error';
import { CustomerOtpService } from '../customer-otp.service';
import { CustomerQrService } from '../customer-qr.service';
import { CustomerSessionStore } from '../customer-session.store';
import { QrResolveResponse, QrSessionResponse } from '../customer.model';

const VN_PHONE_REGEX = /^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
const OTP_TOO_MANY_ATTEMPTS = 'OTP_1002';

function normalizeVnPhone(raw: string): string {
  let phone = raw.replace(/[\s.-]/g, '');
  if (phone.startsWith('+84')) {
    phone = `0${phone.slice(3)}`;
  } else if (phone.startsWith('84')) {
    phone = `0${phone.slice(2)}`;
  }
  return phone;
}

@Component({
  selector: 'app-customer-entry',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzButtonModule, NzCardModule, NzInputModule],
  templateUrl: './customer-entry.component.html',
  styleUrls: ['./customer-entry.component.less']
})
export class CustomerEntryComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly message = inject(NzMessageService);
  private readonly qrService = inject(CustomerQrService);
  private readonly otpService = inject(CustomerOtpService);
  private readonly sessionStore = inject(CustomerSessionStore);
  private readonly destroyRef = inject(DestroyRef);

  private qrToken = '';
  private normalizedPhone = '';
  private hasAttemptedWithTicket = false;
  private resendTargetMs = 0;

  step: 'PHONE' | 'OTP' = 'PHONE';
  phone = '';
  otp = '';
  branchName = '';
  maskedPhone = '';
  loading = false;
  otpLocked = false;
  resendSeconds = 0;

  ngOnInit(): void {
    const navState = history.state as { qrToken?: string; table?: QrResolveResponse };
    if (!navState?.qrToken) {
      this.router.navigate(['/customer/scan']);
      return;
    }
    this.qrToken = navState.qrToken;
    this.branchName = navState.table?.branchName ?? '';
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.tickResend());
  }

  submitPhone(): void {
    const normalized = normalizeVnPhone(this.phone);
    if (normalized.length === 0) {
      this.message.warning('Vui lòng nhập số điện thoại.');
      return;
    }
    if (!VN_PHONE_REGEX.test(normalized)) {
      this.message.warning('Số điện thoại không hợp lệ.');
      return;
    }
    this.normalizedPhone = normalized;
    this.hasAttemptedWithTicket = false;
    this.startSession('');
  }

  submitOtp(): void {
    const code = this.otp.trim();
    if (code.length === 0) {
      this.message.warning('Vui lòng nhập mã OTP.');
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    this.otpService.verifyOtp({ qrToken: this.qrToken, customerPhone: this.normalizedPhone, otpCode: code }).subscribe({
      next: result => {
        this.hasAttemptedWithTicket = true;
        this.startSession(result.otpTicket);
      },
      error: error => {
        this.loading = false;
        if (extractErrorCode(error) === OTP_TOO_MANY_ATTEMPTS) {
          this.otpLocked = true;
        }
        this.message.error(customerErrorMessage(error));
        this.cdr.markForCheck();
      }
    });
  }

  resend(): void {
    if (this.resendSeconds > 0 || this.otpLocked) {
      return;
    }
    this.requestOtp(true);
  }

  backToPhone(): void {
    this.step = 'PHONE';
    this.otp = '';
    this.otpLocked = false;
    this.hasAttemptedWithTicket = false;
    this.cdr.markForCheck();
  }

  private startSession(otpTicket: string): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.qrService.startSession({ qrToken: this.qrToken, customerPhone: this.normalizedPhone, otpTicket }).subscribe({
      next: response => {
        this.loading = false;
        this.onSessionStarted(response);
      },
      error: error => {
        this.loading = false;
        this.handleStartError(error);
      }
    });
  }

  private onSessionStarted(response: QrSessionResponse): void {
    this.sessionStore.save(response, this.branchName);
    this.router.navigate(['/customer/session']);
  }

  private handleStartError(error: unknown): void {
    if (extractErrorCode(error) === OTP_TICKET_INVALID) {
      if (this.hasAttemptedWithTicket) {
        this.message.error('Xác thực đã hết hạn. Vui lòng nhập lại số điện thoại.');
        this.backToPhone();
      } else {
        this.goToOtpStep();
      }
      return;
    }
    this.message.error(customerErrorMessage(error));
    this.cdr.markForCheck();
  }

  private goToOtpStep(): void {
    this.step = 'OTP';
    this.otp = '';
    this.otpLocked = false;
    this.cdr.markForCheck();
    this.requestOtp(false);
  }

  private requestOtp(isResend: boolean): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.otpService.requestOtp({ qrToken: this.qrToken, customerPhone: this.normalizedPhone }).subscribe({
      next: response => {
        this.loading = false;
        this.maskedPhone = response.maskedPhone;
        this.setResendTarget(response.resendAvailableAt);
        if (isResend) {
          this.message.success('Đã gửi lại mã OTP.');
        }
        this.cdr.markForCheck();
      },
      error: error => {
        this.loading = false;
        this.message.error(customerErrorMessage(error));
        this.cdr.markForCheck();
      }
    });
  }

  private setResendTarget(resendAvailableAt: string): void {
    const target = new Date(resendAvailableAt).getTime();
    this.resendTargetMs = Number.isFinite(target) ? target : 0;
    this.resendSeconds = Math.max(0, Math.ceil((this.resendTargetMs - Date.now()) / 1000));
  }

  private tickResend(): void {
    const remaining = Math.max(0, Math.ceil((this.resendTargetMs - Date.now()) / 1000));
    if (remaining !== this.resendSeconds) {
      this.resendSeconds = remaining;
      this.cdr.markForCheck();
    }
  }
}
