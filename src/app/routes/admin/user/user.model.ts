// === Enums ===

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  DELETED = 'DELETED'
}

// === Request DTOs ===

export interface UserCreationRequest {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone: string;
}

export interface UserSearchRequest {
  username?: string;
  email?: string;
  status?: UserStatus;
  roleName?: string;
}

export interface UserRolesUpdateRequest {
  roleIds: string[];
}

// === Response DTOs ===

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  status: UserStatus;
  roles: RoleResponse[];
}

export interface RoleResponse {
  id: string;
  roleName: string;
  dataScope: string;
  permissions: unknown[];
}

// === Paging (reuse from license or define locally) ===

export interface PagingResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElement: number;
  data: T[];
}
