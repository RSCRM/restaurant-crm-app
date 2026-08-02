import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import {
  InventoryTransactionResponse,
  CreateInventoryTransactionRequest,
  InventoryTransactionType,
  InventoryTransactionDirection,
  InventoryResponse,
  PagingResponse
} from '../inventory.model';
import { InventoryService } from '../inventory.service';

@Component({
  selector: 'app-inventory-transaction-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzSpinModule,
    NzGridModule,
    NzSelectModule
  ],
  templateUrl: './inventory-transaction-form.component.html',
  styleUrls: ['./inventory-transaction-form.component.less']
})
export class InventoryTransactionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private modalRef = inject(NzModalRef);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  loading = false;
  submitting = false;
  transaction: InventoryTransactionResponse | null = null;
  inventories: InventoryResponse[] = [];

  transactionTypes = Object.values(InventoryTransactionType);
  transactionDirections = Object.values(InventoryTransactionDirection);

  ngOnInit(): void {
    this.transaction = this.modalRef.getContentComponent()?.componentData || null;
    this.loadInventories();
    this.initForm();
  }

  private loadInventories(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.inventoryService.getInventories({ page: 1, size: 100 }).subscribe({
      next: (res: PagingResponse<InventoryResponse>) => {
        this.inventories = res.data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('Lỗi khi tải danh sách tồn kho.');
        this.cdr.markForCheck();
      }
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      inventoryId: ['', Validators.required],
      employeeId: ['', []],
      transactionType: ['PURCHASE', Validators.required],
      transactionDirection: ['IN', Validators.required],
      quantity: [0, [Validators.required, Validators.min(0.1)]],
      note: ['', []]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.submitting = true;
    this.cdr.markForCheck();

    const createRequest: CreateInventoryTransactionRequest = {
      inventoryId: this.form.value.inventoryId,
      employeeId: this.form.value.employeeId?.trim() || undefined,
      transactionType: this.form.value.transactionType,
      transactionDirection: this.form.value.transactionDirection,
      quantity: this.form.value.quantity,
      note: this.form.value.note?.trim() || undefined
    };

    this.inventoryService.createTransaction(createRequest).subscribe({
      next: () => {
        this.submitting = false;
        this.message.success('Tạo giao dịch tồn kho thành công!');
        this.modalRef.close(true);
      },
      error: err => {
        this.submitting = false;
        const msg = err?.error?.errorMessage?.message || err?.message || 'Lỗi khi tạo giao dịch.';
        this.message.error(msg);
        this.cdr.markForCheck();
      }
    });
  }

  cancel(): void {
    this.modalRef.close(null);
  }

  getTransactionTypeLabel(type: InventoryTransactionType): string {
    const labels: Record<InventoryTransactionType, string> = {
      PURCHASE: 'Mua hàng',
      SALE: 'Bán hàng',
      ADJUSTMENT: 'Điều chỉnh',
      WASTE: 'Hỏng/Lãng phí',
      RETURN: 'Trả lại'
    };
    return labels[type] || type;
  }

  getDirectionLabel(direction: InventoryTransactionDirection): string {
    const labels: Record<InventoryTransactionDirection, string> = {
      IN: 'Nhập',
      OUT: 'Xuất'
    };
    return labels[direction] || direction;
  }
}

