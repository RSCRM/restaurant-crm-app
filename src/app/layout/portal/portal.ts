import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { I18nPipe, SettingsService, MenuService } from '@delon/theme';
import { LayoutDefaultModule, LayoutDefaultOptions } from '@delon/theme/layout-default';
import { Store } from '@ngrx/store';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import { AuthActions } from '../../routes/auth/store/auth.actions';
import { selectAuthUser, selectHasContext } from '../../routes/auth/store/auth.selectors';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [
    AsyncPipe,
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
export class LayoutPortal implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private settingsService = inject(SettingsService);
  private menuService = inject(MenuService);

  user$ = this.store.select(selectAuthUser);
  hasContext$ = this.store.select(selectHasContext);
  notificationCount = 0;

  protected options: LayoutDefaultOptions = {
    logoExpanded: `./assets/logo-full.svg`,
    logoCollapsed: `./assets/logo.svg`,
    logoLink: '/portal/context-select'
  };

  constructor() {
    this.settingsService.setUser({ name: 'User', avatar: '' });
  }

  ngOnInit(): void {
    this.store.select(selectHasContext).subscribe(hasContext => {
      this.buildMenu(hasContext);
    });
  }

  private buildMenu(hasContext: boolean): void {
    this.menuService.clear();
    this.menuService.add([
      {
        text: 'Tổ chức',
        i18n: 'menu.context.group',
        group: true,
        hideInBreadcrumb: true,
        children: [
          { text: 'Chọn tổ chức', i18n: 'menu.context.select', link: '/portal/context-select' }
        ]
      },
      {
        text: 'Quản lý nhà hàng',
        i18n: 'menu.portal.group',
        group: true,
        hideInBreadcrumb: true,
        children: [
          { text: 'Dashboard', i18n: 'menu.portal.dashboard', link: '/portal/dashboard', disabled: !hasContext },
          { text: 'Chi nhánh', i18n: 'branch.title', icon: 'fork', link: '/portal/branch', disabled: !hasContext },
          { text: 'Quản lý Đơn hàng', i18n: 'menu.portal.order', link: '/portal/order', disabled: !hasContext },
          { text: 'Quản lý Thực đơn', i18n: 'menu.portal.menu', link: '/portal/menu', disabled: !hasContext },
          { text: 'Quản lý Bàn', i18n: 'menu.portal.table', link: '/portal/table', disabled: !hasContext },
          { text: 'Đặt bàn', i18n: 'menu.portal.booking', link: '/portal/booking', disabled: !hasContext },
          { text: 'Kho hàng', i18n: 'menu.portal.inventory', link: '/portal/inventory', disabled: !hasContext },
          { text: 'Nhân viên', i18n: 'menu.portal.employee', link: '/portal/employee', disabled: !hasContext },
          { text: 'Hóa đơn', i18n: 'menu.portal.invoice', link: '/portal/invoice', disabled: !hasContext }
        ]
      }
    ]);
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
