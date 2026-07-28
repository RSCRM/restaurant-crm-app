# QUY ĐỊNH CODE — RESTAURANT CRM FRONTEND

> Áp dụng cho toàn bộ source frontend trong repository `restaurant-crm-app`.
>
> Tài liệu được tổng hợp từ cấu hình và code thực tế tại thời điểm hiện tại: Angular 21, TypeScript 5.9, ng-alain 21, NG-ZORRO 21, NgRx 21, RxJS 7, Less, ESLint, Prettier, Stylelint và Vitest.

## 1. Mục tiêu

Tài liệu này thống nhất cách tổ chức, viết, kiểm tra và review code để:

- Giữ code mới tương thích với kiến trúc hiện tại.
- Giảm lỗi ở luồng đăng nhập, token, context và phân quyền.
- Tránh nhân bản code scaffold hoặc tạo abstraction chưa cần thiết.
- Đảm bảo mọi thay đổi vượt qua TypeScript strict mode, lint, test và production build.

Các từ khóa:

- **PHẢI / KHÔNG ĐƯỢC**: quy tắc bắt buộc.
- **NÊN / KHÔNG NÊN**: mặc định phải theo; chỉ khác khi có lý do rõ ràng trong pull request.
- **CÓ THỂ**: tùy chọn phù hợp ngữ cảnh.

## 2. Nguồn sự thật và thứ tự ưu tiên

Khi tài liệu và tooling khác nhau, áp dụng theo thứ tự:

1. Compiler TypeScript và Angular.
2. `eslint.config.mjs`, `stylelint.config.mjs`.
3. `.prettierrc.js`, `.editorconfig`.
4. `angular.json`, `tsconfig*.json`, `vitest.config.ts`.
5. Tài liệu này.
6. Code cũ trong repository.

Code hiện tại có một phần được giữ từ ng-alain scaffold, gồm nội dung demo, comment tiếng Trung, `any`, selector không có prefix và một số pattern cũ. Đây là **legacy**, không phải mẫu để sao chép.

## 3. Công nghệ và nguyên tắc nền

| Hạng mục | Chuẩn của dự án |
|---|---|
| Runtime | Node.js `22.21.1` theo `.nvmrc` |
| Package manager | Yarn `4.9.2`, node linker `node-modules` |
| Framework | Angular standalone, zoneless change detection |
| UI | NG-ZORRO + ng-alain/@delon |
| State | NgRx Store + Effects |
| Async | RxJS |
| Style | Less |
| Unit test | Vitest qua Angular test builder |
| Format | Prettier |
| Static analysis | ESLint + Stylelint |

Nguyên tắc:

- Ưu tiên Angular/RxJS/NG-ZORRO hoặc helper đã có trước khi thêm dependency.
- Không tạo interface, service, facade, factory hoặc shared helper chỉ để “dùng sau”.
- Chỉ đưa code vào `shared` khi đã có nhu cầu dùng chung thực tế.
- Sửa nguyên nhân tại điểm dùng chung thay vì vá cùng một lỗi ở nhiều caller.
- Không thêm dependency nếu platform hoặc dependency hiện có giải quyết được bằng ít code.

## 4. Cấu trúc thư mục

```text
src/
├── app/
│   ├── admin/              # Khu vực quản trị hệ thống
│   ├── auth/               # Đăng nhập, chọn context, token, guard, auth state
│   ├── core/               # Hạ tầng singleton: startup, i18n, HTTP
│   ├── layout/             # Layout dùng chung từ ng-alain
│   ├── portal/             # Nghiệp vụ quản lý nhà hàng
│   ├── routes/             # Root routes và exception routes
│   ├── shared/             # Thành phần thực sự dùng chung
│   ├── app.config.ts       # Toàn bộ application providers
│   └── app.ts              # Root component
├── assets/                 # Tài nguyên tĩnh, i18n, startup data
├── environments/           # Cấu hình build-time
├── styles/                 # Global/theme Less
└── main.ts                 # Bootstrap application
_mock/                      # Mock API của ng-alain
```

### 4.1 Feature mới

Một feature nghiệp vụ đặt dưới đúng bounded area:

```text
src/app/portal/<feature>/
├── <feature>.component.ts
├── <feature>.component.html
├── <feature>.component.less
├── <feature>.service.ts       # Chỉ khi có API/logic riêng
└── <feature>.component.spec.ts
```

