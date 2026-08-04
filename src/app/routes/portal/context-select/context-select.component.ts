import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { PageHeaderModule } from '@delon/abc/page-header';
import { Store } from '@ngrx/store';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { map } from 'rxjs';

import { I18nPipe } from '@delon/theme';
import { AuthActions } from '../../auth/store/auth.actions';
import { selectAuthLoading, selectContexts } from '../../auth/store/auth.selectors';
import { ContextInfo } from '../../auth/store/auth.state';

@Component({
  selector: 'app-context-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    NzCardModule,
    NzButtonModule,
    NzTagModule,
    NzTypographyModule,
    NzIconModule,
    NzSpinModule,
    NzEmptyModule,
    PageHeaderModule,
    I18nPipe
  ],
  templateUrl: './context-select.component.html',
  styleUrl: './context-select.component.less'
})
export class ContextSelectComponent implements OnInit {
  private store = inject(Store);
  private cdr = inject(ChangeDetectorRef);

  contexts$ = this.store.select(selectContexts).pipe(map(contexts => contexts));
  loading$ = this.store.select(selectAuthLoading);

  ngOnInit(): void {
    this.cdr.markForCheck();
  }

  selectContext(context: ContextInfo): void {
    this.store.dispatch(
      AuthActions.selectContext({
        organizationId: context.organizationId,
        employeeId: context.employeeId ?? undefined,
        branchId: context.branchId,
        role: context.role
      })
    );
  }
}
