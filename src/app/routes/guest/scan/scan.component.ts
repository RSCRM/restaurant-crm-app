import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'app-scan',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTypographyModule
  ],
  templateUrl: './scan.component.html',
  styleUrls: ['./scan.component.less']
})
export class ScanComponent {
  private router = inject(Router);

  // Available sample tables matching SEED_DATA.sql
  readonly sampleTables = [
    {
      id: 't0000000-0000-0000-0000-000000000101',
      number: '101',
      branchId: 'e0000000-0000-0000-0000-000000000001',
      branchName: 'Chi nhánh Q1',
      capacity: 2
    },
    {
      id: 't0000000-0000-0000-0000-000000000102',
      number: '102',
      branchId: 'e0000000-0000-0000-0000-000000000001',
      branchName: 'Chi nhánh Q1',
      capacity: 4
    }
  ];

  simulateScan(tableId: string, branchId: string): void {
    this.router.navigate(['/guest/table', tableId], {
      queryParams: { branchId }
    });
  }
}