Không bắt buộc tạo đủ mọi file. Component nhỏ có thể dùng inline template và không cần file Less. Chỉ tạo file khi có nội dung.

### 4.2 Trách nhiệm từng vùng

- `auth`: model, API và state liên quan danh tính, context, token, permission.
- `admin`: chức năng chỉ dành cho system role `ADMIN`.
- `portal`: chức năng trong organization/branch context.
- `core`: service/provider dùng toàn ứng dụng và chỉ được khởi tạo một lần.
- `shared`: component/directive/pipe/util thuần dùng ở ít nhất hai feature.
- `routes`: root routing, exception; không đặt business logic.
- `_mock`: dữ liệu phát triển cục bộ; không được import vào production feature code.

Không đặt service nghiệp vụ vào `core`. Không đặt component chỉ dùng một feature vào `shared`.

## 5. Quy tắc đặt tên

### 5.1 File và thư mục

- Dùng `kebab-case`.
- Dùng suffix phản ánh vai trò:
  - `*.component.ts`
  - `*.service.ts`
  - `*.guard.ts`
  - `*.directive.ts`
  - `*.model.ts`
  - `*.state.ts`
  - `*.actions.ts`
  - `*.reducer.ts`
  - `*.selectors.ts`
  - `*.effects.ts`
  - `*.spec.ts`
- Route file của feature dùng `<feature>.routes.ts`; exception scaffold hiện dùng `routes.ts` là legacy.

### 5.2 TypeScript

- Class, interface, type, enum: `PascalCase`.
- Biến, property, function, method: `camelCase`.
- Hằng số module-level bất biến: `UPPER_SNAKE_CASE` khi là constant thực sự; config object nội bộ có thể dùng `camelCase`.
- Observable: suffix `$`, ví dụ `user$`, `loading$`, `actions$`.
- Boolean: ưu tiên tiền tố thể hiện câu hỏi như `isAuthenticated`, `hasPermission`, `canEdit`.
- Event handler mô tả hành động: `submit`, `logout`, `selectContext`; tránh `handleClick` chung chung.

### 5.3 Angular selector

- Component nghiệp vụ mới PHẢI dùng prefix `app-`, ví dụ `app-order-list`.
- Directive nghiệp vụ mới PHẢI dùng camelCase với prefix `app`, ví dụ `[appHasPermission]`.
- Selector không prefix trong `layout`/widget scaffold là legacy.

## 6. Format và encoding

Tất cả text file PHẢI:

- UTF-8.
- Line ending LF.
- Có newline cuối file.
- Dùng 2 spaces, không dùng tab.
- Không có trailing whitespace, ngoại trừ Markdown cho phép khi có chủ đích.

Prettier:

```text
singleQuote: true
semi: true
printWidth: 140
tabWidth: 2
arrowParens: avoid
bracketSpacing: true
trailingComma: none
htmlWhitespaceSensitivity: strict
```

Quy tắc thực hành:

- TypeScript dùng dấu nháy đơn.
- Template literal chỉ dùng khi có interpolation hoặc chuỗi nhiều dòng.
- Không format thủ công trái với Prettier.
- Nội dung tiếng Việt PHẢI lưu đúng UTF-8; không commit text mojibake như `Quáº£n`, `ÄÄƒng`.

## 7. Import và dependency

Import PHẢI chia nhóm, có một dòng trống giữa các nhóm:

1. Package bên ngoài.
2. Alias nội bộ (`@core`, `@shared`, `@env/*`, `@_mock`).
3. Relative parent/sibling/index.

Trong mỗi nhóm, import được sắp xếp alphabet theo ESLint.

```ts
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { NzButtonModule } from 'ng-zorro-antd/button';

import { AuthActions } from '../../auth/store/auth.actions';
import { selectAuthLoading } from '../../auth/store/auth.selectors';
```

PHẢI:

- Xóa import không dùng.
- Không import trùng module.
- Không dùng unassigned import, ngoại trừ entry style/polyfill được cấu hình rõ.
- Dùng `import type` khi import chỉ tồn tại ở type space.
- Dùng alias hiện có cho cross-cutting public API:
  - `@core`
  - `@shared`
  - `@env/*`
  - `@_mock`
- Dùng relative import trong cùng feature hoặc giữa các file có quan hệ trực tiếp.

KHÔNG ĐƯỢC:

