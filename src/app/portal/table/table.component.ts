import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  template: `
    <div style="padding: 24px;">
      <nz-card>
        <h2 nz-typography>Quản lý Bàn</h2>
        <p nz-typography>Sơ đồ bàn và trạng thái</p>
      </nz-card>
    </div>
  `
})
export class TableComponent {}
