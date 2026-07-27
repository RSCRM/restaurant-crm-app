import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  template: `
    <div style="padding: 24px;">
      <nz-card>
        <h2 nz-typography>Quản lý Thực đơn</h2>
        <p nz-typography>Quản lý sản phẩm, combo và nhóm tùy chỉnh</p>
      </nz-card>
    </div>
  `
})
export class MenuComponent {}