- Import sâu xuyên qua feature khác để lấy implementation private nếu có public API phù hợp.
- Thêm barrel file cho một file duy nhất.
- Import toàn bộ NG-ZORRO khi chỉ cần một module.
- Thêm package mới trước khi kiểm tra Angular, RxJS, NG-ZORRO, @delon và web platform.

## 8. TypeScript

Dự án bật strict mode. Code mới PHẢI tương thích:

- `strict`
- `noImplicitOverride`
- `noPropertyAccessFromIndexSignature`
- `noImplicitReturns`
- `noFallthroughCasesInSwitch`
- Angular strict injection, strict input access modifier và strict template.

### 8.1 Type

- Không dùng `any` trong code mới. Nếu dữ liệu chưa biết, dùng `unknown` rồi thu hẹp type.
- Không dùng wrapper type `String`, `Number`, `Boolean`, `Function`; dùng primitive hoặc callable type cụ thể.
- Ưu tiên `T[]` cho type đơn giản, ví dụ `string[]`; dùng `Array<T>` khi type phức tạp giúp dễ đọc.
- API response phải có type generic, theo `ApiResponse<T>`.
- Field có thể không tồn tại dùng `?`; field có tồn tại nhưng rỗng dùng union với `null`. Không hoán đổi tùy ý.
- Không dùng non-null assertion `!` trừ Angular input được framework đảm bảo hoặc có invariant rõ ràng.
- Không ép type chỉ để compiler im lặng.

### 8.2 Class member

- Dependency inject qua `inject()` như code hiện tại.
- Dependency chỉ dùng nội bộ khai báo `private readonly` khi không bị mutate.
- Property chỉ dùng trong template có thể là `protected`.
- Public API để mặc định `public` hoặc ghi rõ khi giúp dễ hiểu.
- Method không trả dữ liệu phải khai báo `: void`.
- Override PHẢI dùng từ khóa `override`.

```ts
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(Store);

  protected readonly loading$ = this.store.select(selectAuthLoading);
}
```

### 8.3 Function và control flow

- Ưu tiên early return để giảm nesting.
- Mọi nhánh của function có return type khác `void` phải trả giá trị.
- `switch` không được fallthrough.
- Dùng object spread thay cho `Object.assign` trong code immutable; mock mutation là ngoại lệ cục bộ.
- Dùng template string thay cho nối chuỗi khi có interpolation.
- Không để empty function trừ stub/framework hook có chủ đích.

## 9. Angular component và directive

### 9.1 Standalone

Component, directive và pipe mới PHẢI là standalone. Angular 21 coi standalone là mặc định; có thể ghi `standalone: true` để đồng nhất feature hiện tại nhưng không bắt buộc về kỹ thuật.

Mỗi component chỉ import dependency template thực sự dùng:

```ts
@Component({
  selector: 'app-order-list',
  imports: [AsyncPipe, NzTableModule],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.less'
})
export class OrderListComponent {}
```

- Không tạo `NgModule` mới cho feature.
- `SHARED_IMPORTS` chỉ dùng khi component thực sự cần phần lớn tập import; với component nhỏ, import trực tiếp để dependency rõ ràng.
- Dùng `ChangeDetectionStrategy.OnPush` cho component có state/input đáng kể. Dự án đã zoneless nên mọi cập nhật UI phải đi qua signal, Observable/`AsyncPipe`, input/event Angular hoặc API đánh dấu change detection hợp lệ.

### 9.2 Template inline hay file riêng

- Inline template cho component trình bày rất nhỏ, khoảng một khối ngắn và không có logic phức tạp.
- Tách `.html` khi có form, nhiều nhánh `@if`/`@for`, template reference hoặc layout dài.
- Tách `.less` khi component có style riêng.
- Không dùng inline `style="..."` cho màn hình nghiệp vụ mới; đưa vào Less hoặc dùng utility class có sẵn.

### 9.3 Template syntax

- Dùng control flow mới: `@if`, `@for`, `@switch`.
- `@for` PHẢI có `track` ổn định; ưu tiên ID nghiệp vụ, chỉ dùng `$index` cho danh sách tĩnh không reorder.
- Dùng self-closing tag khi component/tag không có content.
- Dùng strict equality trong TypeScript. Template lint hiện tắt `eqeqeq`, nhưng code mới vẫn NÊN dùng so sánh rõ ràng.
- Không gọi function nặng hoặc tạo object/array mới trực tiếp trong template.
- Không subscribe thủ công chỉ để render; dùng Observable + `AsyncPipe` hoặc signal.
- Text hiển thị dùng i18n key nếu thuộc UI dùng chung hoặc cần đa ngôn ngữ.

