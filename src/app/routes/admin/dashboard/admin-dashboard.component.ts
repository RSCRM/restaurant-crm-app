import { Component } from '@angular/core';
import { I18nPipe } from '@delon/theme';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule, I18nPipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.less'
})
export class AdminDashboardComponent {}
