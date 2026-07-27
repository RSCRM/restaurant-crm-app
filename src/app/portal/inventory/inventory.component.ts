import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  template: `
    <div style="padding: 24px;">
      <nz-card>
        <h2 nz-typography>Kho hàng</h2>
        <p nz-typography>Quản lý nguyên liệu và tồn kho</p>
      </nz-card>
    </div>
  `
})
export class InventoryComponent {}