### 9.4 Input/output

- Input PHẢI có type cụ thể.
- Output PHẢI readonly theo ESLint.
- Không rename input/output nếu không có lý do tương thích API.
- Không dùng tên output trùng native DOM event.
- Component không được mutate object/array nhận từ input.

### 9.5 Form

- Form nghiệp vụ dùng Reactive Forms.
- Dùng `NonNullableFormBuilder` khi field không nhận `null`.
- Validation phía client phản ánh rule UX, nhưng không thay thế validation backend.
- Khi submit:
  1. Kiểm tra `form.invalid`.
  2. Đánh dấu control để hiển thị lỗi.
  3. Lấy dữ liệu bằng `getRawValue()`.
  4. Dispatch action hoặc gọi service theo kiến trúc feature.
- Button submit phải có loading state để tránh gửi lặp.
- Input nhạy cảm phải có đúng native type, ví dụ `type="password"`, `type="email"`.

## 10. State management với NgRx

Auth là global state hiện tại. Không đưa mọi state UI vào NgRx.

### 10.1 Khi nào dùng NgRx

Dùng NgRx khi state:

- Được nhiều route/component độc lập sử dụng.
- Cần effect cho luồng bất đồng bộ nhiều bước.
- Cần giữ source of truth toàn ứng dụng, như auth/token/context/permissions.

Dùng local signal/form/Observable khi state chỉ thuộc một component hoặc một feature nhỏ.

### 10.2 Cấu trúc feature state

```text
store/
├── <feature>.actions.ts
├── <feature>.effects.ts
├── <feature>.reducer.ts
├── <feature>.selectors.ts
└── <feature>.state.ts
```

### 10.3 Actions

- Dùng `createActionGroup`.
- Source là tên domain, ví dụ `Auth`.
- Event là sự kiện đã xảy ra hoặc ý định rõ ràng: `Login`, `Login Success`, `Login Failure`.
- Payload tối thiểu, có type cụ thể.
- Không dispatch action chung chung như `Set Data`.
- Failure action mang thông tin đủ để UI hiển thị nhưng không chứa dữ liệu nhạy cảm.

### 10.4 Reducer

- Reducer phải thuần, đồng bộ và immutable.
- Không gọi service, router, notification, storage hoặc parse token trong reducer.
- Mỗi `on` trả state type rõ ràng khi inference không đủ.
- Request action đặt `loading: true`, xóa lỗi cũ.
- Success/failure phải kết thúc loading.
- Logout reset về `initialState`.

### 10.5 Selectors

- Component chỉ đọc state qua selector.
- Selector không tạo side effect.
- Derived state dùng `createSelector`, không tính lặp lại trong component.
- Selector factory như `selectHasPermission(permission)` chỉ dùng cho tham số đơn giản, ổn định.
- Không expose toàn bộ feature state nếu consumer chỉ cần một field.

### 10.6 Effects

- API, navigation và notification nằm trong effect, không nằm trong reducer.
- Chọn flattening operator theo ý nghĩa:
  - `exhaustMap`: bỏ submit lặp khi request hiện tại chưa xong, phù hợp login/logout.
  - `switchMap`: hủy luồng cũ khi lựa chọn mới thay thế lựa chọn trước.
  - `concatMap`: giữ thứ tự và xử lý lần lượt.
  - `mergeMap`: chỉ dùng khi các request được phép chạy song song.
- Effect side effect thuần như navigation dùng `{ dispatch: false }`.
- Mọi request effect phải bắt lỗi và phát failure action hoặc có chiến lược lỗi rõ.
- Không nuốt lỗi làm state kẹt ở `loading: true`.

## 11. RxJS và subscription

- Observable property có suffix `$`.
- Ưu tiên compose bằng `pipe`.
- Dùng `take(1)` khi chỉ cần snapshot state một lần.
- Template dùng `AsyncPipe`.
- Subscription thủ công trong component/directive PHẢI có cleanup bằng cơ chế Angular như `takeUntilDestroyed()`, trừ Observable tự complete.
- Không subscribe lồng nhau; dùng `switchMap`, `concatMap`, `exhaustMap` hoặc `mergeMap`.
- Không dùng `setTimeout` để điều phối async business flow.
- Side effect đặt trong `tap`, transformation đặt trong `map`.
- Không mutate state trong operator transformation.

