import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { Store } from '@ngrx/store';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { catchError, combineLatest, EMPTY, finalize } from 'rxjs';

import { selectHasPermission, selectIsOwnerContext } from '../../../../auth/store/auth.selectors';
import { menuErrorMessage } from '../../menu-error';
import {
  MENU_STATUS_AVAILABLE,
  MENU_STATUS_UNAVAILABLE,
  ModifierGroupResponse,
  ModifierOptionResponse,
  ProductResponse
} from '../../menu.model';
import { MenuService } from '../../menu.service';

function maxSelectionValidator(control: AbstractControl): ValidationErrors | null {
  const min = control.get('minSelection')?.value;
  const max = control.get('maxSelection')?.value;
  if (min == null || max == null) return null;
  return max >= min ? null : { maxBelowMin: true };
}

@Component({
  selector: 'app-modifier-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzButtonModule,
    NzCollapseModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzTableModule,
    NzTagModule,
    I18nPipe
  ],
  templateUrl: './modifier-manager.component.html',
  styleUrl: './modifier-manager.component.less'
})
export class ModifierManagerComponent implements OnChanges {
  private fb = inject(NonNullableFormBuilder);
  private menuService = inject(MenuService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private store = inject(Store);

  @Input() product: ProductResponse | null = null;

  loading = false;
  savingGroup = false;
  savingOption = false;
  canManageModifier = true;

  groups: ModifierGroupResponse[] = [];
  optionsByGroup: Record<string, ModifierOptionResponse[]> = {};

  groupFormVisible = false;
  editingGroup: ModifierGroupResponse | null = null;

  optionFormVisible = false;
  editingOption: ModifierOptionResponse | null = null;
  activeGroupIdForOption: string | null = null;

  statusOptions = [
    { label: 'Đang bán', value: MENU_STATUS_AVAILABLE },
    { label: 'Ngừng bán', value: MENU_STATUS_UNAVAILABLE }
  ];

  groupForm = this.fb.group(
    {
      groupName: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
      description: this.fb.control(''),
      minSelection: this.fb.control(1, [Validators.required, Validators.min(0)]),
      maxSelection: this.fb.control(1, [Validators.required, Validators.min(0)])
    },
    { validators: maxSelectionValidator }
  );

  optionForm = this.fb.group({
    optionName: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
    additionalPrice: this.fb.control(0, [Validators.required, Validators.min(0)]),
    status: this.fb.control(MENU_STATUS_AVAILABLE, [Validators.required, Validators.maxLength(20)])
  });

  private permissionsLoaded = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      this.loadGroups();
    }

