export interface OrgPermissionResponse {
  id: string;
  permissionName: string;
}

export interface OrgRoleResponse {
  id: string;
  organizationId: string;
  roleName: string;
  dataScope: string;
  permissions: OrgPermissionResponse[];
}

/** Dùng chung cho cả tạo (A4) và sửa (A5) — backend chỉ nhận đúng hai field này. */
export interface OrgRoleRequest {
  roleName: string;
  permissionIds: string[];
}
