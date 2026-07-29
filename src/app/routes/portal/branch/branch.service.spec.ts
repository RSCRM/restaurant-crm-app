import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BranchService } from './branch.service';

describe('BranchService', () => {
  let service: BranchService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BranchService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(BranchService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads branches by organization with backend paging convention', () => {
    service.getBranches('org-1', { page: 1, size: 10 }).subscribe(response => {
      expect(response.totalElement).toBe(1);
      expect(response.data[0].id).toBe('branch-1');
    });

    const req = http.expectOne(
      request =>
        request.method === 'GET' &&
        request.url === '/api/v1/erp/organization-branches/organization/org-1' &&
        request.params.get('page') === '1' &&
        request.params.get('size') === '10'
    );

    req.flush({
      success: true,
      errorMessage: null,
      data: {
        currentPage: 1,
        pageSize: 10,
        totalPages: 1,
        totalElement: 1,
        data: [
          {
            id: 'branch-1',
            organizationId: 'org-1',
            branchName: 'Chi nhánh 1',
            address: null,
            phone: null,
            status: 'ACTIVE',
            createdAt: '2026-07-29T00:00:00Z',
            updatedAt: '2026-07-29T00:00:00Z'
          }
        ]
      }
    });
  });

  it('loads branch detail by id', () => {
    service.getBranch('branch-1').subscribe(response => {
      expect(response.branchName).toBe('Chi nhánh 1');
    });

    const req = http.expectOne('/api/v1/erp/organization-branches/branch-1');
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      errorMessage: null,
      data: {
        id: 'branch-1',
        organizationId: 'org-1',
        branchName: 'Chi nhánh 1',
        address: null,
        phone: null,
        status: 'ACTIVE',
        createdAt: '2026-07-29T00:00:00Z',
        updatedAt: '2026-07-29T00:00:00Z'
      }
    });
  });

  it('loads current branch manager by branch id', () => {
    service.getBranchManager('branch-1').subscribe(response => {
      expect(response.managerId).toBe('employee-1');
      expect(response.managerUserId).toBe('user-1');
      expect(response.managerName).toBe('manager');
    });

    const req = http.expectOne('/api/v1/personal/branches/branch-1/manager');
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      errorMessage: null,
      data: {
        branchId: 'branch-1',
        branchName: 'Chi nhánh 1',
        employeeId: 'employee-1',
        managerId: 'employee-1',
        userId: 'user-1',
        managerUserId: 'user-1',
        username: 'manager',
        managerName: 'manager',
        email: 'manager@example.com',
        enabled: true,
        phone: '0904000001',
        status: 'ACTIVE',
        startDate: '2026-07-01',
        endDate: null,
        orgRoleId: 'role-manager',
        orgRoleName: 'MANAGER',
        role: 'MANAGER'
      }
    });
  });

  it('assigns branch manager with Employee.id as managerId payload', () => {
    service.assignBranchManager('branch-1', { managerId: 'employee-1' }).subscribe(response => {
      expect(response.employeeId).toBe('employee-1');
    });

    const req = http.expectOne('/api/v1/personal/branches/branch-1/manager');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ managerId: 'employee-1' });
    req.flush({
      success: true,
      errorMessage: null,
      data: {
        branchId: 'branch-1',
        branchName: 'Chi nhánh 1',
        employeeId: 'employee-1',
        userId: 'user-1',
        username: 'manager',
        email: 'manager@example.com',
        enabled: true,
        phone: '0904000001',
        status: 'ACTIVE',
        startDate: '2026-07-01',
        endDate: null,
        orgRoleId: 'role-manager',
        orgRoleName: 'MANAGER'
      }
    });
  });

  it('removes current branch manager by branch id', () => {
    service.removeBranchManager('branch-1').subscribe(response => {
      expect(response).toBeNull();
    });

    const req = http.expectOne('/api/v1/personal/branches/branch-1/manager');
    expect(req.request.method).toBe('DELETE');
    req.flush({
      success: true,
      errorMessage: null,
      data: null
    });
  });
});
