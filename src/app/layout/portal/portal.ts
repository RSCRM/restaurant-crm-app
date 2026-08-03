import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { I18nPipe, SettingsService, MenuService } from '@delon/theme';
import { LayoutDefaultModule, LayoutDefaultOptions } from '@delon/theme/layout-default';
import { Store } from '@ngrx/store';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Subscription } from 'rxjs';

import { AuthActions } from '../../routes/auth/store/auth.actions';
import { selectAuthUser, selectContextToken, selectHasContext } from '../../routes/auth/store/auth.selectors';
import { NotificationResponse, NotificationStatus } from '../../routes/portal/notification/notification.model';
import { NotificationService } from '../../routes/portal/notification/notification.service';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AsyncPipe,
    DatePipe,
    RouterLink,
    RouterOutlet,
    LayoutDefaultModule,
    NzIconModule,
    NzDropdownModule,
    NzMenuModule,
    NzAvatarModule,
    NzBadgeModule,
    NzTagModule,
    NzButtonModule,
    NzCardModule,
    I18nPipe
  ],
  templateUrl: './portal.component.html'
})
export class LayoutPortal implements OnInit, OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private settingsService = inject(SettingsService);
  private menuService = inject(MenuService);
  private notificationService = inject(NotificationService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  user$ = this.store.select(selectAuthUser);
  hasContext$ = this.store.select(selectHasContext);

  notifications: NotificationResponse[] = [];
  notificationCount = 0;
  branchId: string | null = null;

  private sseSub: Subscription | null = null;
  private tokenSub: Subscription | null = null;

  protected options: LayoutDefaultOptions = {
    logoExpanded: `./assets/logo-full.svg`,
    logoCollapsed: `./assets/logo.svg`,
    logoLink: '/portal/context-select'
  };

  constructor() {
    this.settingsService.setUser({ name: 'User', avatar: '' });
  }

  private parseTokenPayload(token: string | null): Record<string, unknown> | null {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  ngOnInit(): void {
    this.tokenSub = this.store.select(selectContextToken).subscribe(token => {
      const payload = this.parseTokenPayload(token);
      if (payload) {
        this.branchId = (payload['branchId'] as string) || null;
        // Notifications loaded on-demand, not on context select
      }
    });

    this.store.select(selectHasContext).subscribe(hasContext => {
      this.buildMenu(hasContext);
    });
  }

  ngOnDestroy(): void {
    if (this.sseSub) {
      this.sseSub.unsubscribe();
    }
    if (this.tokenSub) {
      this.tokenSub.unsubscribe();
    }
  }

  private loadNotificationHistory(): void {
    if (!this.branchId) return;

    this.notificationService.getNotifications(this.branchId, { page: 1, size: 10 }).subscribe({
      next: res => {
        this.notifications = res.data;
        this.notificationCount = this.notifications.filter(n => n.status === 'UNREAD').length;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }

  private subscribeRealtimeNotifications(): void {
    if (!this.branchId) return;

    if (this.sseSub) {
      this.sseSub.unsubscribe();
    }

    this.sseSub = this.notificationService.subscribeBranchNotifications(this.branchId).subscribe({
      next: notif => {
        this.notifications = [notif, ...this.notifications];
        this.notificationCount += 1;
        this.message.info(`🔔 ${notif.content}`, { nzDuration: 6000 });
        this.cdr.markForCheck();
      }
    });
  }

  markAllAsRead(): void {
    this.notifications = this.notifications.map(n => ({ ...n, status: NotificationStatus.READ }));
    this.notificationCount = 0;
    this.cdr.markForCheck();
  }

  private buildMenu(hasContext: boolean): void {
    this.menuService.clear();
    this.menuService.add([
      {
        text: 'Tổ chức',
        i18n: 'menu.context.group',
        group: true,
        hideInBreadcrumb: true,
        children: [{ text: 'Chọn tổ chức', i18n: 'menu.context.select', link: '/portal/context-select' }]
      },
      {
        text: 'Quản lý nhà hàng',
        i18n: 'menu.portal.group',
        group: true,
        hideInBreadcrumb: true,
        children: [
          { text: 'Dashboard', i18n: 'menu.portal.dashboard', link: '/portal/dashboard', disabled: !hasContext },
          { text: 'Chi nhánh', i18n: 'branch.title', link: '/portal/branch', disabled: !hasContext },
          { text: 'Quản lý Đơn hàng', i18n: 'menu.portal.order', link: '/portal/order', disabled: !hasContext },
          { text: 'Quản lý Thực đơn', i18n: 'menu.portal.menu', link: '/portal/menu', disabled: !hasContext },
          { text: 'Quản lý Bàn', i18n: 'menu.portal.table', link: '/portal/table', disabled: !hasContext },
          { text: 'Đặt bàn', i18n: 'menu.portal.booking', link: '/portal/booking', disabled: !hasContext },
          { text: 'Kho hàng', i18n: 'menu.portal.inventory', link: '/portal/inventory', disabled: !hasContext },
          { text: 'Nhân viên', i18n: 'menu.portal.employee', link: '/portal/employee', disabled: !hasContext },
          { text: 'Hóa đơn', i18n: 'menu.portal.invoice', link: '/portal/invoice', disabled: !hasContext },
          { text: 'Khách hàng', i18n: 'menu.portal.customer', link: '/portal/customer', disabled: !hasContext },
          { text: 'Điểm danh', i18n: 'menu.attendance', link: '/portal/attendance', disabled: !hasContext },
          { text: 'Lịch làm việc', i18n: 'menu.schedule', link: '/portal/schedule', disabled: !hasContext }
        ]
      }
    ]);
  }

  logout(): void {
    if (this.sseSub) {
      this.sseSub.unsubscribe();
    }
    this.store.dispatch(AuthActions.logout());
  }
}
