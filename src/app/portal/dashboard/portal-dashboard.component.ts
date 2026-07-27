import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';

@Component({
  selector: 'app-portal-dashboard',
  standalone: true,
  imports: [NzTypographyModule, NzCardModule, NzStatisticModule, NzGridModule],
  template: `
    <div style="padding: 24px;">
      <h2 nz-typography>Bảng điều khiển</h2>
      <div nz-row [nzGutter]="[16, 16]">
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic [nzValue]="0" nzTitle="Đơn hàng hôm nay" nzPrefix=""></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic [nzValue]="0" nzTitle="Doanh thu" nzPrefix="$"></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic [nzValue]="0" nzTitle="Đặt bàn"></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic [nzValue]="0" nzTitle="Khách hàng mới"></nz-statistic>
          </nz-card>
        </div>
      </div>
    </div>
  `
})
export class PortalDashboardComponent {}
