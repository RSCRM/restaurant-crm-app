# Restaurant CRM App — Coding Regulation

> Tài liệu quy chuẩn code cho dự án **Restaurant CRM Frontend**.
> Mọi thành viên **BẮT BUỘC** follow theo quy chuẩn này khi phát triển feature mới.

---

## Mục lục

1. [Tech Stack](#1-tech-stack)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Quy ước đặt tên](#3-quy-ước-đặt-tên)
4. [Cách thêm Feature mới](#4-cách-thêm-feature-mới)
5. [Component Conventions](#5-component-conventions)
6. [Service Conventions](#6-service-conventions)
7. [NgRx State Management](#7-ngrx-state-management)
8. [Routing](#8-routing)
9. [Auth & Token](#9-auth--token)
10. [Guards](#10-guards)
11. [HTTP Interceptor](#11-http-interceptor)
12. [Template & Style](#12-template--style)
13. [Delon Components (ST, SE, SV, PageHeader)](#13-delon-components)
14. [ng-zorro-antd Components](#14-ng-zorro-antd-components)
15. [Shared Module & Imports](#15-shared-module--imports)
16. [Icon Registration](#16-icon-registration)
17. [Change Detection (Zoneless)](#17-change-detection-zoneless)
18. [Code Formatting & Linting](#18-code-formatting--linting)
19. [Path Aliases](#19-path-aliases)
20. [Environment Config](#20-environment-config)
21. [Proxy Config](#21-proxy-config)
22. [Do & Don't](#22-do--dont)

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Angular (Standalone Components) | ^21.2 |
| UI Library | ng-zorro-antd | ^21.2 |
| Admin Scaffold | ng-alain (@delon) | ^21.3 |
| State Management | NgRx (Store + Effects + Entity + DevTools) | ^21.1 |
| Styling | Less | - |
| Testing | Vitest + Playwright | ^4.0 |
| Package Manager | Yarn | 4.9.2 |
| Language | TypeScript (strict mode) | ~5.9 |

---

## 2. Cấu trúc thư mục

```
src/
├── app/
│   ├── app.ts                    # Root component (App)
│   ├── app.config.ts             # Central provider registration
│   ├── core/                     # Core services (singleton, app-level)
│   │   ├── index.ts              # Barrel export
│   │   ├── i18n/                 # Internationalization service
│   │   ├── net/                  # HTTP interceptor, helper, refresh-token
│   │   └── startup/              # Startup service
│   ├── layout/                   # Layout components
│   │   ├── index.ts              # Barrel export
│   │   ├── admin/                # Admin layout (sidebar + header)
│   │   ├── portal/               # Portal layout (sidebar + header)
│   │   ├── basic/                # ng-alain default layout
│   │   └── blank/                # ng-alain blank layout
│   ├── routes/                   # Feature modules (business logic)
│   │   ├── routes.ts             # Main routes config
│   │   ├── auth/                 # Authentication module
│   │   │   ├── routes.ts         # Auth child routes
│   │   │   ├── login/            # Login page
│   │   │   ├── context-select/   # Context selection page
│   │   │   ├── guards/           # Route guards
│   │   │   ├── models/           # TypeScript interfaces
│   │   │   ├── services/         # Auth service
│   │   │   └── store/            # NgRx (actions, reducer, effects, selectors, state)
│   │   ├── admin/                # Admin features
│   │   │   ├── routes.ts         # Admin child routes
│   │   │   ├── dashboard/        # Dashboard page
│   │   │   ├── license/          # License management
│   │   │   │   ├── license.component.ts
│   │   │   │   ├── license.component.html
│   │   │   │   ├── license.model.ts      # Enums + Interfaces
│   │   │   │   ├── license.service.ts    # HTTP service
│   │   │   │   ├── license-form/         # Create/Edit modal
│   │   │   │   ├── license-detail/       # Detail page
│   │   │   │   └── subscription-form/    # Subscription modal
│   │   │   ├── organization/     # Organization management
│   │   │   └── user/             # User management
│   │   ├── portal/               # Portal (user) features
│   │   │   ├── routes.ts         # Portal child routes
│   │   │   ├── dashboard/
│   │   │   ├── order/
│   │   │   ├── menu/
│   │   │   ├── table/
│   │   │   ├── booking/
│   │   │   ├── inventory/
│   │   │   ├── employee/
│   │   │   └── invoice/
│   │   └── exception/            # Error pages (403, 404, 500)
│   └── shared/                   # Shared modules, directives, pipes
│       ├── index.ts              # Barrel export
│       ├── shared-imports.ts     # Common imports array
│       ├── shared-delon.module.ts# Delon module exports
│       ├── shared-zorro.module.ts# ng-zorro module exports
│       ├── directives/           # Custom directives
│       ├── st-widget/            # ST custom widgets
│       ├── cell-widget/          # Cell custom widgets
│       └── utils/                # Utility functions
├── assets/                       # Static assets
├── environments/                 # Environment configs
├── styles/                       # Global styles
├── style-icons.ts                # Custom icons (manual)
├── style-icons-auto.ts           # Auto-generated icons
└── main.ts                       # Bootstrap entry point
```

### Nguyên tắc phân chia

- **`core/`** — Singleton services, interceptor, startup logic. Chỉ import 1 lần duy nhất ở `app.config.ts`.
- **`layout/`** — Các layout component (admin, portal). Không chứa business logic.
- **`routes/`** — Toàn bộ feature modules. Mỗi feature là 1 thư mục riêng biệt.
- **`shared/`** — Reusable components, directives, pipes, modules. Được import ở nhiều nơi.

---

## 3. Quy ước đặt tên

### 3.1 File naming

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Component | `kebab-case.component.ts` | `license.component.ts` |
| Component HTML | `kebab-case.component.html` | `license.component.html` |
| Component Less | `kebab-case.component.less` | `login.component.less` |
| Service | `kebab-case.service.ts` | `license.service.ts` |
| Model/Interface | `kebab-case.model.ts` | `license.model.ts` |
| Guard | `kebab-case.guard.ts` | `auth.guard.ts` |
| Routes | `routes.ts` | `admin/routes.ts` |
| NgRx Actions | `feature.actions.ts` | `auth.actions.ts` |
| NgRx Reducer | `feature.reducer.ts` | `auth.reducer.ts` |
| NgRx Effects | `feature.effects.ts` | `auth.effects.ts` |
| NgRx Selectors | `feature.selectors.ts` | `auth.selectors.ts` |
| NgRx State | `feature.state.ts` | `auth.state.ts` |
| Directive | `kebab-case.directive.ts` | `has-permission.directive.ts` |
| Pipe | `kebab-case.pipe.ts` | `currency.pipe.ts` |

### 3.2 Class naming

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Component | PascalCase + `Component` | `LicenseComponent` |
| Service | PascalCase + `Service` | `LicenseService` |
| Guard | camelCase + `Guard` (function) | `authGuard`, `adminGuard` |
| Interface | PascalCase (không prefix `I`) | `LicenseResponse`, `PagingParams` |
| Enum | PascalCase | `LicenseStatus`, `BillingCycle` |
| NgRx Actions | PascalCase + `Actions` | `AuthActions` |
| NgRx Reducer | camelCase + `Reducer` | `authReducer` |

### 3.3 Selector naming

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Component | `app-kebab-case` | `app-license`, `app-login` |
| Directive | `[appCamelCase]` | `[appHasPermission]` |

### 3.4 Variable & method naming

- **Biến**: `camelCase` — `licenseList`, `currentPage`, `loading`
- **Method**: `camelCase` — `loadData()`, `openCreate()`, `goToDetail()`
- **Constant**: `UPPER_SNAKE_CASE` — `LICENSE_API`, `SUBSCRIPTION_API`
- **NgRx effect**: `camelCase` + `$` suffix — `init$`, `login$`, `loginSuccess$`
- **Observable**: `$` suffix (tùy chọn) — `loading$`, `error$`

---

## 4. Cách thêm Feature mới

Giả sử cần thêm feature **Order Management** cho admin:

### Bước 1: Tạo thư mục feature

```
src/app/routes/admin/order/
├── order.component.ts
├── order.component.html
├── order.model.ts
├── order.service.ts
├── order-form/
│   ├── order-form.component.ts
│   └── order-form.component.html
└── order-detail/
    ├── order-detail.component.ts
    └── order-detail.component.html
```

### Bước 2: Tạo Model (`order.model.ts`)

```typescript
// === Enums ===

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

// === DTOs ===

export interface OrderResponse {
  id: string;
  code: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  code: string;
  customerId: string;
  items: OrderItemRequest[];
}

export interface OrderItemRequest {
  menuItemId: string;
  quantity: number;
}

// === Paging (reuse pattern) ===

export interface PagingResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElement: number;
  data: T[];
}

export interface PagingParams {
  page: number;
  size: number;
  direction?: 'ASC' | 'DESC';
  field?: string;
}
```

### Bước 3: Tạo Service (`order.service.ts`)

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse } from '../../auth/models/auth.model';
import { CreateOrderRequest, OrderResponse, PagingParams, PagingResponse } from './order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);

  private readonly API = '/api/v1/admin/orders';

  getOrders(params: PagingParams): Observable<PagingResponse<OrderResponse>> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('size', params.size.toString());
    if (params.direction) httpParams = httpParams.set('direction', params.direction);
    if (params.field) httpParams = httpParams.set('field', params.field);

    return this.http
      .get<ApiResponse<PagingResponse<OrderResponse>>>(this.API, { params: httpParams })
      .pipe(map(res => res.data));
  }

  createOrder(request: CreateOrderRequest): Observable<OrderResponse> {
    return this.http
      .post<ApiResponse<OrderResponse>>(this.API, request)
      .pipe(map(res => res.data));
  }
}
```

### Bước 4: Tạo Component (`order.component.ts`)

```typescript
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { STColumn, STComponent, STModule, STChange } from '@delon/abc/st';
import { PageHeaderModule } from '@delon/abc/page-header';

import { OrderFormComponent } from './order-form/order-form.component';
import { OrderService } from './order.service';
import { OrderResponse, PagingResponse } from './order.model';

@Component({
  selector: 'app-order',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    STModule
  ],
  templateUrl: './order.component.html'
})
export class OrderComponent implements OnInit {
  private orderService = inject(OrderService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  data: OrderResponse[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;

  columns: STColumn[] = [
    { title: 'Mã đơn', index: 'code', width: 120 },
    { title: 'Trạng thái', index: 'status', width: 110, render: 'status' },
    {
      title: 'Tổng tiền',
      index: 'totalAmount',
      width: 130,
      type: 'number',
      format: item => `${item.totalAmount?.toLocaleString('vi-VN')} ₫`
    },
    { title: 'Ngày tạo', index: 'createdAt', width: 160, type: 'date' },
    {
      title: 'Thao tác',
      width: 180,
      fixed: 'right',
      buttons: [
        { text: 'Chi tiết', icon: 'eye', click: item => this.goToDetail(item) }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.orderService.getOrders({
      page: this.currentPage,
      size: this.pageSize,
      direction: 'DESC',
      field: 'createdAt'
    }).subscribe({
      next: (res: PagingResponse<OrderResponse>) => {
        this.data = res.data;
        this.total = res.totalElement;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSTChange(e: STChange): void {
    if (e.type === 'pi') {
      this.currentPage = e.pi!;
      this.loadData();
    } else if (e.type === 'ps') {
      this.pageSize = e.ps!;
      this.currentPage = 1;
      this.loadData();
    }
  }

  openCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: undefined,
      nzContent: OrderFormComponent,
      nzWidth: 600,
      nzData: null
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadData();
    });
  }

  goToDetail(order: OrderResponse): void {
    this.router.navigate(['/admin/order', order.id, 'detail']);
  }
}
```

### Bước 5: Tạo HTML Template (`order.component.html`)

```html
<page-header [title]="'Quản lý Đơn hàng'" />
<nz-card>
  <div style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
    <button nz-button nzType="primary" (click)="openCreate()">
      <span nz-icon nzType="plus" nzTheme="outline"></span>
      Tạo đơn hàng
    </button>
  </div>
  <st
    #st
    [columns]="columns"
    [data]="data"
    [total]="total"
    [ps]="pageSize"
    [pi]="currentPage"
    [loading]="loading"
    [page]="{ show: true, showSize: true }"
    [scroll]="{ x: '1200px' }"
    (change)="onSTChange($event)"
  >
    <ng-template st-row="status" let-item>
      <nz-tag [nzColor]="item.status === 'CONFIRMED' ? 'success' : item.status === 'CANCELLED' ? 'error' : 'warning'">
        {{ item.status }}
      </nz-tag>
    </ng-template>
  </st>
</nz-card>
```

### Bước 6: Đăng ký Route (`admin/routes.ts`)

```typescript
// Thêm vào mảng routes
{
  path: 'order',
  loadComponent: () => import('./order/order.component').then(m => m.OrderComponent)
},
{
  path: 'order/:id/detail',
  loadComponent: () => import('./order/order-detail/order-detail.component').then(m => m.OrderDetailComponent)
}
```

### Bước 7: Đăng ký Menu trong Layout (`layout/admin/admin.component.html`)

```html
<li nz-menu-item nzMatchRouter routerLink="/admin/order">
  <span nz-icon nzType="shopping-cart" nzTheme="outline"></span>
  <span>Đơn hàng</span>
</li>
```

### Bước 8: Đăng ký Icon (nếu dùng icon mới)

Thêm vào `src/style-icons-auto.ts`:

```typescript
import { ShoppingCartOutline } from '@ant-design/icons-angular/icons';

export const ICONS_AUTO = [
  // ...existing icons
  ShoppingCartOutline
];
```

Chạy lại lệnh generate icon:

```bash
yarn icon
```

### Bước 9: Kiểm tra

```bash
yarn build    # Build không lỗi
yarn lint     # Lint không lỗi
yarn start    # Chạy dev server, kiểm tra UI
```

---

## 5. Component Conventions

### 5.1 Bắt buộc

```typescript
@Component({
  selector: 'app-feature-name',           // prefix 'app-'
  standalone: true,                        // Luôn dùng standalone
  changeDetection: ChangeDetectionStrategy.OnPush,  // BẮT BUỘC cho zoneless
  imports: [                               // Chỉ import cái cần dùng
    NzButtonModule,
    NzCardModule,
    STModule
  ],
  templateUrl: './feature.component.html'  // TUYỆT ĐỐI dùng templateUrl, KHÔNG dùng template inline
})
```

### 5.2 Dependency Injection

Luôn dùng `inject()` function, KHÔNG dùng constructor injection:

```typescript
// ✅ ĐÚNG
export class OrderComponent {
  private orderService = inject(OrderService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
}

// ❌ SAI
export class OrderComponent {
  constructor(
    private orderService: OrderService,
    private modal: NzModalService
  ) {}
}
```

### 5.3 Change Detection

Vì dùng `provideZonelessChangeDetection()`, PHẢI gọi `cdr.markForCheck()` trong mọi subscribe callback:

```typescript
this.service.getData().subscribe({
  next: (res) => {
    this.data = res;
    this.loading = false;
    this.cdr.markForCheck();  // ← BẮT BUỘC
  },
  error: () => {
    this.loading = false;
    this.cdr.markForCheck();  // ← BẮT BUỘC
  }
});
```

### 5.4 Lifecycle

- Dùng `OnInit` để load data ban đầu
- Không dùng `constructor` cho logic phức tạp

```typescript
export class FeatureComponent implements OnInit {
  ngOnInit(): void {
    this.loadData();
  }
}
```

### 5.5 Template Rules

- **TUYỆT ĐỐI** tách HTML ra file `.html` riêng, dùng `templateUrl`
- **KHÔNG BAO GIỜ** viết template inline trong `@Component` (trừ root `App` component)
- **KHÔNG BAO GIỜ** dùng `template` property cho component có > 5 dòng HTML

---

## 6. Service Conventions

### 6.1 Cấu trúc Service

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse } from '../../auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class FeatureService {
  private http = inject(HttpClient);

  private readonly API = '/api/v1/admin/features';

  // GET list with pagination
  getFeatures(params: PagingParams): Observable<PagingResponse<FeatureResponse>> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('size', params.size.toString());
    if (params.direction) httpParams = httpParams.set('direction', params.direction);
    if (params.field) httpParams = httpParams.set('field', params.field);

    return this.http
      .get<ApiResponse<PagingResponse<FeatureResponse>>>(this.API, { params: httpParams })
      .pipe(map(res => res.data));
  }

  // POST create
  createFeature(request: CreateFeatureRequest): Observable<FeatureResponse> {
    return this.http
      .post<ApiResponse<FeatureResponse>>(this.API, request)
      .pipe(map(res => res.data));
  }

  // PUT update
  updateFeature(id: string, request: UpdateFeatureRequest): Observable<FeatureResponse> {
    return this.http
      .put<ApiResponse<FeatureResponse>>(`${this.API}/${id}`, request)
      .pipe(map(res => res.data));
  }

  // DELETE
  deleteFeature(id: string): Observable<DeleteFeatureResponse> {
    return this.http
      .delete<ApiResponse<DeleteFeatureResponse>>(`${this.API}/${id}`)
      .pipe(map(res => res.data));
  }
}
```

### 6.2 API Response Unwrap

Backend trả về `ApiResponse<T>` wrapper:

```json
{
  "success": true,
  "errorMessage": null,
  "data": { ... }
}
```

Service **PHẢI** unwrap bằng `.pipe(map(res => res.data))` để component chỉ nhận data thuần.

### 6.3 API URL Convention

- Admin APIs: `/api/v1/admin/{resource}`
- Portal APIs: `/api/v1/{resource}` (không có `admin/`)
- Auth APIs: `/api/v1/auth/{action}`

### 6.4 Paging Convention

Backend dùng **1-based** page index. Frontend ST component cũng dùng 1-based.

```typescript
interface PagingParams {
  page: number;      // 1-based
  size: number;
  direction?: 'ASC' | 'DESC';
  field?: string;
}

interface PagingResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElement: number;  // Chú ý: 'totalElement' không phải 'totalElements'
  data: T[];
}
```

---

## 7. NgRx State Management

### 7.1 Cấu trúc Store files

Mỗi feature có state management sẽ có 5 files:

```
store/
├── feature.actions.ts     # Action definitions
├── feature.state.ts       # State interface + initial state
├── feature.reducer.ts     # Reducer
├── feature.effects.ts     # Side effects (API calls)
└── feature.selectors.ts   # Selector functions
```

### 7.2 Actions (`createActionGroup`)

```typescript
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Init': emptyProps(),
    'Login': props<{ email: string; password: string }>(),
    'Login Success': props<{ accessToken: string }>(),
    'Login Failure': props<{ error: string }>(),
    'Logout': emptyProps(),
    'Logout Success': emptyProps(),
    'Clear Error': emptyProps()
  }
});
```

**Naming convention cho actions:**
- Action tên là tiếng Anh, ngắn gọn, mô tả hành động
- `Success` / `Failure` suffix cho async operations
- Dùng `emptyProps()` cho actions không cần payload
- Dùng `props<{...}>()` cho actions có payload

### 7.3 State

```typescript
export interface AuthState {
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  accessToken: null,
  loading: false,
  error: null
};
```

### 7.4 Reducer

```typescript
import { createReducer, on } from '@ngrx/store';

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, (state): AuthState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.loginSuccess, (state, { accessToken }): AuthState => ({
    ...state,
    accessToken,
    loading: false,
    error: null
  })),

  on(AuthActions.loginFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error
  }))
);
```

### 7.5 Effects

```typescript
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of } from 'rxjs';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) =>
        this.authService.login({ email, password }).pipe(
          map(response => AuthActions.loginSuccess({ accessToken: response.accessToken })),
          catchError(err => of(AuthActions.loginFailure({ error: err.message })))
        )
      )
    )
  );

  // Effect không dispatch action mới
  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ accessToken }) => {
          this.authService.setToken(accessToken, 72 * 60 * 60 * 1000);
        })
      ),
    { dispatch: false }
  );
}
```

### 7.6 Selectors

```typescript
import { createFeatureSelector, createSelector } from '@ngrx/store';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectAccessToken = createSelector(selectAuthState, s => s.accessToken);
export const selectAuthLoading = createSelector(selectAuthState, s => s.loading);
export const selectAuthError = createSelector(selectAuthState, s => s.error);
export const selectIsAuthenticated = createSelector(selectAccessToken, token => !!token);
```

### 7.7 Register Store in app.config.ts

```typescript
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

// Trong providers array:
provideStore({ auth: authReducer }),
provideEffects([AuthEffects]),
provideStoreDevtools({ maxAge: 25, logOnly: environment.production }),
```

---

## 8. Routing

### 8.1 Cấu trúc Routes

```
routes.ts (main)
├── /auth → auth/routes.ts (loadChildren)
│   ├── /auth/login
│   └── /auth/context-select
├── /admin → admin/routes.ts (loadChildren, guards: authGuard + adminGuard)
│   ├── /admin/dashboard
│   ├── /admin/license
│   ├── /admin/license/:id/detail
│   ├── /admin/organization
│   └── /admin/user
├── /portal → portal/routes.ts (loadChildren, guards: authGuard + portalGuard)
│   ├── /portal/dashboard
│   ├── /portal/order
│   └── ...
├── /exception → exception/routes.ts (loadChildren)
│   ├── /exception/403
│   ├── /exception/404
│   └── /exception/500
└── ** → /exception/404
```

### 8.2 Lazy Loading

**BẮT BUỘC** dùng lazy loading cho tất cả routes:

```typescript
// ✅ ĐÚNG - Lazy load component
{
  path: 'dashboard',
  loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
}

// ✅ ĐÚNG - Lazy load child routes
{
  path: 'admin',
  loadChildren: () => import('./admin/routes').then(m => m.routes)
}

// ❌ SAI - Import trực tiếp (không lazy load)
{
  path: 'dashboard',
  component: AdminDashboardComponent
}
```

### 8.3 Route Guards

Guards là **standalone functions** (functional guards), không phải class:

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map(isAuth => {
      if (isAuth) return true;
      return router.createUrlTree(['/auth/login']);
    })
  );
};
```

### 8.4 Permission Guard

Dùng cho portal routes, kiểm tra permission cụ thể:

```typescript
export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const store = inject(Store);
    const router = inject(Router);

    return store.select(selectHasPermission(permission)).pipe(
      take(1),
      map(has => {
        if (has) return true;
        return router.createUrlTree(['/portal/dashboard']);
      })
    );
  };
}

// Sử dụng trong routes:
{
  path: 'order',
  canActivate: [permissionGuard('ORDER_READ')],
  loadComponent: () => import('./order/order.component').then(m => m.OrderComponent)
}
```

> [!IMPORTANT]
> **LƯU Ý QUAN TRỌNG VỀ PERMISSION GUARD TRÊN PORTAL:**
> - Hiện tại, danh sách quyền `permissions` trong NgRx `AuthState` mặc định không được lưu trữ hoặc đồng bộ tự động từ Token.
> - Do đó, việc cấu hình `permissionGuard(...)` ở mức Router level (file `routes.ts`) sẽ **luôn luôn thất bại** và đá người dùng quay lại Dashboard.
> - **Quy chuẩn phát triển (Conventions):**
>   1. Chỉ cấu hình `canActivate: [contextGuard]` ở mức Router level.
>   2. Thực hiện kiểm tra quyền truy cập **cục bộ (locally)** bên trong từng Component bằng cách tự giải mã `contextToken` qua hàm helper.
>   3. Sử dụng `*ngIf="hasReadPermission; else noPermissionTpl"` ở Template để ẩn/hiện nội dung hoặc hiển thị Lock Screen 403 cục bộ.

---

## 9. Auth & Token

### 9.1 Dual Token Architecture

- **Identity Token** (`accessToken`): Nhận từ `/api/v1/auth/login`. Dùng cho ADMIN gọi business APIs.
- **Context Token** (`contextToken`): Nhận từ `/api/v1/auth/context`. Dùng cho USER gọi business APIs.

### 9.2 Token Persistence

Token được lưu qua `DA_SERVICE_TOKEN` từ `@delon/auth` (localStorage).
Ngoài ra, `systemRoles` và `contextToken` cũng được lưu riêng trong localStorage:

```typescript
// Auth keys trong localStorage:
// - @delon/auth (managed by DA_SERVICE_TOKEN)
// - auth_systemRoles: JSON string[]
// - auth_contextToken: string
```

### 9.3 Token Restoration on Reload

Khi F5, NgRx store bị mất → cần restore từ localStorage:

1. `provideAppInitializer` dispatch `AuthActions.init()`
2. `init$` effect đọc token từ `DA_SERVICE_TOKEN`
3. Nếu token tồn tại → dispatch `AuthActions.restoreAuth()`
4. Reducer update state → guards hoạt động đúng

---

## 10. Guards

| Guard | File | Purpose |
|-------|------|---------|
| `authGuard` | `auth/guards/auth.guard.ts` | Kiểm tra đã đăng nhập chưa |
| `adminGuard` | `auth/guards/admin.guard.ts` | Kiểm tra role ADMIN |
| `portalGuard` | `auth/guards/portal.guard.ts` | Kiểm tra đã đăng nhập (cho portal) |
| `permissionGuard` | `auth/guards/permission.guard.ts` | Kiểm tra permission cụ thể |

---

## 11. HTTP Interceptor

File: `src/app/core/net/default.interceptor.ts`

**Chức năng:**
- Tự động attach `Authorization: Bearer {token}` header cho mọi request (trừ anonymous)
- Prepend `baseUrl` từ environment
- Xử lý lỗi 401 → redirect to login
- Xử lý lỗi 403, 404, 500 → notification
- Support refresh token (configurable)

**Anonymous request:**

```typescript
this.http.post('/api/v1/auth/login', body, {
  context: new HttpContext().set(ALLOW_ANONYMOUS, true)
});
```

---

## 12. Template & Style

### 12.1 HTML Template Rules

- Dùng `templateUrl` (KHÔNG dùng inline `template`)
- Tự đóng tag khi không có children: `<nz-tag />` thay vì `<nz-tag></nz-tag>`
- Dùng `let-item` trong ST row template

```html
<ng-template st-row="status" let-item>
  <nz-tag [nzColor]="item.status === 'ACTIVE' ? 'success' : 'error'">
    {{ item.status === 'ACTIVE' ? 'Hoạt động' : 'Khóa' }}
  </nz-tag>
</ng-template>
```

### 12.2 Style Rules

- Dùng **Less** (không phải SCSS/CSS)
- Component styles: file `.component.less` riêng (nếu cần)
- Global styles: `src/styles.less`
- Không dùng inline styles quá phức tạp trong template

### 12.3 i18n

- UI text viết tiếng Việt trực tiếp trong template
- Dùng `I18nPipe` (`@delon/theme`) cho text cần dịch động

---

## 13. Delon Components

### 13.1 ST (Simple Table)

```html
<st
  #st
  [columns]="columns"
  [data]="data"
  [total]="total"
  [ps]="pageSize"
  [pi]="currentPage"
  [loading]="loading"
  [page]="{ show: true, showSize: true }"
  [scroll]="{ x: '1200px' }"
  (change)="onSTChange($event)"
>
  <!-- Custom row templates -->
  <ng-template st-row="fieldName" let-item>
    {{ item.fieldName }}
  </ng-template>
</st>
```

**STColumn buttons:**

```typescript
{
  title: 'Thao tác',
  width: 280,
  fixed: 'right',
  buttons: [
    {
      text: 'Sửa',
      icon: 'edit',
      iif: item => item.status === 'ACTIVE',   // Conditional visibility
      click: item => this.openEdit(item)
    },
    {
      text: 'Xóa',
      icon: 'delete',
      pop: 'Xác nhận xóa?',                    // Popconfirm (NOT type: 'popconfirm')
      click: item => this.deleteItem(item)
    }
  ]
}
```

**Lưu ý quan trọng về ST:**
- Button `pop` property để hiện popconfirm, KHÔNG dùng `type: 'popconfirm'`
- `type` chỉ nhận: `'none'|'del'|'modal'|'static'|'drawer'|'link'|'divider'`
- Dùng `iif` cho conditional visibility, KHÔNG dùng function trong `icon`
- Backend 1-based paging, ST cũng 1-based → truyền `page` trực tiếp

### 13.2 PageHeader

```html
<page-header [title]="'Tên trang'" />
```

### 13.3 SE (Search Element) & SV (Simple View)

Dùng cho form layout và detail view.

---

## 14. ng-zorro-antd Components

### 14.1 Import Convention

Luôn import module cụ thể, KHÔNG import `NzModule` tổng:

```typescript
// ✅ ĐÚNG
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';

// ❌ SAI
import { NzModule } from 'ng-zorro-antd';
```

### 14.2 Modal

```typescript
// Mở modal
const modalRef = this.modal.create({
  nzTitle: undefined,              // Không dùng title, để component tự render
  nzContent: FeatureFormComponent,
  nzWidth: 600,
  nzData: data                     // Truyền data vào modal
});

// Nhận data trong modal component
private modalData = inject<DataType | null>(NZ_MODAL_DATA, { optional: true });

// Đóng modal
this.modalRef.destroy(true);       // true = có data trả về
this.modalRef.destroy();           // không có data
```

### 14.3 Message & Notification

```typescript
// Success/Error message (toast)
this.message.success('Thành công');
this.message.error('Thất bại');

// Notification (persistent)
this.notification.error('Lỗi', 'Chi tiết lỗi');
```

### 14.4 Tag Colors

```typescript
// Status mapping
getTagColor(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'LOCKED': return 'error';
    case 'EXPIRED': return 'warning';
    case 'PENDING': return 'processing';
    default: return 'default';
  }
}
```

---

## 15. Shared Module & Imports

### 15.1 shared-imports.ts

Chứa các imports thường dùng. Component nào cũng nên import từ đây:

```typescript
import { SHARED_IMPORTS } from '@shared';
```

### 15.2 shared-delon.module.ts

Các Delon modules chung: `STModule`, `SVModule`, `SEModule`, `PageHeaderModule`, `DelonFormModule`, `ACLDirective`, `ACLIfDirective`, `CurrencyPricePipe`.

### 15.3 shared-zorro.module.ts

Tất cả ng-zorro-antd modules thường dùng.

### 15.4 Khi nào import vào shared?

- Module dùng ở **≥ 2 feature** → thêm vào `shared-zorro.module.ts` hoặc `shared-delon.module.ts`
- Module chỉ dùng ở **1 feature** → import trực tiếp trong component đó

---

## 16. Icon Registration

### 16.1 Auto-generated icons

File: `src/style-icons-auto.ts`

Được generate bởi lệnh: `yarn icon`

### 16.2 Custom icons

File: `src/style-icons.ts`

Dùng cho icons không có trong ng-alain auto-scan.

### 16.3 Khi thêm icon mới

1. Thêm icon import vào `style-icons-auto.ts`
2. Hoặc chạy `yarn icon` để auto-generate
3. Trong template dùng: `<span nz-icon nzType="icon-name" nzTheme="outline"></span>`

**Lưu ý:** Icon name phải match chính xác với `@ant-design/icons-angular`:
- `lock` → `LockOutline`
- `unlock` → `UnlockOutline`
- `delete` → `DeleteOutline`
- `edit` → `EditOutline`
- `eye` → `EyeOutline`
- `plus` → `PlusOutline`
- `arrow-left` → `ArrowLeftOutline`

---

## 17. Change Detection (Zoneless)

### 17.1 Tại sao phải quan tâm?

Project dùng `provideZonelessChangeDetection()` → Angular **KHÔNG** tự detect changes trong subscribe callbacks.

### 17.2 Quy tắc

1. **BẮT BUỘC** dùng `ChangeDetectionStrategy.OnPush` cho mọi component
2. **BẮT BUỘC** inject `ChangeDetectorRef` và gọi `cdr.markForCheck()` trong mọi subscribe callback
3. Hoặc dùng `async` pipe trong template (tự handle change detection)

```typescript
// ✅ ĐÚNG - Manual markForCheck
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureComponent {
  private cdr = inject(ChangeDetectorRef);

  loadData(): void {
    this.service.getData().subscribe({
      next: (res) => {
        this.data = res;
        this.cdr.markForCheck();  // ← BẮT BUỘC
      }
    });
  }
}

// ✅ ĐÚNG - Async pipe
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureComponent {
  private store = inject(Store);
  loading$ = this.store.select(selectLoading);
  error$ = this.store.select(selectError);
}
```

```html
<!-- ✅ ĐÚNG - Async pipe trong template -->
<nz-alert *ngIf="(error$ | async) as error" [nzMessage]="error" />
```

---

## 18. Code Formatting & Linting

### 18.1 Prettier

```javascript
// .prettierrc.js
module.exports = {
  singleQuote: true,       // Dùng single quote
  useTabs: false,          // Dùng spaces
  printWidth: 140,         // Max 140 chars/line
  tabWidth: 2,             // 2 spaces indent
  semi: true,              // Dùng semicolons
  arrowParens: 'avoid',    // (x) => x → x => x
  trailingComma: 'none',   // Không trailing comma
  endOfLine: 'lf'          // LF line endings
};
```

### 18.2 ESLint Rules quan trọng

- `import/order`: External → Internal → Parent/Sibling, alphabetized, newlines between groups
- `no-unused-vars`: Error (prefix `_` để ignore)
- `prefer-template`: Error (dùng template literals)
- `no-explicit-any`: Warn (tránh dùng `any`)
- `prettier/prettier`: Error (format theo prettier)

### 18.3 Lệnh kiểm tra

```bash
yarn lint           # Chạy cả TS lint + Style lint
yarn lint:ts        # Chỉ TS lint (eslint)
yarn lint:style     # Chỉ Style lint (stylelint)
yarn build          # Build production
yarn test           # Chạy unit tests
```

### 18.4 Import Order

```typescript
// 1. Angular core
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

// 2. Third-party libraries
import { NzButtonModule } from 'ng-zorro-antd/button';
import { STModule } from '@delon/abc/st';
import { Store } from '@ngrx/store';

// 3. Internal - relative imports
import { AuthService } from '../services/auth.service';
import { AuthActions } from '../store/auth.actions';
```

Mỗi nhóm cách nhau 1 dòng trống, alphabetized trong nhóm.

---

## 19. Path Aliases

Định nghĩa trong `tsconfig.json`:

| Alias | Maps to | Dùng cho |
|-------|---------|----------|
| `@shared` | `src/app/shared/index` | Shared modules, directives, pipes |
| `@core` | `src/app/core/index` | Core services, interceptor |
| `@env/*` | `src/environments/*` | Environment configs |

```typescript
// ✅ ĐÚNG
import { SHARED_IMPORTS } from '@shared';
import { environment } from '@env/environment';

// ❌ SAI - dùng relative path dài
import { SHARED_IMPORTS } from '../../../shared/index';
```

---

## 20. Environment Config

### 20.1 Files

- `src/environments/environment.ts` — Development
- `src/environments/environment.prod.ts` — Production

### 20.2 Structure

```typescript
export const environment = {
  production: false,
  useHash: true,
  api: {
    baseUrl: '',                     // Proxy handled by proxy.conf.js
    refreshTokenEnabled: true,
    refreshTokenType: 're-request'
  }
} as Environment;
```

### 20.3 File Replacement

`angular.json` tự động replace `environment.ts` → `environment.prod.ts` khi build production.

---

## 21. Proxy Config

File: `proxy.conf.js`

```javascript
module.exports = {
  '/api': {
    target: 'http://localhost:8080',
    secure: false,
    changeOrigin: true
  }
};
```

Tất cả request đến `/api/*` sẽ được forward đến backend `localhost:8080`.

---

## 22. Do & Don't

### ✅ DO

- Dùng `standalone: true` cho mọi component
- Dùng `ChangeDetectionStrategy.OnPush` cho mọi component
- Dùng `inject()` thay vì constructor injection
- Dùng `templateUrl` thay vì inline `template`
- Dùng lazy loading (`loadComponent`, `loadChildren`) cho routes
- Dùng `createActionGroup` cho NgRx actions
- Gọi `cdr.markForCheck()` trong mọi subscribe callback
- Dùng `pipe(map(res => res.data))` để unwrap API response
- Import module cụ thể từ ng-zorro-antd
- Follow import order: Angular → Third-party → Internal
- Chạy `yarn lint` và `yarn build` trước khi commit

### ❌ DON'T

- KHÔNG dùng inline `template` trong `@Component` (trừ App root)
- KHÔNG dùng constructor injection
- KHÔNG import `NzModule` tổng
- KHÔNG dùng `type: 'popconfirm'` trong ST button (dùng `pop`)
- KHÔNG dùng function syntax cho ST `icon` property
- KHÔNG quên `cdr.markForCheck()` trong subscribe
- KHÔNG dùng `any` type (trừ trường hợp bất khả kháng)
- KHÔNG import trực tiếp component vào routes (phải lazy load)
- KHÔNG hardcode API URL (dùng constants trong service)
- KHÔNG lưu business logic trong layout components

---

## Quick Reference: Checklist khi thêm Feature mới

- [ ] Tạo thư mục feature trong `routes/{admin|portal}/feature-name/`
- [ ] Tạo `feature.model.ts` (enums + interfaces)
- [ ] Tạo `feature.service.ts` (HTTP calls, unwrap `ApiResponse`)
- [ ] Tạo `feature.component.ts` (standalone, OnPush, inject, templateUrl)
- [ ] Tạo `feature.component.html` (page-header, nz-card, st table)
- [ ] Tạo form/detail sub-components nếu cần
- [ ] Đăng ký route trong `routes.ts` (lazy load)
- [ ] Đăng ký menu trong layout (`admin.component.html` / `portal.component.html`)
- [ ] Đăng ký icon mới nếu cần (`style-icons-auto.ts`)
- [ ] Thêm permission guard nếu cần (`permissionGuard('PERMISSION_NAME')`)
- [ ] Chạy `yarn build` — không lỗi
- [ ] Chạy `yarn lint` — không lỗi
- [ ] Test UI: load data, pagination, create, edit, delete
- [ ] Test reload (F5): data persist, không redirect sai
