import { Component } from '@angular/core';
import { I18nPipe } from '@delon/theme';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'app-portal-dashboard',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule, NzStatisticModule, NzGridModule, I18nPipe],
  templateUrl: './portal-dashboard.component.html'
})
export class PortalDashboardComponent {}
