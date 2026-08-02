import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { AvailableTable, RegisterGuestRequest } from './table.model';
import { TableService } from './table.service';

@Component({
  selector: 'app-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzSpinModule,
    I18nPipe
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.less'
})
export class TableComponent implements OnInit {
  private readonly tableService = inject(TableService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  saving = false;
  modalVisible = false;
  tables: AvailableTable[] = [];
  selectedTable: AvailableTable | null = null;
  form: RegisterGuestRequest = { tableId: '', guestName: '', partySize: 1 };

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables(): void {
    this.loading = true;
    this.tableService.getAvailableTables().subscribe({
      next: tables => {
        this.tables = tables;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('Không thể tải danh sách bàn trống');
        this.cdr.markForCheck();
      }
    });
  }

  openRegistration(table: AvailableTable): void {
    this.selectedTable = table;
    this.form = { tableId: table.id, guestName: '', partySize: 1 };
    this.modalVisible = true;
  }

  submit(): void {
    const guestName = this.form.guestName.trim();
    const phone = this.form.guestPhone?.trim();
    if (!guestName || this.form.partySize < 1 || this.form.partySize > (this.selectedTable?.capacity ?? 0)) {
      this.message.warning('Vui lòng nhập đủ thông tin và đúng số lượng khách');
      return;
    }
    if (phone && !/^\d{9,15}$/.test(phone)) {
      this.message.warning('Số điện thoại phải có từ 9 đến 15 chữ số');
      return;
    }

    this.saving = true;
    this.tableService.registerGuest({ ...this.form, guestName, guestPhone: phone || undefined }).subscribe({
      next: () => {
        this.saving = false;
        this.modalVisible = false;
        this.message.success('Đăng ký khách vào bàn thành công');
        this.loadTables();
      },
      error: error => {
        this.saving = false;
        this.message.error(error?.error?.errorMessage?.message ?? 'Không thể đăng ký khách vào bàn');
        this.cdr.markForCheck();
      }
    });
  }
}
