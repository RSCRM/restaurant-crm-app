import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { I18nPipe, SettingsService, MenuService } from '@delon/theme';
import { LayoutDefaultModule, LayoutDefaultOptions } from '@delon/theme/layout-default';
import { Store } from '@ngrx/store';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import { AuthActions } from '../../routes/auth/store/auth.actions';
import { selectAuthUser } from '../../routes/auth/store/auth.selectors';
import { HeaderI18n } from '../basic/widgets/i18n';

@Component({
  selector: 'app-admin-layout',
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
    I18nPipe,
    HeaderI18n
  ],
  templateUrl: './admin.component.html'
})
export class LayoutAdmin {
  private store = inject(Store);
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
    this.menuService.add([
      {
        text: 'Admin',
        group: true,
        hideInBreadcrumb: true,
        children: [
          { text: 'Dashboard', i18n: 'menu.dashboard', icon: 'dashboard', link: '/admin/dashboard' },
          { text: 'License management', i18n: 'menu.license', icon: 'safety-certificate', link: '/admin/license' },
          { text: 'Organization management', i18n: 'menu.organization-management', icon: 'bank', link: '/admin/organization' },
          { text: 'User management', i18n: 'menu.user', icon: 'team', link: '/admin/user' }
        ]
      }
    ]);
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
