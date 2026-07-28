import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  template: `
    <div style="padding: 24px;">
      <nz-card>
        <h2 nz-typography>Admin Dashboard</h2>
        <p nz-typography>Chào mừng đến với trang quản trị hệ thống Restaurant CRM</p>
      </nz-card>
    </div>
  `
})
export class AdminDashboardComponent {}
