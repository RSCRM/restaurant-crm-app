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

import { AuthActions } from '../../auth/store/auth.actions';
import { selectAuthUser } from '../../auth/store/auth.selectors';

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
  template: `
    <layout-default [options]="options" [asideUser]="asideUserTpl" [content]="contentTpl" [customError]="null">
      <layout-default-header-item direction="right">
        <div class="alain-default__nav-item" nz-dropdown [nzDropdownMenu]="userMenu" nzPlacement="bottomRight">
          <nz-avatar [nzSrc]="(user$ | async)?.avatar || ''" nzSize="small" class="alain-default__nav-item-avatar"></nz-avatar>
          <span class="alain-default__nav-item-text">{{ (user$ | async)?.fullName || 'Admin' }}</span>
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
            <strong>{{ (user$ | async)?.fullName || 'Admin' }}</strong>
          </div>
        </div>
      </ng-template>
      <ng-template #contentTpl>
        <router-outlet />
      </ng-template>
    </layout-default>
  `
})
export class AdminLayoutComponent {
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