Ví dụ directive hiện tại `HasPermissionDirective` subscribe không cleanup là legacy; code mới hoặc khi sửa file này phải thêm lifecycle-safe cleanup.

## 12. HTTP, API và model

### 12.1 Service

- Mỗi domain có service API riêng khi có từ một endpoint thực sự.
- Service `providedIn: 'root'` nếu stateless và dùng toàn app.
- Component không tự ghép header token hoặc parse response envelope.
- Endpoint là path bắt đầu bằng `/api/...`; base URL do interceptor/environment xử lý.
- Return type luôn là `Observable<T>`, không subscribe trong service.

```ts
getOrders(): Observable<Order[]> {
  return this.http
    .get<ApiResponse<Order[]>>('/api/v1/orders')
    .pipe(map(response => response.data));
}
```

### 12.2 Response contract

Envelope hiện tại:

```ts
interface ApiResponse<T> {
  success: boolean;
  errorMessage: unknown | null;
  data: T;
}
```

- Tái sử dụng `ApiResponse<T>`; không tạo envelope trùng lặp.
- Model request/response đặt trong file model của domain.
- Không truyền raw backend object không type vào component.
- Nếu backend contract thay đổi, sửa model và mapping tại service/effect boundary.

### 12.3 Interceptor

`defaultInterceptor` chịu trách nhiệm:

- Ghép `environment.api.baseUrl`.
- Thêm `Accept-Language`.
- Thêm bearer token cho request cần xác thực.
- Bỏ token cho request có `ALLOW_ANONYMOUS`.
- Xử lý status HTTP và refresh flow.

Quy định:

- Endpoint public PHẢI set `ALLOW_ANONYMOUS` bằng `HttpContext`.
- Không tự thêm `Authorization` tại nhiều caller. Ngoại lệ hiện tại là bước chọn context cần identity access token riêng trước khi context token được lưu.
- Không đặt absolute URL nếu không chủ đích bỏ base URL.
- Không log token, password, request body nhạy cảm hoặc PII.
- Lỗi phải được rethrow hoặc chuyển thành failure action; không silent failure ngoài trường hợp được định nghĩa như logout local.

## 13. Authentication, token và context

Luồng hiện tại:

```text
Login
  ├─ systemRoles có ADMIN
  │    ├─ lưu identity access token
  │    └─ chuyển /admin/dashboard
  └─ user portal
       ├─ giữ access token trong auth state
       ├─ chuyển /auth/context-select
       ├─ chọn organization/employee/role
       ├─ nhận và lưu context token
       └─ chuyển /portal/dashboard
```

Quy định bảo mật:

- Không lưu token ngoài token service/state đã thống nhất nếu chưa có quyết định kiến trúc.
- Không ghi token vào log, query string hoặc DOM.
- Không decode JWT để “xác minh” chữ ký ở frontend; decode chỉ để đọc claim không nhạy cảm. Backend vẫn là nguồn quyết định.
- Không hard-code thời hạn token mới. Thời hạn nên lấy từ `exp` hoặc contract backend khi API hỗ trợ.
- Logout phải xóa token ngay cả khi API logout thất bại.
- Không gửi identity token đến API yêu cầu context token hoặc ngược lại.
- Không dùng `accessToken || ''` để gọi API trong code mới; thiếu token phải dừng flow và phát lỗi/redirect rõ ràng.
- Không lưu password trong store, storage hoặc state lâu hơn request login.

## 14. Routing và guard

- Feature route phải lazy load bằng `loadChildren` hoặc `loadComponent`.
- Root route chỉ điều phối khu vực lớn.
- Route admin phải qua `authGuard` và `adminGuard`.
- Route portal phải qua auth/context guard phù hợp.
- Route nghiệp vụ nhạy cảm phải có `permissionGuard('<PERMISSION>')`.
- Wildcard cuối cùng chuyển sang trang 404.
- Redirect phải có `pathMatch: 'full'` khi path rỗng.

Guard:

- Là functional guard (`CanActivateFn`) và dùng `inject()`.
- Trả `boolean`, `UrlTree` hoặc Observable tương ứng; ưu tiên trả `UrlTree`, không gọi `navigate()` trong guard.
- Đọc một snapshot bằng `take(1)` nếu guard không cần theo dõi liên tục.
- Không gọi API trùng lặp trong từng guard nếu state đã là source of truth.
- UI permission directive chỉ ẩn/hiện; guard bảo vệ route; backend vẫn PHẢI kiểm tra quyền.

