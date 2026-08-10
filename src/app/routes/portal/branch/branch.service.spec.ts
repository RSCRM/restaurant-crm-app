import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BranchService } from './branch.service';
import { OrganizationBranchStatus } from './branch.model';

describe('BranchService', () => {
  let service: BranchService;
  let http: HttpTestingController;

  const branch = {
    id: 'branch-1',
    organizationId: 'org-1',
    branchName: 'Branch 1',
    address: null,
    phone: null,
    status: OrganizationBranchStatus.ACTIVE,
    createdAt: '2026-07-29T00:00:00Z',
    updatedAt: '2026-07-29T00:00:00Z'
  };

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
        data: [branch]
      }
    });
  });

  it('loads branches with keyword and status filters', () => {
    service
      .getBranches('org-1', { page: 2, size: 20, keyword: ' Branch ', status: OrganizationBranchStatus.ACTIVE })
      .subscribe(response => {
        expect(response.totalElement).toBe(1);
      });

    const req = http.expectOne(
      request =>
        request.method === 'GET' &&
        request.url === '/api/v1/erp/organization-branches/organization/org-1' &&
        request.params.get('page') === '2' &&
        request.params.get('size') === '20' &&
        request.params.get('keyword') === 'Branch' &&
        request.params.get('status') === OrganizationBranchStatus.ACTIVE
    );

    req.flush({
      success: true,
      errorMessage: null,
      data: {
        currentPage: 2,
        pageSize: 20,
        totalPages: 1,
        totalElement: 1,
        data: [branch]
      }
    });
  });

  it('loads branch detail by id', () => {
    service.getBranch('branch-1').subscribe(response => {
      expect(response.branchName).toBe('Branch 1');
    });

    const req = http.expectOne('/api/v1/erp/organization-branches/branch-1');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, errorMessage: null, data: branch });
  });

  it('creates branch', () => {
    const request = {
      organizationId: 'org-1',
      branchName: 'Branch 1',
      address: 'Address 1',
      phone: '0902001001',
      status: OrganizationBranchStatus.ACTIVE
    };

    service.createBranch(request).subscribe(response => {
      expect(response.id).toBe('branch-1');
    });

    const req = http.expectOne('/api/v1/erp/organization-branches');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ success: true, errorMessage: null, data: branch });
  });

  it('updates branch', () => {
    const request = {
      branchName: 'Branch 1 Updated',
      address: 'Address 2',
      phone: '0902001002',
      status: OrganizationBranchStatus.INACTIVE
    };

    service.updateBranch('branch-1', request).subscribe(response => {
      expect(response.id).toBe('branch-1');
    });

    const req = http.expectOne('/api/v1/erp/organization-branches/branch-1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(request);
    req.flush({ success: true, errorMessage: null, data: { ...branch, ...request } });
  });

  it('deletes branch', () => {
    service.deleteBranch('branch-1').subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = http.expectOne('/api/v1/erp/organization-branches/branch-1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, errorMessage: null, data: null });
  });
});