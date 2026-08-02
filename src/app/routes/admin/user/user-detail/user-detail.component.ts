import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { PageHeaderModule } from '@delon/abc/page-header';
import { I18nPipe } from '@delon/theme';
import { catchError, EMPTY, finalize } from 'rxjs';

import { UserService } from '../user.service';
import { UserResponse } from '../user.model';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    PageHeaderModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzDescriptionsModule,
    NzSpinModule,
    I18nPipe
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.less'
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  user: UserResponse | null = null;
  loading = true;

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id') || '';
    this.loadUser(userId);
  }

  private loadUser(id: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.userService.getUserById(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.user = null;
        return EMPTY;
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe((res: UserResponse) => {
      this.user = res;
      this.cdr.markForCheck();
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'BLOCKED': return 'warning';
      case 'DELETED': return 'error';
      default: return 'default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'app.user.status.active';
      case 'BLOCKED': return 'app.user.status.blocked';
      case 'DELETED': return 'app.user.status.deleted';
      default: return status;
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/user']);
  }
}
