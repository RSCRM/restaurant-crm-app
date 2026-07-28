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

import { AuthActions } from '../../routes/auth/store/auth.actions';
import { selectAuthUser } from '../../routes/auth/store/auth.selectors';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterOutlet,
    LayoutDefaultModule,
    NzIconModule,
    NzDropDownModule,
    NzMenuModule,
    NzAvatarModule,
    I18nPipe
  ],
  templateUrl: './admin.component.html'
})
export class LayoutAdmin {
  private store = inject(Store);
  private router = inject(Router);
  private settingsService = inject(SettingsService);
  private menuService = inject(MenuService);

  user$ = this.store.select(selectAuthUser);

  protected options: LayoutDefaultOptions = {
    logoExpanded: `./assets/logo-full.svg`,
    logoCollapsed: `./assets/logo.svg`
  };

  constructor() {
    this.settingsService.setUser({ name: 'Admin', avatar: '' });
    this.menuService.add([
      {
        text: 'Admin',
        group: true,
        hideInBreadcrumb: true,
        children: [
          { text: 'Dashboard', i18n: 'menu.dashboard', icon: 'dashboard', link: '/admin/dashboard' },
          { text: 'Quản lý License', icon: 'safety-certificate', link: '/admin/license' },
          { text: 'Quản lý Tổ chức', icon: 'bank', link: '/admin/organization' },
          { text: 'Quản lý Người dùng', icon: 'team', link: '/admin/user' }
        ]
      }
    ]);
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
