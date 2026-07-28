import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  template: `
    <div style="padding: 24px;">
      <nz-card>
        <h2 nz-typography>Quản lý Tổ chức</h2>
        <p nz-typography>Quản lý tổ chức và chi nhánh</p>
      </nz-card>
    </div>
  `
})
export class OrganizationComponent {}
