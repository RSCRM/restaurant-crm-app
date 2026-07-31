export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
  PENDING = 'PENDING'
}

export interface PermissionResponse {
  id: string;
  permissionName: string;
}

export interface RoleResponse {
  id: string;
  roleName: string;
  permissions: PermissionResponse[];
}

export interface UserProfileResponse {
  id: string;
  userId: string;
  employeeId: string | null;
  fullName: string | null;
  username: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  roles: RoleResponse[];
  createdAt: string;
}

export interface ProfileUpdateRequest {
  fullName: string | null;
  phone: string | null;
}

export interface StaffProfileUpdateRequest extends ProfileUpdateRequest {
  email: string | null;
}

export interface PagingResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElement: number;
  data: T[];
}
