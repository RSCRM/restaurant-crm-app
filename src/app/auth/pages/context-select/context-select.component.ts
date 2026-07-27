import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

import { AuthActions } from '../../store/auth.actions';
import { selectAuthLoading, selectContexts } from '../../store/auth.selectors';
import { ContextInfo } from '../../store/auth.state';

@Component({
  selector: 'app-context-select',
  standalone: true,
  imports: [AsyncPipe, NzCardModule, NzListModule, NzButtonModule, NzTagModule, NzTypographyModule],
  templateUrl: './context-select.component.html',
  styleUrl: './context-select.component.less'
})
export class ContextSelectComponent {
  private store = inject(Store);

  contexts$ = this.store.select(selectContexts);
  loading$ = this.store.select(selectAuthLoading);

  selectContext(context: ContextInfo): void {
    this.store.dispatch(AuthActions.selectContext({
      organizationId: context.organizationId,
      employeeId: context.employeeId ?? undefined,
      role: context.role
    }));
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