    if (!this.permissionsLoaded) {
      this.permissionsLoaded = true;
      combineLatest([this.store.select(selectIsOwnerContext), this.store.select(selectHasPermission('PRODUCT_UPDATE'))])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(([isOwner, canUpdate]) => {
          this.canManageModifier = isOwner || canUpdate;
          this.cdr.markForCheck();
        });
    }
  }

  private loadGroups(): void {
    if (!this.product) return;
    this.loading = true;
    this.cdr.markForCheck();

    this.menuService
      .listModifierGroups(this.product.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: HttpErrorResponse) => {
          this.message.error(menuErrorMessage(err));
          this.groups = [];
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(groups => {
        this.groups = groups;
        const optionsMap: Record<string, ModifierOptionResponse[]> = {};
        groups.forEach(group => {
          optionsMap[group.id] = this.optionsByGroup[group.id] ?? [];
        });
        this.optionsByGroup = optionsMap;
        this.cdr.markForCheck();
      });
  }

  optionsOf(groupId: string): ModifierOptionResponse[] {
    return this.optionsByGroup[groupId] ?? [];
  }

  openCreateGroup(): void {
    this.editingGroup = null;
    this.groupForm.reset({ groupName: '', description: '', minSelection: 1, maxSelection: 1 });
    this.groupFormVisible = true;
  }

  openEditGroup(group: ModifierGroupResponse): void {
    this.editingGroup = group;
    this.groupForm.reset({
      groupName: group.groupName,
      description: group.description ?? '',
      minSelection: group.minSelection,
      maxSelection: group.maxSelection
    });
    this.groupFormVisible = true;
  }

  cancelGroupForm(): void {
    this.groupFormVisible = false;
    this.editingGroup = null;
  }

  submitGroupForm(): void {
    if (this.groupForm.invalid || !this.product) return;

    this.savingGroup = true;
    this.cdr.markForCheck();
    const raw = this.groupForm.getRawValue();
    const request = {
      groupName: raw.groupName,
      description: raw.description || undefined,
      minSelection: raw.minSelection,
      maxSelection: raw.maxSelection
    };

    const request$ = this.editingGroup
      ? this.menuService.updateModifierGroup(this.editingGroup.id, request)
      : this.menuService.createModifierGroup(this.product.id, request);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: HttpErrorResponse) => {
          this.message.error(menuErrorMessage(err));
          return EMPTY;
        }),
        finalize(() => {
          this.savingGroup = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.message.success(this.editingGroup ? 'Cập nhật nhóm thành công' : 'Tạo nhóm thành công');
        this.groupFormVisible = false;
        this.editingGroup = null;
        this.loadGroups();
      });
  }

  deleteGroup(group: ModifierGroupResponse): void {
    this.menuService
      .deleteModifierGroup(group.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: HttpErrorResponse) => {
          this.message.error(menuErrorMessage(err));
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success('Xoá nhóm thành công');
        const { [group.id]: _removed, ...rest } = this.optionsByGroup;
        this.optionsByGroup = rest;
        this.loadGroups();
      });
  }

  openCreateOption(group: ModifierGroupResponse): void {
    this.activeGroupIdForOption = group.id;
    this.editingOption = null;
    this.optionForm.reset({ optionName: '', additionalPrice: 0, status: MENU_STATUS_AVAILABLE });
    this.optionFormVisible = true;
  }

  openEditOption(group: ModifierGroupResponse, option: ModifierOptionResponse): void {
    this.activeGroupIdForOption = group.id;
    this.editingOption = option;
    this.optionForm.reset({ optionName: option.optionName, additionalPrice: option.additionalPrice, status: option.status });
    this.optionFormVisible = true;
  }

  cancelOptionForm(): void {
    this.optionFormVisible = false;
    this.editingOption = null;
    this.activeGroupIdForOption = null;
  }

  submitOptionForm(): void {
    if (this.optionForm.invalid || !this.activeGroupIdForOption) return;

    this.savingOption = true;
    this.cdr.markForCheck();
    const raw = this.optionForm.getRawValue();
    const request = {
      optionName: raw.optionName,
      additionalPrice: raw.additionalPrice,
      status: raw.status
    };

    const request$ = this.editingOption
      ? this.menuService.updateModifierOption(this.editingOption.id, request)
      : this.menuService.createModifierOption(this.activeGroupIdForOption, request);

    const groupId = this.activeGroupIdForOption;

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: HttpErrorResponse) => {
          this.message.error(menuErrorMessage(err));
          return EMPTY;
        }),
        finalize(() => {
          this.savingOption = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(option => {
        this.message.success(this.editingOption ? 'Cập nhật tuỳ chọn thành công' : 'Tạo tuỳ chọn thành công');
        const existing = this.optionsByGroup[groupId] ?? [];
        this.optionsByGroup = {
          ...this.optionsByGroup,
          [groupId]: this.editingOption ? existing.map(o => (o.id === option.id ? option : o)) : [...existing, option]
        };
        this.optionFormVisible = false;
        this.editingOption = null;
        this.activeGroupIdForOption = null;
        this.cdr.markForCheck();
      });
  }

  deleteOption(group: ModifierGroupResponse, option: ModifierOptionResponse): void {
    this.menuService
      .deleteModifierOption(option.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: HttpErrorResponse) => {
          this.message.error(menuErrorMessage(err));
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success('Xoá tuỳ chọn thành công');
        this.optionsByGroup = {
          ...this.optionsByGroup,
          [group.id]: (this.optionsByGroup[group.id] ?? []).filter(o => o.id !== option.id)
        };
        this.cdr.markForCheck();
      });
  }
}
