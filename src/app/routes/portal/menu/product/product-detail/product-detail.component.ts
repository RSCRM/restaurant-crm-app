import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderModule } from '@delon/abc/page-header';
import { I18nPipe } from '@delon/theme';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { catchError, EMPTY, finalize, switchMap } from 'rxjs';

import { menuErrorMessage } from '../../menu-error';
import { CategoryResponse, ProductResponse } from '../../menu.model';
import { MenuService } from '../../menu.service';
import { ModifierManagerComponent } from '../modifier-manager/modifier-manager.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderModule,
    NzAvatarModule,
    NzButtonModule,
    NzCardModule,
    NzDescriptionsModule,
    NzIconModule,
    NzSpinModule,
    NzTagModule,
    I18nPipe,
    ModifierManagerComponent
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.less'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private menuService = inject(MenuService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  product: ProductResponse | null = null;
  categories: CategoryResponse[] = [];
  loading = true;
  productId = '';

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    this.loadDetail();
  }

  loadDetail(): void {
    this.loading = true;
    this.product = null;
    this.cdr.markForCheck();

    this.menuService
      .getProduct(this.productId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(product => {
          this.product = product;
          return this.menuService.listCategories(product.branchId);
        }),
        catchError((err: HttpErrorResponse) => {
          this.message.error(menuErrorMessage(err));
          this.product = null;
          this.categories = [];
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(categories => {
        this.categories = categories;
        this.cdr.markForCheck();
      });
  }

  get categoryName(): string {
    if (!this.product?.categoryId) return '-';
    return this.categories.find(c => c.id === this.product?.categoryId)?.categoryName ?? '-';
  }

  goBack(): void {
    this.router.navigate(['/portal/menu/product']);
  }
}
