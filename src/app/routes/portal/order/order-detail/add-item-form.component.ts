import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { I18nPipe } from '@delon/theme';
import { Store } from '@ngrx/store';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { catchError, EMPTY, finalize, forkJoin } from 'rxjs';

import { selectBranchId } from '../../../auth/store/auth.selectors';
import { ProductResponse, ComboResponse, CategoryResponse } from '../../menu/menu.model';
import { MenuService } from '../../menu/menu.service';
import { OrderService } from '../order.service';
import { OrderItemCookingStatusResponse } from '../order.model';

@Component({
  selector: 'app-add-item-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, FormsModule, NzFormModule, NzInputModule, NzInputNumberModule, NzButtonModule, NzIconModule, NzSelectModule, I18nPipe],
  template: `
    <div class="modal-header">
      <div class="modal-title">{{ 'app.order.addItem.title' | i18n }}</div>
    </div>

    <div class="modal-body-container" [class.confirmed]="isConfirmed">
      @if (!isConfirmed) {
        <!-- Left Column: Dish Grid -->
        <div class="form-column">
          <div class="dish-search-bar">
            <input
              nz-input
              [(ngModel)]="searchKeyword"
              (ngModelChange)="filterDishes()"
              placeholder="Tìm món..."
              class="search-input"
            />
            <nz-select
              [(ngModel)]="selectedCategoryId"
              (ngModelChange)="filterDishes()"
              nzPlaceHolder="Tất cả danh mục"
              nzAllowClear
              class="category-select"
            >
              @for (cat of categories; track cat.id) {
                <nz-option [nzValue]="cat.id" [nzLabel]="cat.categoryName" />
              }
            </nz-select>
          </div>

          <div class="dish-grid">
            <!-- Products -->
            @for (prod of filteredProducts; track prod.id) {
              <div class="dish-card" (click)="addProductToCart(prod)">
                <div class="dish-name">{{ prod.productName }}</div>
                <div class="dish-price">{{ prod.price | number:'1.0-0' }}đ</div>
              </div>
            }
            <!-- Combos -->
            @for (cb of filteredCombos; track cb.id) {
              <div class="dish-card combo-card" (click)="addComboToCart(cb)">
                <div class="dish-name">{{ cb.comboName }}</div>
                <div class="dish-price">{{ cb.price | number:'1.0-0' }}đ</div>
                <div class="dish-badge">Combo</div>
              </div>
            }
            @if (filteredProducts.length === 0 && filteredCombos.length === 0) {
              <div class="empty-grid-text">Không tìm thấy món ăn nào</div>
            }
          </div>
        </div>
      }

      <!-- Right Column: Cart / Items List -->
      <div class="list-column">
        @if (isConfirmed) {
          <div class="success-alert">
            <span nz-icon nzType="check-circle" nzTheme="fill" class="success-icon"></span>
            <div class="success-text">Xác nhận gửi món thành công!</div>
          </div>
        }

        @if (!isConfirmed) {
          <div class="section-title">Món mới thêm (Chờ xác nhận)</div>
          <div class="items-list cart-list">
            @if (newItems.length === 0) {
              <div class="empty-list-text">Chưa có món mới nào được chọn</div>
            } @else {
              @for (item of newItems; track $index; let i = $index) {
                <div class="cart-item-card">
                  <div class="cart-item-header">
                    <span class="cart-item-name">{{ item.itemName }}</span>
                    <div class="cart-qty-adjuster">
                      <button nz-button nzSize="small" type="button" class="cart-qty-btn" (click)="decreaseQty(item)">-</button>
                      <span class="cart-qty-text">{{ item.quantity }}</span>
                      <button nz-button nzSize="small" type="button" class="cart-qty-btn" (click)="increaseQty(item)">+</button>
                      <button nz-button nzType="text" nzDanger type="button" (click)="removeFromCart(i)">
                        <span nz-icon nzType="delete" nzTheme="outline"></span>
                      </button>
                    </div>
                  </div>
                  <input nz-input [(ngModel)]="item.note" placeholder="Ghi chú món (VD: ít hành, không cay...)" class="item-note-input" />
                </div>
              }
            }
          </div>
        }

        <div class="section-title" [class.margin-top]="!isConfirmed">Món đã gọi</div>
        <div class="items-list ordered-list">
          @if (orderedItems.length === 0) {
            <div class="empty-list-text">Chưa có món nào được gọi</div>
          } @else {
            @for (item of orderedItems; track item.orderItemId) {
              <div class="item-row">
                <div class="item-info">
                  <div>
                    <span class="item-name">{{ item.itemName }}</span>
                    <span class="item-qty">x{{ item.quantity }}</span>
                  </div>
                  @if (item.note) {
                    <span class="item-note">Ghi chú: {{ item.note }}</span>
                  }
                </div>
                <span class="status-tag" [attr.data-status]="item.status">
                  {{ getStatusTranslationKey(item.status) | i18n }}
                </span>
              </div>
            }
          }
        </div>

        @if (!isConfirmed) {
          <div class="modal-footer">
            <button nz-button type="button" nzType="primary" [disabled]="newItems.length === 0" [nzLoading]="loading" (click)="confirmOrder()">
              <span nz-icon nzType="check"></span> Xác nhận gửi món
            </button>
          </div>
        } @else {
          <div class="modal-footer">
            <button nz-button type="button" nzType="primary" (click)="closeAfterConfirm()">Đóng</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .modal-header {
        margin-bottom: 16px;
      }
      .modal-title {
        font-size: 18px;
        font-weight: 600;
      }
      .modal-body-container {
        display: flex;
        gap: 24px;
        align-items: stretch;
      }
      .modal-body-container.confirmed {
        display: block;
      }
      .form-column {
        flex: 1.3;
        border-right: 1px solid #e8e8e8;
        padding-right: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .dish-search-bar {
        display: flex;
        gap: 8px;
      }
      .search-input {
        flex: 2;
      }
      .category-select {
        flex: 1.2;
      }
      .dish-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 12px;
        max-height: 480px;
        overflow-y: auto;
        padding-right: 4px;
        flex: 1;
      }
      .dish-card {
        background: #fff;
        border: 1px solid #e8e8e8;
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        position: relative;
        min-height: 84px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
      }
      .dish-card:hover {
        border-color: #1890ff;
        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
        transform: translateY(-2px);
      }
      .dish-name {
        font-weight: 600;
        color: rgba(0, 0, 0, 0.85);
        font-size: 13px;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .dish-price {
        color: #52c41a;
        font-weight: 600;
        font-size: 12px;
        margin-top: 8px;
      }
      .combo-card {
        border-color: #ffc53d;
        background: #fffbe6;
      }
      .combo-card:hover {
        border-color: #faad14;
        box-shadow: 0 4px 12px rgba(250, 173, 20, 0.15);
      }
      .dish-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        background: #faad14;
        color: #fff;
        font-size: 9px;
        font-weight: 600;
        padding: 1px 4px;
        border-radius: 4px;
        text-transform: uppercase;
      }
      .empty-grid-text {
        grid-column: 1 / -1;
        text-align: center;
        color: #bfbfbf;
        padding: 48px 0;
      }
      .list-column {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .modal-body-container.confirmed .list-column {
        max-width: 600px;
        margin: 0 auto;
      }
      .success-alert {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #f6ffed;
        border: 1px solid #b7eb8f;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 16px;
      }
      .success-icon {
        color: #52c41a;
        font-size: 20px;
      }
      .success-text {
        color: rgba(0, 0, 0, 0.85);
        font-weight: 500;
      }
      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #595959;
        margin-bottom: 8px;
      }
      .section-title.margin-top {
        margin-top: 16px;
      }
      .items-list {
        border: 1px solid #f0f0f0;
        border-radius: 4px;
        padding: 8px;
        max-height: 230px;
        overflow-y: auto;
        background: #fafafa;
        flex: 1;
        min-height: 120px;
      }
      .empty-list-text {
        text-align: center;
        color: #bfbfbf;
        padding: 24px 0;
        font-size: 13px;
      }
      .cart-item-card {
        border: 1px solid #e8e8e8;
        border-radius: 8px;
        padding: 10px 12px;
        background: #fff;
        margin-bottom: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
      }
      .cart-item-card:last-child {
        margin-bottom: 0;
      }
      .cart-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .cart-item-name {
        font-weight: 600;
        font-size: 13px;
        color: rgba(0, 0, 0, 0.85);
        max-width: 60%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .cart-qty-adjuster {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .cart-qty-btn {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        font-size: 14px;
        border-radius: 4px;
      }
      .cart-qty-text {
        font-weight: 600;
        font-size: 13px;
        min-width: 18px;
        text-align: center;
      }
      .item-note-input {
        font-size: 12px;
        height: 28px;
      }
      .item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid #f0f0f0;
        background: #fff;
        border-radius: 4px;
        margin-bottom: 4px;
      }
      .item-row:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }
      .item-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .item-name {
        font-weight: 500;
        color: rgba(0, 0, 0, 0.85);
      }
      .item-qty {
        color: #1890ff;
        font-weight: 600;
        margin-left: 8px;
      }
      .item-note {
        font-size: 12px;
        color: #8c8c8c;
      }
      .status-tag {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 500;
      }
      .status-tag[data-status='PENDING'] {
        background: #f5f5f5;
        color: rgba(0, 0, 0, 0.65);
        border: 1px solid #d9d9d9;
      }
      .status-tag[data-status='IN_PROGRESS'] {
        background: #e6f7ff;
        color: #1890ff;
        border: 1px solid #91d5ff;
      }
      .status-tag[data-status='READY_TO_SERVE'] {
        background: #fff7e6;
        color: #fa8c16;
        border: 1px solid #ffd591;
      }
      .status-tag[data-status='SERVED'] {
        background: #f6ffed;
        color: #52c41a;
        border: 1px solid #b7eb8f;
      }
      .status-tag[data-status='CANCELLED'] {
        background: #fff2f0;
        color: #ff4d4f;
        border: 1px solid #ffccc7;
      }
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 16px;
      }
    `
  ]
})
export class AddItemFormComponent implements OnInit {
  private modalRef = inject(NzModalRef);
  private orderService = inject(OrderService);
  private menuService = inject(MenuService);
  private store = inject(Store);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private modalData = inject<{ orderId: string; branchId?: string }>(NZ_MODAL_DATA);

