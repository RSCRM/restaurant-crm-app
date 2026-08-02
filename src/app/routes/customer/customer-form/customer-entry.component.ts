import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CustomerService } from '../customer.service';
import { CustomerResponse } from '../customer.model';

@Component({
  selector: 'app-customer-entry',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzInputModule, NzButtonModule],
  templateUrl: './customer-entry.component.html',
  styleUrls: ['./customer-entry.component.less']
})
export class CustomerEntryComponent implements OnInit {
  private customerService = inject(CustomerService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  step: 'ENTER_PHONE' | 'ENTER_OTP' = 'ENTER_PHONE';
  phone = '';
  otp = '';
  branchId = '';
  tableId = '';
  loading = false;

  ngOnInit(): void {
    // 1. Kiểm tra nếu đã có Session cũ ➔ Chuyển thẳng tới Order
    const existingSession = this.customerService.getSession();
    if (existingSession) {
      this.goToOrderMenu();
      return;
    }

    // 2. Lấy token QR từ URL (Vd: /public/qr-order?token=xxx)
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      const payload = this.customerService.decodeQrToken(token);
      if (payload) {
        this.branchId = payload.branchId;
        this.tableId = payload.tableId;
      }
    }
  }

  // Regex validate SĐT Việt Nam: 10 chữ số, đầu 03, 05, 07, 08, 09 hoặc +84
  private readonly VN_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/;

  // Bước 1: Check SĐT
  onCheckPhone(): void {
    const rawPhone = this.phone.trim();
    if (!rawPhone || !this.VN_PHONE_REGEX.test(rawPhone)) {
      this.message.warning('Vui lòng nhập số điện thoại Việt Nam hợp lệ (vd: 0901234567 hoặc +84901234567)!');
      return;
    }

    this.loading = true;
    this.customerService.checkPhone({ phone: rawPhone, branchId: this.branchId }).subscribe({
      next: (res) => {
        this.loading = false;
        
        if (res.exists && res.customer) {
          // 👉 KHÁCH CŨ: Lưu Session & Nhảy thẳng xuống Menu Order!
          this.customerService.saveSession(res.customer);
          this.message.success(`Chào mừng ${res.customer.fullName || 'quý khách'} quay lại!`);
          this.goToOrderMenu();
        } else {
          // 👉 KHÁCH MỚI: Tự động gửi OTP & Chuyển sang Step nhập OTP!
          this.sendOtpAndGoToOtpStep();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('Lỗi khi kiểm tra SĐT.');
        this.cdr.markForCheck();
      }
    });
  }

  private sendOtpAndGoToOtpStep(): void {
    this.customerService.sendOtp(this.phone.trim()).subscribe({
      next: () => {
        this.step = 'ENTER_OTP';
        this.message.info('Đã gửi mã OTP xác nhận SĐT mới.');
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Không thể gửi mã OTP.');
        this.cdr.markForCheck();
      }
    });
  }

  // Bước 2: Verify OTP cho Khách mới
  onVerifyOtp(): void {
    if (!this.otp || this.otp.trim().length === 0) {
      this.message.warning('Vui lòng nhập mã OTP!');
      return;
    }

    this.loading = true;
    this.customerService.verifyAndCreate({
      phone: this.phone.trim(),
      otp: this.otp.trim(),
      branchId: this.branchId
    }).subscribe({
      next: (newCustomer) => {
        this.loading = false;
        this.message.success('Xác thực thành công! Đã tạo tài khoản tích điểm.');
        // 👉 Đã verify & save customer thành công ➔ Nhảy xuống Menu Order!
        this.goToOrderMenu();
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err?.error?.errorMessage || 'Mã OTP không đúng!');
        this.cdr.markForCheck();
      }
    });
  }

  private goToOrderMenu(): void {
    this.router.navigate(['/public/qr-order/menu'], {
      queryParamsHandling: 'preserve' // Giữ lại token bàn trên URL
    });
  }
}