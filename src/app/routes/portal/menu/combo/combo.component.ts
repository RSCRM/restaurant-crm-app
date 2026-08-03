import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PageHeaderModule } from '@delon/abc/page-header';
import { STChange, STColumn, STModule } from '@delon/abc/st';
import { I18nPipe } from '@delon/theme';
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
import { catchError, EMPTY, finalize } from 'rxjs';

import { MOCK_BRANCH_ID } from '../menu.mock';
import { ComboResponse } from '../menu.model';
import { MenuService } from '../menu.service';
import { ComboFormComponent } from './combo-form/combo-form.component';

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

  branchId = MOCK_BRANCH_ID;

  canAddCombo = true;
  canUpdateCombo = true;
  canDeleteCombo = true;

  allCombos: ComboResponse[] = [];
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
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.menuService
      .listCombos(this.branchId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.allCombos = [];
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.applyFilter();
          this.cdr.markForCheck();
        })
      )
      .subscribe(combos => {
        this.allCombos = combos;
      });
  }

  private applyFilter(): void {
    const keyword = this.searchValue.trim().toLowerCase();
    const filtered = this.allCombos.filter(combo => {
      if (keyword && !combo.comboName.toLowerCase().includes(keyword)) return false;
      if (this.filter.status && combo.status !== this.filter.status) return false;
      if (this.filter.minPrice != null && combo.price < this.filter.minPrice) return false;
      if (this.filter.maxPrice != null && combo.price > this.filter.maxPrice) return false;
      return true;
    });
    this.total = filtered.length;
    const start = (this.currentPage - 1) * this.pageSize;
    this.data = filtered.slice(start, start + this.pageSize);
  }

  onSTChange(e: STChange): void {
    if (e.type === 'pi') {
      this.currentPage = e.pi ?? 1;
      this.applyFilter();
      this.cdr.markForCheck();
    } else if (e.type === 'ps') {
      this.pageSize = e.ps ?? 10;
      this.currentPage = 1;
      this.applyFilter();
      this.cdr.markForCheck();
    }
  }

  search(): void {
    this.currentPage = 1;
    this.applyFilter();
    this.cdr.markForCheck();
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  clearFilter(): void {
    this.filter = { status: null, minPrice: null, maxPrice: null };
    this.searchValue = '';
    this.currentPage = 1;
    this.applyFilter();
    this.cdr.markForCheck();
  }

  get hasActiveFilter(): boolean {
    return this.searchValue !== '' || this.filter.status !== null || this.filter.minPrice !== null || this.filter.maxPrice !== null;
  }

  openCreate(): void {
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
        catchError(() => {
          this.message.error('Xoá combo thất bại');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.message.success('Xoá combo thành công');
        this.loadData();
      });
  }
}
