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
import { NzInputModule } from 'ng-zorro-antd/input';
import {
  NZ_MODAL_DATA,
  NzModalRef
} from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';

import {
  IngredientCategoryResponse
} from '../inventory.model';
import { InventoryService } from '../inventory.service';

@Component({
  selector: 'app-ingredient-category-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    I18nPipe
  ],
  templateUrl: './ingredient-category-form.component.html',
  styleUrl: './ingredient-category-form.component.less'
})
export class IngredientCategoryFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly modalRef = inject(NzModalRef);
  private readonly inventoryService = inject(InventoryService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly modalData =
    inject<IngredientCategoryResponse | null>(
      NZ_MODAL_DATA,
      { optional: true }
    );

  isEdit = false;
  loading = false;

  form = this.fb.group({
    categoryName: this.fb.control('', [
      Validators.required,
      Validators.maxLength(100)
    ]),
    description: this.fb.control('', [
      Validators.maxLength(255)
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

    const value = this.form.getRawValue();

    if (this.isEdit && this.modalData) {
      this.inventoryService
        .updateIngredientCategory(this.modalData.id, {
          categoryName: value.categoryName,
          description: value.description
        })
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError(() => {
            this.message.error(
              'Update ingredient category failed'
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
            'Ingredient category updated successfully'
          );
          this.modalRef.destroy(true);
        });

      return;
    }

    this.inventoryService
      .createIngredientCategory({
        categoryName: value.categoryName,
        description: value.description
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error(
            'Create ingredient category failed'
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
          'Ingredient category created successfully'
        );
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
