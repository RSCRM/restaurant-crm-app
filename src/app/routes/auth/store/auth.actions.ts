import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { AuthUser, ContextInfo } from './auth.state';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Init': emptyProps(),
    'Restore Auth': props<{ accessToken: string; systemRoles: string[]; contextToken: string | null }>(),

    'Login': props<{ email: string; password: string }>(),
    'Login Success': props<{ accessToken: string; refreshToken: string; contexts: ContextInfo[]; systemRoles: string[] }>(),
    'Login Failure': props<{ error: string }>(),

    'Select Context': props<{ organizationId: string; employeeId?: string; role: string }>(),
    'Select Context Success': props<{ contextToken: string }>(),
    'Select Context Failure': props<{ error: string }>(),

    'Logout': emptyProps(),
    'Logout Success': emptyProps(),

    'Clear Error': emptyProps()
  }
});
