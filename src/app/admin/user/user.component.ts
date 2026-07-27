import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  template: `
    <div style="padding: 24px;">
      <nz-card>
        <h2 nz-typography>Quản lý Người dùng</h2>
        <p nz-typography>Quản lý tài khoản và phân quyền người dùng</p>
      </nz-card>
    </div>
  `
})
export class UserComponent {}
