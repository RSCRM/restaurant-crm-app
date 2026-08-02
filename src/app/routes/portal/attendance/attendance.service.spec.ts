import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AttendanceService } from './attendance.service';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AttendanceService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AttendanceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.unstubAllGlobals();
  });

  it('matches every attendance endpoint', () => {
    service.getCurrentQr().subscribe();
    expect(http.expectOne('/api/v1/erp/attendances/qr').request.method).toBe('GET');

    service.checkIn({ qrToken: 'token' }).subscribe();
    const checkIn = http.expectOne('/api/v1/erp/attendances/check-in');
    expect(checkIn.request.method).toBe('POST');
    expect(checkIn.request.body).toEqual({ qrToken: 'token' });

    service.checkOut().subscribe();
    expect(http.expectOne('/api/v1/erp/attendances/check-out').request.method).toBe('POST');

    service.getMyHistory('2026-07-01', '2026-07-31', 2, 20).subscribe();
    const history = http.expectOne(request => request.url === '/api/v1/erp/attendances/me');
    expect(history.request.method).toBe('GET');
    expect(history.request.params.get('from')).toBe('2026-07-01');
    expect(history.request.params.get('to')).toBe('2026-07-31');
    expect(history.request.params.get('page')).toBe('2');
    expect(history.request.params.get('size')).toBe('20');

    service.getBranchAttendance('2026-07-31').subscribe();
    const branch = http.expectOne(request => request.url === '/api/v1/erp/attendances/branch');
    expect(branch.request.method).toBe('GET');
    expect(branch.request.params.get('date')).toBe('2026-07-31');

    service.getEmployeeHistory('employee-1', '2026-07-01', '2026-07-31', 2, 20, 'branch-1').subscribe();
    const employeeHistory = http.expectOne(request => request.url === '/api/v1/erp/attendances/branch/employees/employee-1/history');
    expect(employeeHistory.request.method).toBe('GET');
    expect(employeeHistory.request.params.get('branchId')).toBe('branch-1');
  });

  it('reuses an unexpired QR unless reload is forced', () => {
    const qr = {
      qrToken: 'same-token',
      qrSessionId: 'session-1',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    };

    service.getCurrentQr('branch-1').subscribe(value => expect(value).toEqual(qr));
    http.expectOne(request => request.url === '/api/v1/erp/attendances/qr').flush({ data: qr });

    service.getCurrentQr('branch-1').subscribe(value => expect(value).toEqual(qr));
    http.expectNone(request => request.url === '/api/v1/erp/attendances/qr');

    service.getCurrentQr('branch-1', true).subscribe();
    http.expectOne(request => request.url === '/api/v1/erp/attendances/qr').flush({ data: qr });
  });

  it('receives real-time attendance updates', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('event:ATTENDANCE_UPDATED\ndata:employee-1\n\n'));
      }
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(stream)));

    await new Promise<void>((resolve, reject) => {
      const subscription = service.watchBranchAttendance('branch-1').subscribe({
        next: () => {
          subscription.unsubscribe();
          resolve();
        },
        error: reject
      });
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/erp/attendances/subscribe?branchId=branch-1',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });
});
