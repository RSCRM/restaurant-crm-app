import { AuthActions } from './auth.actions';
import { authReducer } from './auth.reducer';
import { initialAuthState } from './auth.state';

describe('authReducer', () => {
  it('clears the previous context when another user logs in', () => {
    const state = {
      ...initialAuthState,
      contextToken: 'old-context-token',
      permissions: ['TABLE_MAP_READ']
    };

    const nextState = authReducer(
      state,
      AuthActions.loginSuccess({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        contexts: [],
        systemRoles: ['USER']
      })
    );

    expect(nextState.contextToken).toBeNull();
    expect(nextState.permissions).toEqual([]);
  });
});
