import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule],
  template: `
    <div style="padding: 24px;">
      <nz-card>
        <h2 nz-typography>Nhân viên</h2>
        <p nz-typography>Quản lý nhân viên và ca làm việc</p>
      </nz-card>
    </div>
  `
})
export class EmployeeComponent {}
