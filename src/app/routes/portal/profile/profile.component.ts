import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PageHeaderModule } from '@delon/abc/page-header';
import { SVModule } from '@delon/abc/sv';
import { ALAIN_I18N_TOKEN, I18nPipe } from '@delon/theme';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { catchError, EMPTY, finalize } from 'rxjs';

import { UserProfileResponse, UserStatus } from './profile.model';
import { ProfileService } from './profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    PageHeaderModule,
    SVModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzTagModule,
    NzAvatarModule,
    NzAlertModule,
    I18nPipe
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.less'
})
export class ProfileComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly message = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(ALAIN_I18N_TOKEN);

  profile: UserProfileResponse | null = null;
  loading = true;
  errorMsg: string | null = null;
  editing = false;
  fullName = '';
  phone = '';

  ngOnInit(): void {
    this.i18n.change.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    this.profileService
      .getMyInfo()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.errorMsg = this.i18n.fanyi('profile.load-failed');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(data => {
        this.profile = data;
        this.fullName = data.fullName ?? '';
        this.phone = data.phone ?? '';
        this.cdr.markForCheck();
      });
  }

  save(): void {
    this.loading = true;
    this.errorMsg = null;
    this.profileService
      .updateMyInfo({ fullName: this.fullName || null, phone: this.phone || null })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.errorMsg = this.i18n.fanyi('profile.update-failed');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(profile => {
        this.profile = profile;
        this.editing = false;
        this.message.success(this.i18n.fanyi('profile.update-success'));
        this.cdr.markForCheck();
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
    return `status.${status.toLowerCase()}`;
  }

  translateCode(namespace: 'role' | 'permission', code: string): string {
    const key = `${namespace}.${code}`;
    const translated = this.i18n.fanyi(key);
    return translated === key ? code : translated;
  }
}
