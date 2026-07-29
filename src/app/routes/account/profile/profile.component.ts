import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { PageHeaderModule } from '@delon/abc/page-header';
import { SVModule } from '@delon/abc/sv';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { UserProfileResponse, UserStatus } from './profile.model';
import { ProfileService } from './profile.service';

interface ProfileApiError {
  errorMessage?: {
    message?: string;
  };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, PageHeaderModule, SVModule, NzCardModule, NzButtonModule, NzIconModule, NzTagModule, NzAvatarModule, NzAlertModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.less'
})
export class ProfileComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly cdr = inject(ChangeDetectorRef);

  profile: UserProfileResponse | null = null;
  loading = true;
  errorMsg: string | null = null;

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    this.profileService.getMyInfo().subscribe({
      next: data => {
        this.profile = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        const apiError = error.error as ProfileApiError | null;
        this.errorMsg = apiError?.errorMessage?.message ?? 'Không thể tải thông tin cá nhân';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getStatusColor(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'success';
      case UserStatus.INACTIVE:
        return 'warning';
      case UserStatus.LOCKED:
        return 'error';
      case UserStatus.PENDING:
        return 'processing';
    }
  }

  getStatusText(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'Hoạt động';
      case UserStatus.INACTIVE:
        return 'Ngừng hoạt động';
      case UserStatus.LOCKED:
        return 'Tài khoản bị khóa';
      case UserStatus.PENDING:
        return 'Chờ kích hoạt';
    }
  }
}
