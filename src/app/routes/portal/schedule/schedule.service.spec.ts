import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ScheduleService } from './schedule.service';

describe('ScheduleService', () => {
  it('requests the authenticated employee schedule for the selected range', () => {
    TestBed.configureTestingModule({ providers: [ScheduleService, provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(ScheduleService);
    const http = TestBed.inject(HttpTestingController);

    service.getPersonalSchedule('2026-08-01', '2026-08-07').subscribe(data => expect(data).toEqual([]));

    const request = http.expectOne(req => req.url === '/api/v1/erp/schedules/me');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('from')).toBe('2026-08-01');
    expect(request.request.params.get('to')).toBe('2026-08-07');
    request.flush({ data: [] });

    service.getManagedSchedules('2026-08-01', '2026-08-07').subscribe(data => expect(data).toEqual([]));
    const managedRequest = http.expectOne(req => req.url === '/api/v1/erp/schedules/staff');
    expect(managedRequest.request.method).toBe('GET');
    managedRequest.flush({ data: [] });
    http.verify();
  });

  it('creates one schedule for every day in the selected range', () => {
    TestBed.configureTestingModule({ providers: [ScheduleService, provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(ScheduleService);
    const http = TestBed.inject(HttpTestingController);

    service
      .createSchedules({
        employeeIds: ['chef-1'],
        from: '2026-08-21',
        to: '2026-08-25',
        startTime: '08:00',
        endTime: '16:00'
      })
      .subscribe(data => expect(data).toHaveLength(5));

    const requests = http.match('/api/v1/erp/schedules');
    expect(requests.map(request => request.request.body.workDate)).toEqual([
      '2026-08-21',
      '2026-08-22',
      '2026-08-23',
      '2026-08-24',
      '2026-08-25'
    ]);
    requests.forEach(request => request.flush({ data: { id: request.request.body.workDate } }));
    http.verify();
  });
});
