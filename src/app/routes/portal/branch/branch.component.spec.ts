import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ALAIN_I18N_TOKEN } from '@delon/theme';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Observable, Subject, of, throwError } from 'rxjs';

import { BranchComponent } from './branch.component';
import { BranchManagerResponse, EmployeeStatus, OrganizationBranchResponse, OrganizationBranchStatus } from './branch.model';
import { BranchService } from './branch.service';
import { selectPermissions, selectSelectedContext } from '../../auth/store/auth.selectors';
import { SelectedContext } from '../../auth/store/auth.state';

interface I18nMock {
  currentLang: string;
  defaultLang: string;
  change: Observable<string>;
  fanyi: (key: string) => string;
}

interface ModalConfirmConfig {
  nzOnOk?: () => void;
}

describe('BranchComponent', () => {
  let fixture: ComponentFixture<BranchComponent>;
  let component: BranchComponent;
  let store: MockStore;
  let branchService: Pick<BranchService, 'getBranch' | 'getBranchManager' | 'assignBranchManager' | 'removeBranchManager'>;
  let modal: { confirm: ReturnType<typeof vi.fn> };

  const context: SelectedContext = {
    employeeId: 'owner-employee',
    organizationId: 'org-1',
    organizationName: 'Org 1',
    branchId: 'branch-1',
    branchName: 'Branch 1',
    role: 'OWNER'
  };

  const branch: OrganizationBranchResponse = {
    id: 'branch-1',
    organizationId: 'org-1',
    managerId: null,
    branchName: 'Branch 1',
    branchAddress: '1 Main',
    branchPhone: '0904000001',
    branchStatus: OrganizationBranchStatus.ACTIVE,
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
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

  const emptyManager: BranchManagerResponse = {
    ...manager,
    employeeId: null,
    managerId: null,
    userId: null,
    managerUserId: null,
    username: null,
    managerName: null,
    email: null,
    enabled: false,
    phone: null,
    status: null,
    startDate: null,
    orgRoleId: null,
    orgRoleName: null,
    role: null
  };

  beforeEach(async () => {
    branchService = {
      getBranch: vi.fn(() => of(branch)),
      getBranchManager: vi.fn(() => of(emptyManager)),
      assignBranchManager: vi.fn(() => of(manager)),
      removeBranchManager: vi.fn(() => of(emptyManager))
    };
    modal = {
      confirm: vi.fn((config: ModalConfirmConfig) => config.nzOnOk?.())
    };
    const langChange$ = new Subject<string>();
    const i18nMock: I18nMock = {
      currentLang: 'en-US',
      defaultLang: 'en-US',
      change: langChange$.asObservable(),
      fanyi: (key: string) => key
    };

    TestBed.configureTestingModule({
      imports: [BranchComponent],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectSelectedContext, value: context },
            { selector: selectPermissions, value: ['BRANCH_MANAGER_UPDATE', 'BRANCH_MANAGER_DELETE'] }
          ]
        }),
        { provide: BranchService, useValue: branchService },
        { provide: NzModalService, useValue: modal },
        { provide: NzNotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: ALAIN_I18N_TOKEN, useValue: i18nMock }
      ]
    }).overrideComponent(BranchComponent, { set: { template: '' } });
    TestBed.overrideProvider(NzModalService, { useValue: modal });
    await TestBed.compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(BranchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    store.resetSelectors();
    vi.restoreAllMocks();
  });

  it('loads branch context and current manager', () => {
    expect(branchService.getBranch).not.toHaveBeenCalled();
    expect(branchService.getBranchManager).toHaveBeenCalledWith('branch-1');
    expect(component.branch?.id).toBe('branch-1');
  });

  it('uses manager response branch details without calling organization branch detail endpoint', () => {
    vi.mocked(branchService.getBranch).mockReturnValueOnce(throwError(() => ({ status: 403 })));
    vi.mocked(branchService.getBranchManager).mockReturnValueOnce(of(manager));

    component.reload();

    expect(branchService.getBranch).not.toHaveBeenCalled();
    expect(component.branch?.branchAddress).toBe('1 Main');
    expect(component.branch?.branchPhone).toBe('0904000001');
    expect(component.branch?.branchStatus).toBe(OrganizationBranchStatus.ACTIVE);
    expect(component.errorMessageKey).toBeNull();
  });

  it('shows empty state when branch has no manager', () => {
    expect(component.hasManager()).toBe(false);
  });

  it('assigns manager with managerId equal to Employee.id', () => {
    component.openManagerModal('assign');
    component.managerForm.controls.managerId.setValue('employee-1');
    component.submitManager();

    expect(branchService.assignBranchManager).toHaveBeenCalledWith('branch-1', { managerId: 'employee-1' });
    expect(component.managerModalVisible).toBe(false);
  });

  it('keeps the assign modal open when assign fails', () => {
    vi.mocked(branchService.assignBranchManager).mockReturnValueOnce(
      throwError(() => ({
        error: { errorMessage: { code: 'BRANCH_MANAGER_1005' } }
      }))
    );

    component.openManagerModal('assign');
    component.managerForm.controls.managerId.setValue('employee-1');
    component.submitManager();

    expect(component.managerModalVisible).toBe(true);
    expect(component.managerErrorMessageKey).toBe('branch.manager.errors.invalidRole');
  });

  it('uses the same modal state for replace manager', () => {
    component.manager = manager;
    component.openManagerModal('replace');

    expect(component.managerModalMode).toBe('replace');
    expect(component.managerForm.controls.managerId.value).toBe('employee-1');
  });

  it('confirms before removing manager', () => {
    component.manager = manager;
    component.confirmRemoveManager();

    expect(modal.confirm).toHaveBeenCalled();
    expect(branchService.removeBranchManager).toHaveBeenCalledWith('branch-1');
  });
});
