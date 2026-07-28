import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  template: `
    <div style="padding: 24px;">
      <nz-card>
        <h2 nz-typography>Quản lý Đơn hàng</h2>
        <p nz-typography>Danh sách và quản lý đơn hàng</p>
      </nz-card>
    </div>
  `
})
export class OrderComponent {}
