import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CustomerService } from './customer.service';

describe('Service: Customer', () => {
  let service: CustomerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CustomerService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(CustomerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should identify customer', () => {
    const dummyResponse = { success: true, data: { id: 'c1', phone: '0966888888' } };
    service.identifyCustomer('0966888888', 'org1').subscribe(res => {
      expect(res.success).toBe(true);
      expect(res.data.phone).toBe('0966888888');
    });

    const req = httpMock.expectOne('/api/v1/crm/customers/identify');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ phone: '0966888888', restaurantId: 'org1' });
    req.flush(dummyResponse);
  });

  it('should get wallet balance', () => {
    const dummyResponse = { success: true, data: { currentPoints: 100 } };
    service.getWalletBalance('c1', 'org1').subscribe(res => {
      expect(res.data.currentPoints).toBe(100);
    });

    const req = httpMock.expectOne('/api/v1/crm/wallets/balance?customerId=c1&organizationId=org1');
    expect(req.request.method).toBe('GET');
    req.flush(dummyResponse);
  });
});