Khi thêm menu có phân quyền, phải cập nhật đồng bộ:

1. Route.
2. Guard permission.
3. Menu visibility.
4. i18n label nếu áp dụng.
5. Backend permission contract.

## 15. Permission

Permission dùng string theo format `UPPER_SNAKE_CASE`, hiện có:

- `ORDER_READ`
- `MENU_MANAGE`
- `TABLE_MANAGE`
- `INGREDIENT_VIEW`
- `STAFF_MANAGE`
- `PAYMENT_READ`

Quy định:

- Tên permission phải đến từ contract backend, không tự sáng tạo biến thể frontend.
- Một route khai báo đúng permission tối thiểu cần thiết.
- Dùng `permissionGuard` cho route.
- Dùng `*appHasPermission="'PERMISSION'"` cho element/action trong template.
- Không xem việc ẩn button là biện pháp bảo mật.
- Nếu permission được dùng nhiều nơi, có thể tập trung thành typed constant khi duplication thực sự gây typo; không tạo enum trước nhu cầu.

## 16. Error handling và thông báo

- Lỗi API phải có đường đi đến UI hoặc error boundary phù hợp.
- Effect chuyển lỗi backend thành message an toàn, có fallback tiếng Việt.
- Không hiển thị stack trace, raw exception hoặc dữ liệu nhạy cảm cho người dùng.
- Không dùng optional chaining trên `any` làm chiến lược parse lỗi lâu dài; khi backend error contract ổn định, định nghĩa model và helper dùng chung.
- Status 401: refresh hoặc đưa về login.
- Status 403: hiển thị/điều hướng không đủ quyền theo flow.
- Status 404: resource hoặc route not found.
- Status 500: thông báo lỗi hệ thống/trang exception.
- Không dùng `console.log` trong production code. `console.warn/error` chỉ dùng cho lỗi kỹ thuật có ích khi debug và không chứa secret.

## 17. Internationalization

- Ngôn ngữ mặc định: `vi-VN`; hỗ trợ `en-US`.
- Translation file:
  - `src/assets/tmp/i18n/vi-VN.json`
  - `src/assets/tmp/i18n/en-US.json`
- Key dùng dot notation theo domain, ví dụ `menu.account.logout`.
- Khi thêm key dùng trong cả hai ngôn ngữ, PHẢI cập nhật cả hai file trong cùng thay đổi.
- Không dùng cùng key cho hai ý nghĩa khác nhau.
- Text business chỉ dùng một lần có thể để trực tiếp trong template trong giai đoạn hiện tại; text dùng chung, menu, validation và auth NÊN đưa vào i18n.
- Không trộn tiếng Việt, Anh, Trung trong cùng flow người dùng.
- File phải là UTF-8 hợp lệ.

## 18. Styling với Less

### 18.1 Phạm vi

- Style component đặt trong `<component>.component.less`.
- Global reset/theme/utilities đặt trong `src/styles/`.
- Theme variable đặt trong `src/styles/theme.less`.
- Không sửa file CSS theme được generate thủ công nếu có script sinh lại.
- `src/assets/**` bị Stylelint bỏ qua; không dùng đó để né lint cho style nghiệp vụ.

### 18.2 Quy tắc

- Dùng class có nghĩa theo component; tránh selector phụ thuộc sâu vào DOM của NG-ZORRO.
- Hạn chế `::ng-deep`; chỉ dùng khi library không cung cấp API/class phù hợp và phải ghi lý do.
- Không dùng `!important` trừ override third-party bất khả kháng.
- Không hard-code màu lặp lại; dùng theme token/variable khi giá trị mang ý nghĩa hệ thống.
- Responsive layout phải dùng grid/breakpoint hiện có trước khi viết JavaScript đo viewport.
- CSS property được Stylelint sắp theo `stylelint-config-clean-order`.
- Variables, declarations, pseudo-elements, nested rules và media query phải theo order cấu hình.
- Không để declaration bị property khác vô hiệu hóa.
- Component style production không vượt budget:
  - Warning: `6 kB`.
  - Error: `10 kB`.

### 18.3 Accessibility

Template accessibility lint đang chưa bật đầy đủ, nhưng code mới PHẢI:

- Dùng element semantic (`button`, `nav`, `main`, `label`) đúng mục đích.
- Action click dùng `button`, không dùng `div` giả button.
- Input có label hoặc accessible name.
- Icon-only button có `aria-label`.
- Đảm bảo thao tác được bằng bàn phím.
- Không truyền đạt trạng thái chỉ bằng màu.
- Modal/focus dùng behavior của NG-ZORRO thay vì tự dựng nếu có thể.

