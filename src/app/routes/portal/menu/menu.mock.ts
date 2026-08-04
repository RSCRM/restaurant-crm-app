import {
  CategoryResponse,
  ComboResponse,
  MENU_STATUS_AVAILABLE,
  MENU_STATUS_UNAVAILABLE,
  ModifierGroupResponse,
  ModifierOptionResponse,
  ProductResponse
} from './menu.model';

export const MOCK_BRANCH_ID = 'branch-001';

const PLACEHOLDER_IMAGE = '/assets/tmp/img/avatar.jpg';

export const MOCK_CATEGORIES: CategoryResponse[] = [
  { id: 'cat-1', branchId: MOCK_BRANCH_ID, categoryName: 'Món khai vị', description: 'Món ăn nhẹ mở đầu bữa ăn', displayOrder: 1 },
  { id: 'cat-2', branchId: MOCK_BRANCH_ID, categoryName: 'Món chính', description: 'Món ăn chính trong thực đơn', displayOrder: 2 },
  { id: 'cat-3', branchId: MOCK_BRANCH_ID, categoryName: 'Đồ uống', description: 'Nước uống các loại', displayOrder: 3 }
];

export const MOCK_PRODUCTS: ProductResponse[] = [
  {
    id: 'prod-1',
    branchId: MOCK_BRANCH_ID,
    categoryId: 'cat-1',
    productName: 'Gỏi cuốn tôm thịt',
    description: 'Gỏi cuốn tươi với tôm, thịt heo và rau sống',
    price: 45000,
    imageUrl: PLACEHOLDER_IMAGE,
    status: MENU_STATUS_AVAILABLE,
    requiresPreparation: true
  },
  {
    id: 'prod-2',
    branchId: MOCK_BRANCH_ID,
    categoryId: 'cat-1',
    productName: 'Chả giò hải sản',
    description: 'Chả giò chiên giòn nhân hải sản',
    price: 55000,
    imageUrl: PLACEHOLDER_IMAGE,
    status: MENU_STATUS_AVAILABLE,
    requiresPreparation: true
  },
  {
    id: 'prod-3',
    branchId: MOCK_BRANCH_ID,
    categoryId: 'cat-2',
    productName: 'Phở bò tái',
    description: 'Phở bò tái truyền thống, nước dùng ninh xương 12 giờ',
    price: 65000,
    imageUrl: PLACEHOLDER_IMAGE,
    status: MENU_STATUS_AVAILABLE,
    requiresPreparation: true
  },
  {
    id: 'prod-4',
    branchId: MOCK_BRANCH_ID,
    categoryId: 'cat-2',
    productName: 'Cơm sườn nướng',
    description: 'Cơm tấm sườn nướng mật ong',
    price: 60000,
    imageUrl: null,
    status: MENU_STATUS_AVAILABLE,
    requiresPreparation: true
  },
  {
    id: 'prod-5',
    branchId: MOCK_BRANCH_ID,
    categoryId: 'cat-2',
    productName: 'Bún chả Hà Nội',
    description: 'Bún chả nướng than hoa kiểu Hà Nội',
    price: 58000,
    imageUrl: PLACEHOLDER_IMAGE,
    status: MENU_STATUS_UNAVAILABLE,
    requiresPreparation: true
  },
  {
    id: 'prod-6',
    branchId: MOCK_BRANCH_ID,
    categoryId: 'cat-3',
    productName: 'Trà đào cam sả',
    description: 'Trà đào tươi kết hợp cam sả',
    price: 35000,
    imageUrl: PLACEHOLDER_IMAGE,
    status: MENU_STATUS_AVAILABLE,
    requiresPreparation: false
  },
  {
    id: 'prod-7',
    branchId: MOCK_BRANCH_ID,
    categoryId: 'cat-3',
    productName: 'Nước suối Lavie',
    description: 'Nước suối đóng chai 500ml',
    price: 15000,
    imageUrl: PLACEHOLDER_IMAGE,
    status: MENU_STATUS_AVAILABLE,
    requiresPreparation: false
  },
  {
    id: 'prod-8',
    branchId: MOCK_BRANCH_ID,
    categoryId: null,
    productName: 'Bánh flan caramen',
    description: 'Bánh flan trứng sữa caramen',
    price: 25000,
    imageUrl: PLACEHOLDER_IMAGE,
    status: MENU_STATUS_AVAILABLE,
    requiresPreparation: false
  }
];

