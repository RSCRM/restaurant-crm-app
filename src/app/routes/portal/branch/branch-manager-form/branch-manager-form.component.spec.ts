import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { of, throwError } from 'rxjs';

import { OrganizationBranchStatus } from '../branch.model';
import { BranchService } from '../branch.service';
import { BranchManagerFormComponent } from './branch-manager-form.component';

describe('BranchManagerFormComponent', () => {
  let fixture: ComponentFixture<BranchManagerFormComponent>;
  let component: BranchManagerFormComponent;
  let branchService: { assignBranchManager: ReturnType<typeof vi.fn> };
  let modalRef: { destroy: ReturnType<typeof vi.fn> };
  let message: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    branchService = { assignBranchManager: vi.fn() };
    modalRef = { destroy: vi.fn() };
    message = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [BranchManagerFormComponent],
      providers: [
        { provide: BranchService, useValue: branchService },
        { provide: NzModalRef, useValue: modalRef },
        { provide: NzMessageService, useValue: message },
        {
          provide: NZ_MODAL_DATA,
          useValue: {
            branch: {
              id: 'branch-1',
              organizationId: 'org-1',
              branchName: 'Chi nhánh 1',
              address: null,
              phone: null,
              status: OrganizationBranchStatus.ACTIVE,
              createdAt: '2026-07-29T00:00:00Z',
              updatedAt: '2026-07-29T00:00:00Z',
              manager: null
            },
            mode: 'assign'
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BranchManagerFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('requires managerId', () => {
    component.form.controls.managerId.setValue('');

    expect(component.form.invalid).toBe(true);
  });

  it('does not call API when form is invalid', () => {
    component.form.controls.managerId.setValue('');

    component.submit();

    expect(branchService.assignBranchManager).not.toHaveBeenCalled();
    expect(modalRef.destroy).not.toHaveBeenCalled();
  });

  it('submits managerId payload and closes on success', () => {
    branchService.assignBranchManager.mockReturnValue(
      of({
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
      })
    );
    component.form.controls.managerId.setValue('employee-1');

    component.submit();

    expect(branchService.assignBranchManager).toHaveBeenCalledWith('branch-1', { managerId: 'employee-1' });
    expect(message.success).toHaveBeenCalled();
    expect(modalRef.destroy).toHaveBeenCalledWith({
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
    });
  });

  it('keeps modal open when assign API fails', () => {
    branchService.assignBranchManager.mockReturnValue(
      throwError(() => ({
        error: {
          errorMessage: {
            code: 'BRANCH_MANAGER_1005'
          }
        }
      }))
    );
    component.form.controls.managerId.setValue('employee-1');

    component.submit();

    expect(message.error).toHaveBeenCalledWith('Nhân viên chưa có vai trò Manager');
    expect(modalRef.destroy).not.toHaveBeenCalled();
    expect(component.submitting).toBe(false);
  });
});
