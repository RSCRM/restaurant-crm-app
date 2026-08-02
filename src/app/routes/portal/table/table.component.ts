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

import { TableItem } from './table.model';
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
  transferring = false;
  occupiedTables: TableItem[] = [];
  availableTables: TableItem[] = [];
  sourceTableId: string | null = null;
  targetTableId: string | null = null;

  ngOnInit(): void {
    this.loadOptions();
  }

  loadOptions(): void {
    this.loading = true;
    this.tableService.getTransferOptions().subscribe({
      next: options => {
        this.occupiedTables = options.occupied;
        this.availableTables = options.available;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('Không thể tải danh sách bàn');
        this.cdr.markForCheck();
      }
    });
  }

  confirmTransfer(): void {
    if (!this.sourceTableId || !this.targetTableId) {
      this.message.warning('Vui lòng chọn bàn nguồn và bàn đích');
      return;
    }
    const source = this.occupiedTables.find(table => table.id === this.sourceTableId)?.tableNumber;
    const target = this.availableTables.find(table => table.id === this.targetTableId)?.tableNumber;
    this.modal.confirm({
      nzTitle: 'Xác nhận chuyển bàn',
      nzContent: `Chuyển khách từ bàn ${source} sang bàn ${target}?`,
      nzOnOk: () => this.transfer()
    });
  }

  private async transfer(): Promise<void> {
    this.transferring = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.tableService.transfer(this.sourceTableId!, this.targetTableId!));
      this.sourceTableId = null;
      this.targetTableId = null;
      this.message.success('Chuyển bàn thành công');
      this.loadOptions();
    } catch (error: unknown) {
      const detail = (error as { error?: { errorMessage?: { message?: string } } }).error?.errorMessage?.message;
      this.message.error(detail ?? 'Không thể chuyển bàn');
    } finally {
      this.transferring = false;
      this.cdr.markForCheck();
    }
  }
}
