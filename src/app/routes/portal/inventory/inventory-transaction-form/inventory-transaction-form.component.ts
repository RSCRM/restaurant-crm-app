import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { EMPTY, catchError, finalize } from 'rxjs';

import { I18nPipe } from '@delon/theme';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ALAIN_I18N_TOKEN } from '@delon/theme';
import {
  CreateInventoryTransactionRequest,
  InventoryResponse,
  InventoryTransactionDirection,
  InventoryTransactionType
} from '../inventory.model';
import { InventoryService } from '../inventory.service';

@Component({
  selector: 'app-inventory-transaction-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzSpinModule,
    NzGridModule,
    NzSelectModule,
    I18nPipe
  ],
  templateUrl: './inventory-transaction-form.component.html',
  styleUrl: './inventory-transaction-form.component.less'
})
export class InventoryTransactionFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly inventoryService = inject(InventoryService);
  private readonly modalRef = inject(NzModalRef);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(ALAIN_I18N_TOKEN);
  loading = false;
  submitting = false;

  inventories: InventoryResponse[] = [];

  readonly transactionTypes = Object.values(InventoryTransactionType);
  readonly transactionDirections = Object.values(InventoryTransactionDirection);

  form = this.fb.group({
    inventoryId: this.fb.control('', Validators.required),
    transactionType: this.fb.control<InventoryTransactionType>(
      InventoryTransactionType.PURCHASE,
      Validators.required
    ),
    transactionDirection: this.fb.control<InventoryTransactionDirection>(
      InventoryTransactionDirection.IN,
      Validators.required
    ),
    quantity: this.fb.control(1, [
      Validators.required,
      Validators.min(0.001)
    ]),
    note: this.fb.control('')
  });

  ngOnInit(): void {
    this.loadInventories();
  }

  private loadInventories(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.inventoryService
      .getActiveInventories()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error(
            this.i18n.fanyi('app.inventory.transaction.createError')
          );
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(res => {
        this.inventories = res;
        this.cdr.markForCheck();
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.cdr.markForCheck();

    const raw = this.form.getRawValue();

    const request: CreateInventoryTransactionRequest = {
      inventoryId: raw.inventoryId,
      transactionType: raw.transactionType,
      transactionDirection: raw.transactionDirection,
      quantity: raw.quantity,
      note: raw.note.trim() || undefined
    };

    this.inventoryService
      .createTransaction(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error(
            this.i18n.fanyi('app.inventory.transaction.createError')
          );
          return EMPTY;
        }),
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success('app.inventory.transaction.createSuccess');
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }

  getTransactionTypeLabel(type: InventoryTransactionType): string {
    return `app.inventory.transaction.type.${type.toLowerCase()}`;
  }

  getDirectionLabel(direction: InventoryTransactionDirection): string {
    return `app.inventory.transaction.direction.${direction.toLowerCase()}`;
  }
}
