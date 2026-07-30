import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';

import { PortalDashboardComponent } from './portal-dashboard.component';
import { AuthService } from '../../auth/services/auth.service';
import { selectSelectedContext } from '../../auth/store/auth.selectors';
import { SelectedContext } from '../../auth/store/auth.state';
import { BranchManagerResponse, EmployeeStatus, OrganizationBranchStatus } from '../branch/branch.model';
import { BranchService } from '../branch/branch.service';

describe('PortalDashboardComponent', () => {
  let fixture: ComponentFixture<PortalDashboardComponent>;
  let component: PortalDashboardComponent;
  let store: MockStore;
  let branchService: Pick<BranchService, 'getBranch' | 'getBranches' | 'getBranchManager'>;

  const context: SelectedContext = {
    employeeId: 'owner-employee',
    organizationId: 'org-1',
    organizationName: 'Org 1',
    branchId: 'branch-1',
    branchName: 'Branch 1',
    role: 'OWNER'
  };

  const manager: BranchManagerResponse = {
    branchId: 'branch-1',
    branchName: 'Branch 1',
    branchAddress: '1 Main',
    branchPhone: '0904000001',
    branchStatus: OrganizationBranchStatus.ACTIVE,
    employeeId: 'employee-1',
    managerId: 'employee-1',
    userId: 'user-1',
    managerUserId: 'user-1',
    username: 'manager',
    managerName: 'manager',
    email: 'manager@example.com',
    enabled: true,
    phone: '0904000002',
    status: EmployeeStatus.ACTIVE,
    startDate: '2026-07-01',
    endDate: null,
    orgRoleId: 'role-manager',
    orgRoleName: 'MANAGER',
    role: 'MANAGER'
  };

  beforeEach(async () => {
    branchService = {
      getBranch: vi.fn(),
      getBranches: vi.fn(() =>
        of({
          currentPage: 1,
          pageSize: 50,
          totalPages: 0,
          totalElement: 0,
          data: []
        })
      ),
      getBranchManager: vi.fn(() => of(manager))
    };

    TestBed.configureTestingModule({
      imports: [PortalDashboardComponent],
      providers: [
        provideMockStore({
          selectors: [{ selector: selectSelectedContext, value: context }]
        }),
        { provide: BranchService, useValue: branchService },
        { provide: AuthService, useValue: { setSelectedContext: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } }
      ]
    }).overrideComponent(PortalDashboardComponent, { set: { template: '' } });
    await TestBed.compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(PortalDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    store.resetSelectors();
    vi.restoreAllMocks();
  });

  it('uses selected context and manager summary without calling branch detail endpoint', () => {
    expect(branchService.getBranch).not.toHaveBeenCalled();
    expect(branchService.getBranchManager).toHaveBeenCalledWith('branch-1');
    expect(component.currentBranchName).toBe('Branch 1');
    expect(component.dashboardError).toBeNull();
  });
});
