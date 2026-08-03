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
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  NZ_MODAL_DATA,
  NzModalRef
} from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';

import {
  IngredientCategoryResponse,
  IngredientResponse
} from '../inventory.model';
import { InventoryService } from '../inventory.service';

@Component({
  selector: 'app-ingredient-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    I18nPipe
  ],
  templateUrl: './ingredient-form.component.html',
  styleUrl: './ingredient-form.component.less'
})
export class IngredientFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly modalRef = inject(NzModalRef);
  private readonly inventoryService = inject(InventoryService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly modalData =
    inject<IngredientResponse | null>(
      NZ_MODAL_DATA,
      { optional: true }
    );

  isEdit = false;
  loading = false;

  categories: IngredientCategoryResponse[] = [];

  readonly units = [
    'kg',
    'g',
    'l',
    'ml',
    'piece',
    'pack',
    'box',
    'bottle',
    'can'
  ];

  form = this.fb.group({
    ingredientCategoryId: this.fb.control('', [
      Validators.required
    ]),
    ingredientName: this.fb.control('', [
      Validators.required,
      Validators.maxLength(100)
    ]),
    unit: this.fb.control('', [
      Validators.required,
      Validators.maxLength(30)
    ]),
    description: this.fb.control('', [
      Validators.maxLength(255)
    ])
  });

  ngOnInit(): void {
    this.loadCategories();

    if (!this.modalData) {
      return;
    }

    this.isEdit = true;

    this.form.patchValue({
      ingredientCategoryId: this.modalData.ingredientCategoryId,
      ingredientName: this.modalData.ingredientName,
      unit: this.modalData.unit,
      description: this.modalData.description ?? ''
    });
  }

  private loadCategories(): void {
    this.inventoryService
      .getIngredientCategories({
        page: 1,
        size: 1000
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Load ingredient categories failed');
          return EMPTY;
        })
      )
      .subscribe(res => {
        this.categories = res.data;
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

    const value = this.form.getRawValue();

    if (this.isEdit && this.modalData) {
      this.inventoryService
        .updateIngredient(this.modalData.id, {
          ingredientCategoryId: value.ingredientCategoryId,
          ingredientName: value.ingredientName,
          unit: value.unit,
          description: value.description
        })
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError(() => {
            this.message.error('Update ingredient failed');
            return EMPTY;
          }),
          finalize(() => {
            this.loading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe(() => {
          this.message.success('Ingredient updated successfully');
          this.modalRef.destroy(true);
        });

      return;
    }

    this.inventoryService
      .createIngredient({
        ingredientCategoryId: value.ingredientCategoryId,
        ingredientName: value.ingredientName,
        unit: value.unit,
        description: value.description
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.message.error('Create ingredient failed');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success('Ingredient created successfully');
        this.modalRef.destroy(true);
      });
  }

  close(): void {
    this.modalRef.destroy();
  }
}
