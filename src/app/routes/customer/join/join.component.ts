import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { customerErrorMessage } from '../customer-error';
import { CustomerQrService } from '../customer-qr.service';
import { CustomerSessionStore } from '../customer-session.store';

@Component({
  selector: 'app-customer-join',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzAlertModule, NzButtonModule, NzCardModule, NzSpinModule],
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.less']
})
export class JoinComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly qrService = inject(CustomerQrService);
  private readonly sessionStore = inject(CustomerSessionStore);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  errorText = '';

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const groupQrToken = params.get('gqr');
      if (!groupQrToken) {
        this.router.navigate(['/customer/scan']);
        return;
      }
      this.join(groupQrToken);
    });
  }

  rescan(): void {
    this.router.navigate(['/customer/scan']);
  }

  private join(groupQrToken: string): void {
    this.loading = true;
    this.errorText = '';
    this.cdr.markForCheck();
    this.qrService.joinSession({ groupQrToken }).subscribe({
      next: response => {
        this.sessionStore.save(response, '');
        this.router.navigate(['/customer/session']);
      },
      error: error => {
        this.loading = false;
        this.errorText = customerErrorMessage(error);
        this.cdr.markForCheck();
      }
    });
  }
}
