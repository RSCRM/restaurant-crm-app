import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { I18nPipe, SettingsService, MenuService } from '@delon/theme';
import { LayoutDefaultModule, LayoutDefaultOptions } from '@delon/theme/layout-default';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';

import { AuthActions } from '../../routes/auth/store/auth.actions';
import { selectAuthUser } from '../../routes/auth/store/auth.selectors';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterOutlet,
    LayoutDefaultModule,
    NzIconModule,
    NzDropDownModule,
    NzMenuModule,
    NzAvatarModule,
    NzBadgeModule,
    I18nPipe
  ],
  template: `
    <layout-default [options]="options" [asideUser]="asideUserTpl" [content]="contentTpl" [customError]="null">
      <layout-default-header-item direction="right">
        <div class="alain-default__nav-item">
          <nz-badge [nzCount]="notificationCount" nzSize="small">
            <span nz-icon nzType="bell" nzTheme="outline"></span>
          </nz-badge>
        </div>
      </layout-default-header-item>
      <layout-default-header-item direction="right">
        <div class="alain-default__nav-item" nz-dropdown [nzDropdownMenu]="userMenu" nzPlacement="bottomRight">
          <nz-avatar [nzSrc]="(user$ | async)?.avatar || ''" nzSize="small" class="alain-default__nav-item-avatar"></nz-avatar>
          <span class="alain-default__nav-item-text">{{ (user$ | async)?.fullName || 'User' }}</span>
        </div>
        <nz-dropdown-menu #userMenu="nzDropdownMenu">
          <ul nz-menu>
            <li nz-menu-item (click)="logout()">{{ 'menu.account.logout' | i18n }}</li>
          </ul>
        </nz-dropdown-menu>
      </layout-default-header-item>
      <ng-template #asideUserTpl>
        <div class="alain-default__aside-user">
          <nz-avatar class="alain-default__aside-user-avatar" [nzSrc]="(user$ | async)?.avatar || ''" />
          <div class="alain-default__aside-user-info">
            <strong>{{ (user$ | async)?.fullName || 'User' }}</strong>
          </div>
        </div>
      </ng-template>
      <ng-template #contentTpl>
        <router-outlet />
      </ng-template>
    </layout-default>
  `
})
export class LayoutPortal {
  private store = inject(Store);
  private router = inject(Router);
  private settingsService = inject(SettingsService);
  private menuService = inject(MenuService);

  user$ = this.store.select(selectAuthUser);
  notificationCount = 0;

  protected options: LayoutDefaultOptions = {
    logoExpanded: `./assets/logo-full.svg`,
    logoCollapsed: `./assets/logo.svg`
  };

  constructor() {
    this.settingsService.setUser({ name: 'User', avatar: '' });
    this.buildMenu();
  }

  private buildMenu(): void {
    const menuItems = [
      { text: 'Dashboard', i18n: 'menu.dashboard', icon: 'dashboard', link: '/portal/dashboard' },
      { text: 'Quản lý Đơn hàng', icon: 'shopping-cart', link: '/portal/order' },
      { text: 'Quản lý Thực đơn', icon: 'coffee', link: '/portal/menu' },
      { text: 'Quản lý Bàn', icon: 'table', link: '/portal/table' },
      { text: 'Đặt bàn', icon: 'calendar', link: '/portal/booking' },
      { text: 'Kho hàng', icon: 'database', link: '/portal/inventory' },
      { text: 'Nhân viên', icon: 'team', link: '/portal/employee' },
      { text: 'Hóa đơn', icon: 'file-text', link: '/portal/invoice' }
    ];

    this.menuService.add([
      {
        text: 'Quản lý nhà hàng',
        group: true,
        hideInBreadcrumb: true,
        children: menuItems
      }
    ]);
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
