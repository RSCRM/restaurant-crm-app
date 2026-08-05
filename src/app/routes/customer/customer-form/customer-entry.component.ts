import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { CustomerService } from '../customer.service';
import { QrResolveResponse } from '../customer.model';
import { GlassShatter, ShatterOptions } from './glass-shatter';

@Component({
  selector: 'app-customer-entry',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzInputModule, NzButtonModule, NzResultModule, NzSpinModule, NzStepsModule, NzIconModule],
  templateUrl: './customer-entry.component.html',
  styleUrls: ['./customer-entry.component.less']
})
export class CustomerEntryComponent implements OnInit, OnDestroy {
  // ★ TOGGLE: Set to false to completely disable the shatter effect
  private readonly ENABLE_SHATTER = true;

  private el = inject(ElementRef);
  private glassShatter: GlassShatter | null = null;
  private customerService = inject(CustomerService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  currentStep = 0; // 0=resolving, 1=enter phone, 2=enter OTP
  phone = '';
  otp = '';
  loading = false;
  qrToken = '';
  tableInfo: QrResolveResponse | null = null;
  maskedPhone = '';
  otpTicket = '';

  private readonly VN_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.customerService.clearSession();
      this.qrToken = token;
      this.customerService.saveQrToken(token);
      this.resolveQr();
      return;
    }

    if (this.customerService.hasSession()) {
      this.router.navigate(['/customer/menu']);
      return;
    }

    const savedToken = this.customerService.getQrToken();
    if (savedToken) {
      this.qrToken = savedToken;
      this.resolveQr();
    } else {
      this.currentStep = -1; // error
      this.cdr.markForCheck();
    }
  }

  private resolveQr(): void {
    this.loading = true;
    this.customerService.resolveQr({ qrToken: this.qrToken }).subscribe({
      next: res => {
        this.tableInfo = res;
        this.loading = false;
        if (res.hasActiveSession) {
          this.currentStep = 3;
          this.message.warning('Bàn này đang có phiên gọi món đang mở!');
        } else {
          this.currentStep = 1;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Mã QR không hợp lệ hoặc đã hết hạn!');
        this.currentStep = -1;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onRequestOtp(): void {
    const rawPhone = this.phone.trim();
    if (!rawPhone || !this.VN_PHONE_REGEX.test(rawPhone)) {
      this.message.warning('Vui lòng nhập SĐT Việt Nam hợp lệ (vd: 0901234567)');
      this.triggerShatter();
      return;
    }

    this.loading = true;
    this.customerService.requestOtp({ qrToken: this.qrToken, customerPhone: rawPhone }).subscribe({
      next: res => {
        // Valid phone — clean up shatter if active, restore elements
        this.glassShatter?.destroy();
        this.glassShatter = null;
        this.maskedPhone = res.maskedPhone;
        this.currentStep = 2;
        this.loading = false;
        this.message.success(`Đã gửi mã OTP đến ${res.maskedPhone}`);
        this.cdr.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.message.error(err?.error?.errorMessage || 'Không thể gửi OTP. Vui lòng thử lại!');
        this.cdr.markForCheck();
      }
    });
  }

  onVerifyOtp(): void {
    if (!this.otp || this.otp.trim().length === 0) {
      this.message.warning('Vui lòng nhập mã OTP!');
      return;
    }

    this.loading = true;
    this.customerService.verifyOtp({
      qrToken: this.qrToken,
      customerPhone: this.phone.trim(),
      otpCode: this.otp.trim()
    }).subscribe({
      next: res => {
        this.otpTicket = res.otpTicket;
        this.createSession();
      },
      error: err => {
        this.loading = false;
        this.message.error(err?.error?.errorMessage || 'Mã OTP không đúng!');
        this.cdr.markForCheck();
      }
    });
  }

  private createSession(): void {
    this.customerService.startSession({
      qrToken: this.qrToken,
      customerPhone: this.phone.trim(),
      otpTicket: this.otpTicket
    }).subscribe({
      next: () => {
        this.loading = false;
        this.message.success('Xác thực thành công! Chuyển đến thực đơn...');
        this.router.navigate(['/customer/menu']);
      },
      error: err => {
        this.loading = false;
        if (err?.status === 409 || err?.error?.errorCode === 'TQR_TABLE_SESSION_EXISTS') {
          this.message.error('Bàn ' + (this.tableInfo?.tableNumber || 'này') + ' đang có phiên gọi món chưa đóng. Vui lòng chạy `docker exec -it redis-crm redis-cli flushall` để reset bàn!');
        } else {
          this.message.error(err?.error?.errorMessage || 'Không thể tạo phiên. Vui lòng thử lại!');
        }
        this.cdr.markForCheck();
      }
    });
  }

  goBackToPhone(): void {
    this.currentStep = 1;
    this.otp = '';
    this.cdr.markForCheck();
  }

  // ─── Glass Shatter Animation ────────────────────────────

  private triggerShatter(): void {
    if (!this.ENABLE_SHATTER) return;
    // Only shatter once — if already shattered, skip
    if (this.glassShatter) return;

    const container = this.el.nativeElement.querySelector('.customer-entry-container');
    if (!container) return;

    this.glassShatter = new GlassShatter(container, { excludeSelector: '.shatter-keep' });
    this.glassShatter.shatter();
    // No auto-reset — pieces stay fallen until valid phone is entered
  }

  ngOnDestroy(): void {
    this.glassShatter?.destroy();
  }
}