## 19. Icon và asset

- Icon NG-ZORRO phải được đăng ký trong `style-icons.ts` hoặc cơ chế auto icon hiện có.
- Chỉ thêm icon thực sự sử dụng để tránh tăng bundle.
- Asset dùng đường dẫn tương đối từ app như `./assets/...`.
- Tên asset dùng lowercase kebab-case.
- Không commit secret, dữ liệu thật của khách hàng hoặc PII vào `assets`/`_mock`.
- File demo lớn không được thêm nếu không phục vụ test hoặc yêu cầu sản phẩm.

## 20. Mock data

- `_mock` chỉ phục vụ development/test thủ công.
- Endpoint mock phải bám đúng request/response contract của API thật.
- Mock không được làm code feature phụ thuộc `@delon/mock`.
- Dữ liệu mock phải giả, không chứa dữ liệu cá nhân thật.
- Random data chỉ dùng cho hiển thị demo; unit test phải deterministic.
- Khi endpoint thật sẵn sàng, không giữ hai contract khác nhau giữa mock và backend.

## 21. Test

### 21.1 Phạm vi bắt buộc

Mọi logic không tầm thường phải có ít nhất một check chạy được, đặc biệt:

- Guard và permission.
- Reducer và selector.
- Effect success/failure.
- Mapping API response.
- Form validation hoặc business rule quan trọng.
- Money, authentication và security flow.

Không cần test getter/setter hay component placeholder không có logic.

### 21.2 Quy ước

- Test đặt cạnh source: `*.spec.ts`.
- Dùng Vitest globals: `describe`, `it`, `expect`, `vi`.
- Mỗi test độc lập; reset mock trong `afterEach`.
- Không gọi network thật.
- Không phụ thuộc thời gian hiện tại, locale máy hoặc random nếu không mock.
- Tên test mô tả behavior, ví dụ `redirects unauthenticated users to login`.
- Một test chỉ nên thất bại vì một behavior chính.
- Với Angular service/component dùng `TestBed` và provider nhỏ nhất cần thiết.

### 21.3 Cấu hình hiện tại

- Test isolation: bật.
- Test timeout: `2000 ms`.
- Hook timeout: `2000 ms`.
- Browser runner: Chromium/Playwright qua Angular builder.
- Coverage command sinh LCOV.

## 22. Logging

- Không commit `console.log`.
- `console.warn` cho trạng thái bất thường có thể phục hồi.
- `console.error` cho lỗi bootstrap hoặc lỗi kỹ thuật nghiêm trọng.
- Log không được chứa token, password, authorization header, thông tin thanh toán hoặc PII.
- Không log cùng lỗi ở service, effect và interceptor; chọn một boundary để tránh duplicate.
- Khi có logging service chính thức, component/service nghiệp vụ dùng service đó thay vì console.

## 23. Performance

- Route lớn phải lazy load.
- Không import cả module/library nếu chỉ dùng một phần.
- Dùng `track` cho list.
- Không gọi function tốn chi phí trong template.
- Không subscribe nhiều lần vào cùng cold Observable gây gọi API lặp; chia sẻ/kết cache chỉ khi có vấn đề thực.
- Không tối ưu speculative. Đo bundle, render hoặc request trước khi thêm cache/virtualization.
- Production budget:
  - Initial bundle warning `2 MB`.
  - Initial bundle error `6 MB`.
- Không tăng budget để che bundle regression nếu chưa review nguyên nhân.

## 24. Git và commit hygiene

Trước commit, Husky chạy:

```bash
npx --no-install tsc -p tsconfig.app.json --noEmit
npx --no-install lint-staged
```

`lint-staged` kiểm tra:

- `src/**/*.{html,ts}` bằng ESLint.
- `src/**/*.less` bằng Stylelint.

Quy định:

- Commit chỉ chứa thay đổi liên quan.
- Không commit `dist`, `coverage`, cache hoặc generated output ngoài asset được quản lý.
- Không bypass hook để đưa code lỗi vào repository.
- Không format/rewrite file không liên quan trong cùng commit.
- PR phải nêu thay đổi contract, route, permission hoặc migration nếu có.

## 25. Lệnh phát triển chuẩn

