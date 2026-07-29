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
  fullName: string | null;
  username: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  roles: RoleResponse[];
  createdAt: string;
}