  loading = false;
  hasAdded = false;
  isConfirmed = false;
  products: ProductResponse[] = [];
  combos: ComboResponse[] = [];
  categories: CategoryResponse[] = [];

  // Filtering variables
  searchKeyword = '';
  selectedCategoryId: string | null = null;
  filteredProducts: ProductResponse[] = [];
  filteredCombos: ComboResponse[] = [];

  orderedItems: OrderItemCookingStatusResponse[] = [];
  newItems: Array<{
    productId?: string;
    comboId?: string;
    itemName: string;
    quantity: number;
    note?: string;
  }> = [];

  ngOnInit(): void {
    const branchId = this.modalData.branchId;
    if (branchId) {
      this.loadMenuData(branchId);
    } else {
      this.store
        .select(selectBranchId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(id => {
          if (id) this.loadMenuData(id);
        });
    }

    this.loadOrderItems();
  }

  loadMenuData(branchId: string): void {
    this.menuService
      .listProducts(branchId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.products = res;
        this.filterDishes();
        this.cdr.markForCheck();
      });

    this.menuService
      .listCombos(branchId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.combos = res;
        this.filterDishes();
        this.cdr.markForCheck();
      });

    this.menuService
      .listCategories(branchId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.categories = res;
        this.cdr.markForCheck();
      });
  }

  loadOrderItems(): void {
    this.orderService.getCookingStatus(this.modalData.orderId).subscribe({
      next: res => {
        this.orderedItems = res.items || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Không thể tải danh sách món đã gọi');
      }
    });
  }

  filterDishes(): void {
    const keyword = this.searchKeyword.trim().toLowerCase();
    this.filteredProducts = this.products.filter(
      p =>
        p.status === 'AVAILABLE' &&
        (!keyword || p.productName.toLowerCase().includes(keyword)) &&
        (!this.selectedCategoryId || p.categoryId === this.selectedCategoryId)
    );
    this.filteredCombos = this.combos.filter(
      c =>
        c.status === 'AVAILABLE' &&
        (!keyword || c.comboName.toLowerCase().includes(keyword)) &&
        !this.selectedCategoryId
    );
  }

  addProductToCart(product: ProductResponse): void {
    const existing = this.newItems.find(item => item.productId === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.newItems.push({
        productId: product.id,
        itemName: product.productName,
        quantity: 1,
        note: ''
      });
    }
    this.cdr.markForCheck();
  }

  addComboToCart(combo: ComboResponse): void {
    const existing = this.newItems.find(item => item.comboId === combo.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.newItems.push({
        comboId: combo.id,
        itemName: combo.comboName,
        quantity: 1,
        note: ''
      });
    }
    this.cdr.markForCheck();
  }

  decreaseQty(item: any): void {
    if (item.quantity > 1) {
      item.quantity -= 1;
      this.cdr.markForCheck();
    }
  }

  increaseQty(item: any): void {
    item.quantity += 1;
    this.cdr.markForCheck();
  }

  removeFromCart(index: number): void {
    this.newItems.splice(index, 1);
    this.cdr.markForCheck();
  }

  confirmOrder(): void {
    if (this.newItems.length === 0) return;
    this.loading = true;
    this.cdr.markForCheck();

    const requests = this.newItems.map(item =>
      this.orderService.addOrderItem(this.modalData.orderId, {
        productId: item.productId,
        comboId: item.comboId,
        quantity: item.quantity,
        note: item.note || undefined
      })
    );

    forkJoin(requests)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.message.success('Gửi món thành công');
          this.hasAdded = true;
          this.newItems = [];
          this.isConfirmed = true;
          this.loadOrderItems();
        },
        error: () => {
          this.message.error('Gửi món thất bại');
        }
      });
  }

  closeAfterConfirm(): void {
    this.modalRef.destroy(this.hasAdded);
  }

  getStatusTranslationKey(status: string): string {
    switch (status) {
      case 'PENDING': return 'app.order.status.pending';
      case 'IN_PROGRESS': return 'app.order.status.inProgress';
      case 'READY_TO_SERVE': return 'app.order.status.readyToServe';
      case 'SERVED': return 'app.order.status.served';
      case 'CANCELLED': return 'app.order.status.cancelled';
      default: return status;
    }
  }
}
