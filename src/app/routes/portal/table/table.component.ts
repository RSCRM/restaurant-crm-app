import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { firstValueFrom } from 'rxjs';

import { OccupiedTable } from './table.model';
import { TableService } from './table.service';

@Component({
  selector: 'app-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzButtonModule, NzCardModule, NzSelectModule, NzSpinModule, I18nPipe],
  templateUrl: './table.component.html',
  styleUrl: './table.component.less'
})
export class TableComponent implements OnInit {
  private readonly tableService = inject(TableService);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  closing = false;
  tables: OccupiedTable[] = [];
  selectedTableId: string | null = null;

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables(): void {
    this.loading = true;
    this.tableService.getOccupiedTables().subscribe({
      next: tables => {
        this.tables = tables;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('Không thể tải danh sách bàn đang phục vụ');
        this.cdr.markForCheck();
      }
    });
  }

  confirmClose(): void {
    if (!this.selectedTableId) {
      this.message.warning('Vui lòng chọn bàn cần đóng');
      return;
    }
    const table = this.tables.find(item => item.id === this.selectedTableId);
    this.modal.confirm({
      nzTitle: 'Xác nhận đóng bàn',
      nzContent: `Kết thúc phục vụ bàn ${table?.tableNumber}? Bàn có hóa đơn chưa thanh toán sẽ không thể đóng.`,
      nzOkDanger: true,
      nzOnOk: () => this.closeTable()
    });
  }

  private async closeTable(): Promise<void> {
    this.closing = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.tableService.closeTable(this.selectedTableId!));
      this.selectedTableId = null;
      this.message.success('Đóng bàn thành công');
      this.loadTables();
    } catch (error: unknown) {
      const detail = (error as { error?: { errorMessage?: { message?: string } } }).error?.errorMessage?.message;
      this.message.error(detail ?? 'Không thể đóng bàn');
    } finally {
      this.closing = false;
      this.cdr.markForCheck();
    }
  }
}
