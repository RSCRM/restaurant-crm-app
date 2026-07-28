import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent {}
