import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { of, throwError } from 'rxjs';
import {
  LeftOutline,
  ClockCircleOutline,
  PlusOutline,
  BellFill,
  SyncOutline,
  ShoppingCartOutline,
  ArrowRightOutline,
  PhoneOutline,
  PlusCircleOutline
} from '@ant-design/icons-angular/icons';

import { CookingStatusComponent } from './cooking-status.component';
import { CookingStatusService } from './cooking-status.service';
import { OrderCookingStatusResponse, OrderStatus } from './cooking-status.model';

describe('CookingStatusComponent', () => {
  let component: CookingStatusComponent;
  let fixture: ComponentFixture<CookingStatusComponent>;

  const mockService = {
    getActiveOrderCookingStatusByTable: vi.fn(),
    getProducts: vi.fn(),
    createOrder: vi.fn(),
    subscribeCookingStatusSSE: vi.fn()
  };

  const mockMessageService = {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn()
  };

  const mockRouter = {
    navigate: vi.fn()
  };

  const mockOrder: OrderCookingStatusResponse = {
    orderId: 'order-1',
    orderCode: 'ORD123',
    tableId: 't1',
    customerPhone: '0987654321',
    status: OrderStatus.PENDING,
    subtotal: 100000,
    discountAmount: 10000,
    totalAmount: 90000,
    items: [],
    updatedAt: new Date().toISOString()
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    mockService.getActiveOrderCookingStatusByTable.mockReturnValue(of(mockOrder));
    mockService.getProducts.mockReturnValue(of([]));
    mockService.subscribeCookingStatusSSE.mockReturnValue(of(mockOrder));

    await TestBed.configureTestingModule({
      imports: [CookingStatusComponent],
      providers: [
        { provide: CookingStatusService, useValue: mockService },
        { provide: NzMessageService, useValue: mockMessageService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ tableId: 't1' }),
            snapshot: { queryParams: { branchId: 'b1' } }
          }
        },
        {
          provide: NZ_ICONS,
          useValue: [
            LeftOutline,
            ClockCircleOutline,
            PlusOutline,
            BellFill,
            SyncOutline,
            ShoppingCartOutline,
            ArrowRightOutline,
            PhoneOutline,
            PlusCircleOutline
          ]
        },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CookingStatusComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create and load active order', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.tableId).toBe('t1');
    expect(component.viewMode).toBe('STATUS');
    expect(component.activeOrder).toEqual(mockOrder);
    expect(mockService.subscribeCookingStatusSSE).toHaveBeenCalledWith('order-1');
  });

  it('should switch to menu when table has no active order', () => {
    mockService.getActiveOrderCookingStatusByTable.mockReturnValue(throwError(() => new Error('Not Found')));
    fixture.detectChanges();
    
    expect(component.activeOrder).toBeNull();
    expect(component.viewMode).toBe('MENU');
    expect(mockService.getProducts).toHaveBeenCalled();
  });

  it('should add to cart correctly', () => {
    fixture.detectChanges();
    const product = { id: 'p1', productName: 'Pho', price: 50000, status: 'AVAILABLE' as const };
    component.addToCart(product);

    expect(component.cart.has('p1')).toBe(true);
    expect(component.cart.get('p1')?.quantity).toBe(1);
    expect(component.getCartTotal()).toBe(50000);
  });
});
