export interface ApiResponse<T> {
  success: boolean;
  errorMessage: unknown | null;
  data: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  contexts: ContextInfoResponse[];
  systemRoles: string[];
}

export interface ContextInfoResponse {
  employeeId: string | null;
  organizationId: string;
  organizationName: string;
  branchId: string | null;
  branchName: string | null;
  role: string;
}

export interface ContextSelectionRequest {
  employeeId?: string;
  branchId?: string;
  organizationId: string;
  role: string;
}

export interface ContextSelectionResponse {
  contextToken: string;
}

export interface TokenPayload {
  sub: string;
  userId: string;
  type: 'IDENTITY' | 'CONTEXT';
  employeeId?: string;
  organizationId?: string;
  branchId?: string;
  orgRole?: string;
  permission?: string[];
  exp: number;
  iat: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
}
