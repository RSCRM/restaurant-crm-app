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

import { OrganizationService } from '../organization.service';
import { OrganizationResponse } from '../organization.model';

@Component({
  selector: 'app-organization-detail',
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
  templateUrl: './organization-detail.component.html',
  styleUrl: './organization-detail.component.less'
})
export class OrganizationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orgService = inject(OrganizationService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  organization: OrganizationResponse | null = null;
  loading = true;

  ngOnInit(): void {
    const orgId = this.route.snapshot.paramMap.get('id') || '';
    this.loadOrganization(orgId);
  }

  private loadOrganization(id: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.orgService.getOrganizationById(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.organization = null;
        return EMPTY;
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe((res: OrganizationResponse) => {
      this.organization = res;
      this.cdr.markForCheck();
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'warning';
      case 'SUSPENDED': return 'error';
      default: return 'default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'app.organization.status.active';
      case 'INACTIVE': return 'app.organization.status.inactive';
      case 'SUSPENDED': return 'app.organization.status.suspended';
      default: return status;
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/organization']);
  }
}
