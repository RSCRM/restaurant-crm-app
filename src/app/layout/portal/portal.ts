import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterOutlet } from '@angular/router';
import { I18nPipe, SettingsService, MenuService } from '@delon/theme';
import { LayoutDefaultModule, LayoutDefaultOptions } from '@delon/theme/layout-default';
import { Store } from '@ngrx/store';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { combineLatest } from 'rxjs';

import { AuthActions } from '../../routes/auth/store/auth.actions';
import { selectAuthUser, selectHasContext, selectPermissions } from '../../routes/auth/store/auth.selectors';
import { HeaderI18n } from '../basic/widgets/i18n';

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
    I18nPipe,
    HeaderI18n
  ],
  templateUrl: './portal.component.html'
})
export class LayoutPortal implements OnInit {
  private store = inject(Store);
  private settingsService = inject(SettingsService);
  private menuService = inject(MenuService);
  private destroyRef = inject(DestroyRef);

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
    combineLatest([this.store.select(selectHasContext), this.store.select(selectPermissions)])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([hasContext, permissions]) => this.buildMenu(hasContext, new Set(permissions)));
  }

  private buildMenu(hasContext: boolean, permissions: Set<string>): void {
    this.menuService.clear();
    this.menuService.add([
      {
        text: 'Organization',
        i18n: 'menu.organization',
        group: true,
        hideInBreadcrumb: true,
        children: [{ text: 'Select organization', i18n: 'menu.select-organization', icon: 'bank', link: '/portal/context-select' }]
      },
      {
        text: 'Restaurant management',
        i18n: 'menu.restaurant-management',
        group: true,
        hideInBreadcrumb: true,
        children: [
          { text: 'Dashboard', i18n: 'menu.dashboard', icon: 'dashboard', link: '/portal/dashboard', disabled: !hasContext },
          ...(permissions.has('ORDER_READ')
            ? [{ text: 'Order management', i18n: 'menu.order', icon: 'shopping-cart', link: '/portal/order' }]
            : []),
          ...(permissions.has('MENU_MANAGE') ? [{ text: 'Menu management', i18n: 'menu.menu', icon: 'coffee', link: '/portal/menu' }] : []),
          ...(permissions.has('TABLE_MANAGE') ? [{ text: 'Table management', i18n: 'menu.table', icon: 'table', link: '/portal/table' }] : []),
          ...(permissions.has('BOOKING_READ') ? [{ text: 'Bookings', i18n: 'menu.booking', icon: 'calendar', link: '/portal/booking' }] : []),
          ...(permissions.has('INGREDIENT_VIEW')
            ? [{ text: 'Inventory', i18n: 'menu.inventory', icon: 'database', link: '/portal/inventory' }]
            : []),
          ...(permissions.has('PROFILE_VIEW') ? [{ text: 'Employees', i18n: 'menu.employee', icon: 'team', link: '/portal/employee' }] : []),
          ...(permissions.has('PAYMENT_READ') ? [{ text: 'Invoices', i18n: 'menu.invoice', icon: 'file-text', link: '/portal/invoice' }] : []),
          ...(permissions.has('ATTENDANCE_SELF_READ') || permissions.has('ATTENDANCE_SELF_WRITE') || permissions.has('ATTENDANCE_QR_DISPLAY')
            ? [{ text: 'Attendance', i18n: 'menu.attendance', icon: 'clock-circle', link: '/portal/attendance' }]
            : [])
        ]
      }
    ]);
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
