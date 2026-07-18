import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzResultModule } from 'ng-zorro-antd/result';

@Component({
  selector: 'app-dashboard-welcome',
  templateUrl: './welcome.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...SHARED_IMPORTS, NzCardModule, NzResultModule, NzButtonModule]
})
export class DashboardWelcomeComponent {}
