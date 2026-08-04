export interface CategoryResponse {
  id: string;
  branchId: string;
  categoryName: string;
  description: string | null;
  displayOrder: number | null;
}

export interface ProductResponse {
  id: string;
  branchId: string;
  categoryId: string | null;
  productName: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  status: string;
  requiresPreparation: boolean;
}

export interface ComboResponse {
  id: string;
  branchId: string;
  comboName: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  status: string;
  items: ComboItemResponse[];
}

export interface ComboItemResponse {
  id: string;
  comboId: string;
  productId: string;
  quantity: number;
  modifierOptionIds: string[];
}

export interface ModifierGroupResponse {
  id: string;
  productId: string;
  groupName: string;
  description: string | null;
  minSelection: number;
  maxSelection: number;
}

export interface ModifierOptionResponse {
  id: string;
  groupId: string;
  optionName: string;
  additionalPrice: number;
  status: string;
}

export interface CreateCategoryRequest {
  branchId: string;
  categoryName: string;
  description?: string;
  displayOrder?: number;
}

export interface CreateProductRequest {
  branchId: string;
  categoryId?: string;
  productName: string;
  description?: string;
  price: number;
  status?: string;
  requiresPreparation?: boolean;
}

export interface CreateComboRequest {
  branchId: string;
  comboName: string;
  description?: string;
  price: number;
  status?: string;
}

export interface ComboItemRequest {
  productId: string;
  quantity: number;
  modifierOptionIds: string[];
}

export interface CreateModifierGroupRequest {
  groupName: string;
  description?: string;
  minSelection: number;
  maxSelection: number;
}

export interface CreateModifierOptionRequest {
  optionName: string;
  additionalPrice: number;
  status?: string;
}

export const MENU_STATUS_AVAILABLE = 'AVAILABLE';
export const MENU_STATUS_UNAVAILABLE = 'UNAVAILABLE';
