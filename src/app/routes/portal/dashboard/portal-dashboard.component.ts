import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';

@Component({
  selector: 'app-portal-dashboard',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule, NzStatisticModule, NzGridModule],
  templateUrl: './portal-dashboard.component.html'
})
export class PortalDashboardComponent {}
