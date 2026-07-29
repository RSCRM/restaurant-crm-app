import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { ContextInfo, SelectedContext } from './auth.state';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Init: emptyProps(),
    'Restore Auth': props<{
      accessToken: string;
      systemRoles: string[];
      contexts: ContextInfo[];
      contextToken: string | null;
      permissions: string[];
      selectedContext: SelectedContext | null;
    }>(),

    Login: props<{ email: string; password: string }>(),
    'Login Success': props<{ accessToken: string; refreshToken: string; contexts: ContextInfo[]; systemRoles: string[] }>(),
    'Login Failure': props<{ error: string }>(),

    'Select Context': props<{
      organizationId: string;
      organizationName?: string;
      employeeId?: string;
      branchId?: string | null;
      branchName?: string | null;
      role: string;
    }>(),
    'Select Context Success': props<{ contextToken: string; permissions: string[]; selectedContext: SelectedContext | null }>(),
    'Select Context Failure': props<{ error: string }>(),
    'Update Selected Context': props<{ selectedContext: SelectedContext }>(),

    Logout: emptyProps(),
    'Logout Success': emptyProps(),

    'Clear Error': emptyProps()
  }
});
