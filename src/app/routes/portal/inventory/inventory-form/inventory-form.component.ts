import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { catchError, EMPTY, finalize } from 'rxjs';

import { CreateInventoryRequest, InventoryCategoryResponse, InventoryResponse, UpdateInventoryRequest } from '../inventory.model';
import { InventoryService } from '../inventory.service';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzInputNumberModule, NzSelectModule, NzButtonModule, I18nPipe],
  templateUrl: './inventory-form.component.html',
  styleUrl: './inventory-form.component.less'
})
export class InventoryFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly modalRef = inject(NzModalRef);
  private readonly inventoryService = inject(InventoryService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly modalData = inject<InventoryResponse | null>(NZ_MODAL_DATA, { optional: true });

  loading = false;
  isEdit = false;

  categoryOptions: InventoryCategoryResponse[] = [];

  form = this.fb.group({
    inventoryName: this.fb.control('', [Validators.required, Validators.maxLength(255)]),
    inventoryCategoryId: this.fb.control('', Validators.required),
    unit: this.fb.control('', [Validators.required, Validators.maxLength(50)]),
    description: this.fb.control(''),
    minimumQuantity: this.fb.control(0, [Validators.required, Validators.min(0)])
  });

  ngOnInit(): void {
    this.loadCategories();

    if (!this.modalData) {
      return;
    }

    this.isEdit = true;

    this.form.patchValue({
      inventoryName: this.modalData.inventoryName,
      inventoryCategoryId: this.modalData.inventoryCategoryId,
      unit: this.modalData.unit,
      description: this.modalData.description ?? '',
      minimumQuantity: this.modalData.minimumQuantity
    });
  }

  private loadCategories(): void {
    this.inventoryService
      .getInventoryCategories({
        page: 1,
        size: 1000
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.categoryOptions = res.data;
        this.cdr.markForCheck();
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    const raw = this.form.getRawValue();

    if (this.isEdit && this.modalData) {
      const request: UpdateInventoryRequest = {
        inventoryCategoryId: raw.inventoryCategoryId,
        inventoryName: raw.inventoryName,
        unit: raw.unit,
        description: raw.description,
        minimumQuantity: raw.minimumQuantity
      };

      this.inventoryService
        .updateInventory(this.modalData.id, request)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError(() => {
            this.message.error('Update inventory failed');
            return EMPTY;
          }),
          finalize(() => {
            this.loading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe(() => {
          this.message.success('Inventory updated successfully');
          this.modalRef.destroy(true);
        });

      return;
    }

    const request: CreateInventoryRequest = {
      inventoryName: raw.inventoryName,
      inventoryCategoryId: raw.inventoryCategoryId,
      unit: raw.unit,
      description: raw.description,
      minimumQuantity: raw.minimumQuantity
    };

    this.inventoryService
      .createInventory(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Create inventory failed');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success('Inventory created successfully');
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