export const MOCK_MODIFIER_GROUPS: ModifierGroupResponse[] = [
  { id: 'group-1', productId: 'prod-3', groupName: 'Mức cay', description: 'Chọn mức độ cay của phở', minSelection: 1, maxSelection: 1 },
  {
    id: 'group-2',
    productId: 'prod-3',
    groupName: 'Thêm topping',
    description: 'Chọn thêm topping ăn kèm',
    minSelection: 0,
    maxSelection: 3
  },
  { id: 'group-3', productId: 'prod-6', groupName: 'Mức đường', description: 'Chọn độ ngọt của trà', minSelection: 1, maxSelection: 1 }
];

export const MOCK_MODIFIER_OPTIONS: ModifierOptionResponse[] = [
  { id: 'option-1', groupId: 'group-1', optionName: 'Không cay', additionalPrice: 0, status: MENU_STATUS_AVAILABLE },
  { id: 'option-2', groupId: 'group-1', optionName: 'Cay vừa', additionalPrice: 0, status: MENU_STATUS_AVAILABLE },
  { id: 'option-3', groupId: 'group-1', optionName: 'Cay nhiều', additionalPrice: 0, status: MENU_STATUS_AVAILABLE },
  { id: 'option-4', groupId: 'group-2', optionName: 'Trứng cút', additionalPrice: 5000, status: MENU_STATUS_AVAILABLE },
  { id: 'option-5', groupId: 'group-2', optionName: 'Giò bò', additionalPrice: 10000, status: MENU_STATUS_AVAILABLE },
  { id: 'option-6', groupId: 'group-2', optionName: 'Bò viên', additionalPrice: 8000, status: MENU_STATUS_AVAILABLE },
  { id: 'option-7', groupId: 'group-3', optionName: '100% đường', additionalPrice: 0, status: MENU_STATUS_AVAILABLE },
  { id: 'option-8', groupId: 'group-3', optionName: '50% đường', additionalPrice: 0, status: MENU_STATUS_AVAILABLE },
  { id: 'option-9', groupId: 'group-3', optionName: '30% đường', additionalPrice: 0, status: MENU_STATUS_AVAILABLE }
];

export const MOCK_COMBOS: ComboResponse[] = [
  {
    id: 'combo-1',
    branchId: MOCK_BRANCH_ID,
    comboName: 'Combo Phở đặc biệt',
    description: 'Phở bò tái tuỳ chọn topping kèm nước suối',
    price: 85000,
    imageUrl: PLACEHOLDER_IMAGE,
    status: MENU_STATUS_AVAILABLE,
    items: [
      { id: 'combo-item-1', comboId: 'combo-1', productId: 'prod-3', quantity: 1, modifierOptionIds: ['option-2', 'option-6'] },
      { id: 'combo-item-2', comboId: 'combo-1', productId: 'prod-7', quantity: 1, modifierOptionIds: [] }
    ]
  },
  {
    id: 'combo-2',
    branchId: MOCK_BRANCH_ID,
    comboName: 'Combo Gỏi cuốn đôi',
    description: 'Gỏi cuốn tôm thịt và chả giò hải sản',
    price: 90000,
    imageUrl: PLACEHOLDER_IMAGE,
    status: MENU_STATUS_AVAILABLE,
    items: [
      { id: 'combo-item-3', comboId: 'combo-2', productId: 'prod-1', quantity: 2, modifierOptionIds: [] },
      { id: 'combo-item-4', comboId: 'combo-2', productId: 'prod-2', quantity: 1, modifierOptionIds: [] }
    ]
  }
];
