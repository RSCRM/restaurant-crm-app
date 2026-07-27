import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  template: `
    <div style="padding: 24px;">
      <nz-card>
        <h2 nz-typography>Hóa đơn</h2>
        <p nz-typography>Quản lý hóa đơn và thanh toán</p>
      </nz-card>
    </div>
  `
})
export class InvoiceComponent {}
