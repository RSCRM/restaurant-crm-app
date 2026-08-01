import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { I18nPipe, MenuService, SettingsService } from '@delon/theme';
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
export class LayoutAdmin implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private settingsService = inject(SettingsService);
  private menuService = inject(MenuService);

  user$ = this.store.select(selectAuthUser);

  protected options: LayoutDefaultOptions = {
    logoExpanded: `./assets/logo-full.svg`,
    logoCollapsed: `./assets/logo.svg`,
    logoLink: '/admin/dashboard'
  };

  constructor() {
    this.settingsService.setUser({ name: 'Admin', avatar: '' });
  }

  ngOnInit(): void {
    this.buildMenu();
  }

  private buildMenu(): void {
    this.menuService.clear();
    this.menuService.add([
      {
        text: 'Admin',
        i18n: 'menu.admin.group',
        group: true,
        hideInBreadcrumb: true,
        children: [
          { text: 'Dashboard', i18n: 'menu.admin.dashboard', link: '/admin/dashboard' },
          { text: 'Quản lý License', i18n: 'menu.admin.license', link: '/admin/license' },
          { text: 'Quản lý Tổ chức', i18n: 'menu.admin.organization', link: '/admin/organization' },
          { text: 'Quản lý Người dùng', i18n: 'menu.admin.user', link: '/admin/user' }
        ]
      }
    ]);
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
