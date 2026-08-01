import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { I18nPipe } from '@delon/theme';

@Component({
  selector: 'app-portal-dashboard',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule, NzStatisticModule, NzGridModule, I18nPipe],
  templateUrl: './portal-dashboard.component.html',
  styleUrl: './portal-dashboard.component.less'
})
export class PortalDashboardComponent {}
