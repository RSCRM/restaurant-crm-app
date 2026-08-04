import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STChange, STColumn, STModule } from '@delon/abc/st';
import { I18nPipe } from '@delon/theme';
import { Store } from '@ngrx/store';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { catchError, combineLatest, EMPTY, finalize } from 'rxjs';

import { ComboFormComponent } from './combo-form/combo-form.component';
import { selectBranchId, selectHasPermission, selectIsOwnerContext } from '../../../auth/store/auth.selectors';
import { menuErrorMessage } from '../menu-error';
import { ComboResponse } from '../menu.model';
import { MenuService } from '../menu.service';

interface ComboFilter {
  status: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}

@Component({
  selector: 'app-menu-combo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderModule,
    STModule,
    NzAvatarModule,
    NzButtonModule,
    NzCardModule,
    NzFormModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTagModule,
    I18nPipe
  ],
  templateUrl: './combo.component.html',
  styleUrl: './combo.component.less'
})
export class ComboComponent implements OnInit {
  private menuService = inject(MenuService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private store = inject(Store);

  branchId: string | null = null;

  canAddCombo = true;
  canUpdateCombo = true;
  canDeleteCombo = true;

  data: ComboResponse[] = [];

  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;

  searchValue = '';
  filter: ComboFilter = { status: null, minPrice: null, maxPrice: null };
  showFilter = false;

  statusOptions = [
    { label: 'Đang bán', value: 'AVAILABLE' },
    { label: 'Ngừng bán', value: 'UNAVAILABLE' }
  ];

  columns: STColumn[] = [
    { title: { i18n: 'app.portal.menu.combo.image' }, width: 70, render: 'image' },
    { title: { i18n: 'app.portal.menu.combo.name' }, index: 'comboName' },
    { title: { i18n: 'app.portal.menu.combo.price' }, width: 120, render: 'price' },
    { title: { i18n: 'app.portal.menu.combo.itemCount' }, width: 110, render: 'itemCount' },
    { title: { i18n: 'app.portal.menu.combo.status' }, width: 110, render: 'status' },
    {
      title: { i18n: 'app.portal.menu.combo.actions' },
      width: 160,
      fixed: 'right',
      buttons: [
        {
          i18n: 'app.portal.menu.combo.edit',
          icon: 'edit',
          iif: () => this.canUpdateCombo,
          click: item => this.openEdit(item)
        },
        {
          i18n: 'app.portal.menu.combo.delete',
          icon: 'delete',
          iif: () => this.canDeleteCombo,
          pop: { titleI18n: 'app.portal.menu.combo.deleteConfirm' },
          click: item => this.deleteCombo(item)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.store
      .select(selectBranchId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(branchId => {
        this.branchId = branchId;
        if (!branchId) {
          this.data = [];
          this.total = 0;
          this.cdr.markForCheck();
          return;
        }
        this.loadData();
      });

    combineLatest([
      this.store.select(selectIsOwnerContext),
      this.store.select(selectHasPermission('COMBO_ADD')),
      this.store.select(selectHasPermission('COMBO_UPDATE')),
      this.store.select(selectHasPermission('COMBO_DELETE'))
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([isOwner, canAdd, canUpdate, canDelete]) => {
        this.canAddCombo = isOwner || canAdd;
        this.canUpdateCombo = isOwner || canUpdate;
        this.canDeleteCombo = isOwner || canDelete;
        this.cdr.markForCheck();
      });
  }

  loadData(): void {
    if (!this.branchId) {
      this.message.warning('Vui lòng chọn chi nhánh');
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.menuService
      .searchCombos(
        {
          comboName: this.searchValue.trim() || undefined,
          priceFrom: this.filter.minPrice ?? undefined,
          priceTo: this.filter.maxPrice ?? undefined
        },
        this.currentPage,
        this.pageSize
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: HttpErrorResponse) => {
          this.message.error(menuErrorMessage(err));
          this.data = [];
          this.total = 0;
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(res => {
        this.total = res.totalElement;
        this.data = this.filter.status ? res.data.filter(c => c.status === this.filter.status) : res.data;
      });
  }

  onSTChange(e: STChange): void {
    if (e.type === 'pi') {
      this.currentPage = e.pi ?? 1;
      this.loadData();
    } else if (e.type === 'ps') {
      this.pageSize = e.ps ?? 10;
      this.currentPage = 1;
      this.loadData();
    }
  }

  search(): void {
    this.currentPage = 1;
    this.loadData();
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  clearFilter(): void {
    this.filter = { status: null, minPrice: null, maxPrice: null };
    this.searchValue = '';
    this.currentPage = 1;
    this.loadData();
  }

  get hasActiveFilter(): boolean {
    return this.searchValue !== '' || this.filter.status !== null || this.filter.minPrice !== null || this.filter.maxPrice !== null;
  }

  openCreate(): void {
    if (!this.branchId) {
      this.message.warning('Vui lòng chọn chi nhánh');
      return;
    }
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: ComboFormComponent,
      nzWidth: 800,
      nzData: { branchId: this.branchId }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  openEdit(combo: ComboResponse): void {
    if (!this.branchId) return;
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: ComboFormComponent,
      nzWidth: 800,
      nzData: { branchId: this.branchId, combo }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  deleteCombo(combo: ComboResponse): void {
    this.menuService
      .deleteCombo(combo.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: HttpErrorResponse) => {
          this.message.error(menuErrorMessage(err));
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success('Xoá combo thành công');
        this.loadData();
      });
  }
}
