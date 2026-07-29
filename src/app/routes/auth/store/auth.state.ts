export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  contextToken: string | null;
  contexts: ContextInfo[];
  selectedContext: SelectedContext | null;
  systemRoles: string[];
  user: AuthUser | null;
  permissions: string[];
  loading: boolean;
  error: string | null;
}

export interface ContextInfo {
  employeeId: string | null;
  organizationId: string;
  organizationName: string;
  branchId: string | null;
  branchName: string | null;
  role: string;
}

export interface SelectedContext {
  employeeId: string | null;
  organizationId: string | null;
  organizationName: string | null;
  branchId: string | null;
  branchName: string | null;
  role: string | null;
}

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  avatar: string | null;
}

export const initialAuthState: AuthState = {
  accessToken: null,
  refreshToken: null,
  contextToken: null,
  contexts: [],
  selectedContext: null,
  systemRoles: [],
  user: null,
  permissions: [],
  loading: false,
  error: null
};
