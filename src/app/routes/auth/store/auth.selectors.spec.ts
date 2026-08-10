import { selectPortalMenuState } from './auth.selectors';
import { ContextInfo } from './auth.state';

const context = (role: string): ContextInfo => ({
  employeeId: role === 'OWNER' ? null : 'employee-1',
  organizationId: 'organization-1',
  organizationName: 'Organization',
  branchId: role === 'OWNER' ? null : 'branch-1',
  branchName: role === 'OWNER' ? null : 'Branch',
  role
});

describe('selectPortalMenuState', () => {
  it('enables context-aware features for one owner context only', () => {
    expect(selectPortalMenuState.projector(false, false, [], [context('OWNER')]).featureContextReady).toBe(true);
    expect(selectPortalMenuState.projector(false, false, [], [context('MANAGER')]).featureContextReady).toBe(false);
  });
});
