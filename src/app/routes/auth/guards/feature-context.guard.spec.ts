import { findSingleOwnerContext } from './feature-context.guard';
import { ContextInfo } from '../store/auth.state';

const context = (role: string, organizationId: string): ContextInfo => ({
  employeeId: null,
  organizationId,
  organizationName: organizationId,
  branchId: null,
  branchName: null,
  role
});

describe('findSingleOwnerContext', () => {
  it('returns the only owner context', () => {
    expect(findSingleOwnerContext([context('MANAGER', 'manager-org'), context('OWNER', 'owner-org')])?.organizationId).toBe('owner-org');
  });

  it('requires manual selection when owner has multiple organizations', () => {
    expect(findSingleOwnerContext([context('OWNER', 'org-1'), context('OWNER', 'org-2')])).toBeNull();
  });
});
