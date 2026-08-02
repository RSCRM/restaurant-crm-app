import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { UserStatus } from './profile.model';
import { ProfileService } from './profile.service';
import { AuthService } from '../../auth/services/auth.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProfileService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getAccessToken: () => 'identity-token' } }
      ]
    });
    service = TestBed.inject(ProfileService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('returns the authenticated user profile from the API envelope', () => {
    const profile = {
      id: 'user-1',
      userId: 'user-1',
      employeeId: null,
      fullName: null,
      username: 'admin',
      email: 'admin@example.com',
      phone: null,
      status: UserStatus.ACTIVE,
      roles: [],
      createdAt: '2026-07-22T00:00:00Z'
    };

    service.getMyInfo().subscribe(result => expect(result).toEqual(profile));

    const request = http.expectOne('/api/v1/profile/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer identity-token');
    request.flush({ success: true, data: profile });
  });

  it('matches every profile endpoint', () => {
    service.getAll().subscribe();
    expect(http.expectOne(request => request.url === '/api/v1/profile').request.method).toBe('GET');

    service.getById('profile-1').subscribe();
    expect(http.expectOne('/api/v1/profile/profile-1').request.method).toBe('GET');

    service.updateMyInfo({ fullName: 'New name', phone: null }).subscribe();
    const updateRequest = http.expectOne('/api/v1/profile/me').request;
    expect(updateRequest.method).toBe('PUT');
    expect(updateRequest.headers.get('Authorization')).toBe('Bearer identity-token');

    service.updateStaff('employee-1', { fullName: 'Staff', phone: null, email: null }).subscribe();
    expect(http.expectOne('/api/v1/profile/staff/employee-1').request.method).toBe('PUT');
  });
});
