import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  template: `
    <div style="padding: 24px;">
      <nz-card>
        <h2 nz-typography>Đặt bàn</h2>
        <p nz-typography>Quản lý đặt bàn và lịch sử</p>
      </nz-card>
    </div>
  `
})
export class BookingComponent {}
