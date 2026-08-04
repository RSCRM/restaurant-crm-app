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
import { catchError, EMPTY, finalize } from 'rxjs';

import { I18nPipe } from '@delon/theme';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

import {
  CreateInventoryCategoryRequest,
  InventoryCategoryResponse,
  UpdateInventoryCategoryRequest
} from '../inventory.model';
import { InventoryService } from '../inventory.service';

@Component({
  selector: 'app-inventory-category-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,

    NzFormModule,
    NzInputModule,
    NzButtonModule,

    I18nPipe
  ],
  templateUrl: './inventory-category-form.component.html',
  styleUrl: './inventory-category-form.component.less'
})
export class InventoryCategoryFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly modalRef = inject(NzModalRef);
  private readonly inventoryService = inject(InventoryService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly modalData = inject<InventoryCategoryResponse | null>(
    NZ_MODAL_DATA,
    { optional: true }
  );

  loading = false;
  isEdit = false;

  form = this.fb.group({
    categoryName: this.fb.control('', [
      Validators.required,
      Validators.maxLength(255)
    ]),
    description: this.fb.control('', [
      Validators.maxLength(500)
    ])
  });

  ngOnInit(): void {
    if (!this.modalData) {
      return;
    }

    this.isEdit = true;

    this.form.patchValue({
      categoryName: this.modalData.categoryName,
      description: this.modalData.description ?? ''
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
      const request: UpdateInventoryCategoryRequest = {
        categoryName: raw.categoryName,
        description: raw.description
      };

      this.inventoryService
        .updateInventoryCategory(this.modalData.id, request)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError(() => {
            this.message.error(
              'Update inventory category failed'
            );
            return EMPTY;
          }),
          finalize(() => {
            this.loading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe(() => {
          this.message.success(
            'Inventory category updated successfully'
          );
          this.modalRef.destroy(true);
        });

      return;
    }

    const request: CreateInventoryCategoryRequest = {
      categoryName: raw.categoryName,
      description: raw.description
    };

    this.inventoryService
      .createInventoryCategory(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error(
            'Create inventory category failed'
          );
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success(
          'Inventory category created successfully'
        );
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