```bash
# Cài dependency
yarn install

# Chạy development server
yarn start

# TypeScript + template lint và style lint
yarn lint

# Unit test
yarn test

# Test có coverage
yarn test-coverage

# Production build
yarn build
```

Do `package.json` khai báo Yarn 4, ưu tiên `yarn <script>`. Không trộn lockfile/package manager.

## 26. Definition of Done

Một thay đổi chỉ hoàn tất khi:

- [ ] Đúng requirement và đúng khu vực kiến trúc.
- [ ] Không thêm abstraction/dependency/file không cần thiết.
- [ ] Type đầy đủ, không thêm `any` hoặc unsafe cast.
- [ ] Route, menu, permission và i18n được cập nhật đồng bộ nếu liên quan.
- [ ] Loading, empty, error và unauthorized state được xử lý.
- [ ] Subscription có lifecycle cleanup.
- [ ] Không lộ token/PII trong log, URL, DOM hoặc mock.
- [ ] Có test/check nhỏ nhất cho logic không tầm thường.
- [ ] `yarn lint` pass.
- [ ] `yarn test` pass.
- [ ] `yarn build` pass cho thay đổi ảnh hưởng build/runtime.
- [ ] Không có file generated/unrelated ngoài phạm vi.

## 27. Checklist review theo loại thay đổi

### 27.1 Component/page

- Selector, file name và folder đúng chuẩn.
- Standalone import tối thiểu.
- Không inline style mới.
- Template dùng `@if`/`@for` và `track`.
- Form typed và có validation.
- A11y cơ bản đầy đủ.
- Không subscribe thủ công nếu `AsyncPipe`/signal giải quyết được.

### 27.2 API/service

- Có request/response model.
- Dùng `ApiResponse<T>`.
- Endpoint public có `ALLOW_ANONYMOUS`.
- Không tự nhân bản base URL/token logic.
- Error không bị nuốt.
- Không log payload nhạy cảm.

### 27.3 NgRx

- Action payload tối thiểu.
- Reducer thuần, immutable.
- Selector là đường đọc state duy nhất của component.
- Effect dùng đúng flattening operator.
- Success và failure đều kết thúc loading.
- Navigation/notification không nằm trong reducer.

### 27.4 Route/permission

- Lazy load.
- Guard đúng tầng auth/admin/portal.
- Permission khớp backend.
- Menu không hiển thị action không có quyền.
- Backend vẫn enforce authorization.

### 27.5 Style

- Scope trong component.
- Dùng token/theme variable.
- Không `!important`/`::ng-deep` vô lý.
- Stylelint pass.
- Không vượt component style budget.

## 28. Legacy cần xử lý khi chạm tới

Không bắt buộc refactor toàn bộ ngay lập tức. Khi sửa trực tiếp file liên quan, áp dụng “boy scout rule” trong phạm vi nhỏ:

- Sửa text mojibake/encoding ở màn hình đang thay đổi.
- Không sao chép `any` từ `_mock`, startup data hoặc scaffold.
- Thêm cleanup cho subscription thủ công như `HasPermissionDirective`.
- Loại bỏ dependency inject nhưng không dùng, ví dụ `Router` trong layout nếu vẫn còn.
- Không sao chép inline `style="padding: 24px"` từ placeholder page.
- Không sao chép selector scaffold thiếu prefix.
- Chuẩn hóa lỗi API khi backend error contract ổn định.
- Rà lại refresh-token header/contract khi tích hợp backend thật; scaffold hiện còn convention cũ.
- Không coi README scaffold cũ là nguồn sự thật nếu khác source hiện tại.

Không mở rộng phạm vi PR thành “dọn toàn repository” nếu không cần cho thay đổi đang làm.

## 29. Mẫu tối thiểu cho feature mới

### Component

```ts
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NzTableModule } from 'ng-zorro-antd/table';

import { OrderService } from './order.service';

@Component({
  selector: 'app-order-list',
  imports: [AsyncPipe, NzTableModule],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderListComponent {
  private readonly orderService = inject(OrderService);

  protected readonly orders$ = this.orderService.getOrders();
}
```

### Service

```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiResponse } from '../../auth/models/auth.model';
import { Order } from './order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  getOrders(): Observable<Order[]> {
    return this.http.get<ApiResponse<Order[]>>('/api/v1/orders').pipe(map(response => response.data));
  }
}
```

Chỉ thêm NgRx store, facade, mapper hoặc shared abstraction khi feature thực sự cần; mẫu tối thiểu trên là mặc định.

