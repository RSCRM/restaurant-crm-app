import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { I18nPipe, SettingsService, MenuService } from '@delon/theme';
import { LayoutDefaultModule, LayoutDefaultOptions } from '@delon/theme/layout-default';
import { Store } from '@ngrx/store';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import { AuthActions } from '../../routes/auth/store/auth.actions';
import { selectAuthUser } from '../../routes/auth/store/auth.selectors';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    RouterOutlet,
    LayoutDefaultModule,
    NzIconModule,
    NzDropdownModule,
    NzMenuModule,
    NzAvatarModule,
    NzBadgeModule,
    I18nPipe
  ],
  templateUrl: './portal.component.html'
})
export class LayoutPortal {
  private store = inject(Store);
  private settingsService = inject(SettingsService);
  private menuService = inject(MenuService);

  user$ = this.store.select(selectAuthUser);
  notificationCount = 0;

  protected options: LayoutDefaultOptions = {
    logoExpanded: `./assets/logo-full.svg`,
    logoCollapsed: `./assets/logo.svg`,
    logoLink: '/portal/dashboard'
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
