import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { TableAreaMap } from './table.model';
import { TableService } from './table.service';

@Component({
  selector: 'app-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzButtonModule, NzCardModule, NzEmptyModule, NzSelectModule, NzSpinModule, NzTagModule, I18nPipe],
  templateUrl: './table.component.html',
  styleUrl: './table.component.less'
})
export class TableComponent implements OnInit {
  private readonly tableService = inject(TableService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  selectedAreaId: string | null = null;
  areas: TableAreaMap[] = [];

  ngOnInit(): void {
    this.loadMap();
  }

  loadMap(): void {
    this.loading = true;
    this.tableService.getMap(this.selectedAreaId ?? undefined).subscribe({
      next: map => {
        this.areas = map.areas;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('Không thể tải sơ đồ bàn');
        this.cdr.markForCheck();
      }
    });
  }

  statusColor(status: string): string {
    return status === 'AVAILABLE' ? 'green' : status === 'OCCUPIED' ? 'red' : 'gold';
  }
}
