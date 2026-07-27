import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-license',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  template: `
    <div style="padding: 24px;">
      <nz-card>
        <h2 nz-typography>Quản lý License</h2>
        <p nz-typography>Quản lý giấy phép và đăng ký dịch vụ</p>
      </nz-card>
    </div>
  `
})
export class LicenseComponent {}
