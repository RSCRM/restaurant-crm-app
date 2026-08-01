import '@angular/compiler';
import { describe, expect, it } from 'vitest';

import { AuthActions } from './auth.actions';
import { authReducer } from './auth.reducer';
import { initialAuthState } from './auth.state';

describe('authReducer', () => {
  it('stores permissions from the selected context token', () => {
    const state = authReducer(
      initialAuthState,
      AuthActions.selectContextSuccess({
        contextToken: 'context-token',
        permissions: ['PROFILE_VIEW', 'PROFILE_UPDATE']
      })
    );

    expect(state.permissions).toEqual(['PROFILE_VIEW', 'PROFILE_UPDATE']);
  });
});
