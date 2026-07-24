// Mock for uc-scf-01 kitchen queue. Swap to the real backend by pointing
// environment.api.baseUrl at the server — the path and shape already match
// GET /api/v1/kitchen/order-items -> { success, data: KitchenOrderItem[] }.
// The server takes the branch from the caller's token, so there is no request param.

const now = Date.now();

function iso(minutesAgo: number): string {
  return new Date(now - minutesAgo * 60000).toISOString();
}

// Already ordered per BR-RES-ORD-04: priority first, then oldest first.
const QUEUE = [
  { orderItemId: 'oi-1', itemName: 'Phở bò tái', quantity: 2, tableNumber: '5', note: 'Ít hành', status: 'PENDING', priorityFlag: true, createdAt: iso(3) },
  { orderItemId: 'oi-2', itemName: 'Bún chả', quantity: 1, tableNumber: '2', note: '', status: 'IN_PROGRESS', priorityFlag: false, createdAt: iso(12) },
  { orderItemId: 'oi-3', itemName: 'Combo gia đình', quantity: 1, tableNumber: '8', note: 'Thêm trứng', status: 'PENDING', priorityFlag: false, createdAt: iso(7) },
  // Take-away order: the server returns a null tableNumber.
  { orderItemId: 'oi-4', itemName: 'Gỏi cuốn', quantity: 2, tableNumber: null, note: '', status: 'PENDING', priorityFlag: false, createdAt: iso(2) },
  // Product/combo that could not be resolved: the server returns a null itemName.
  { orderItemId: 'oi-5', itemName: null, quantity: 1, tableNumber: '1', note: '', status: 'PENDING', priorityFlag: false, createdAt: iso(1) }
];

export const KITCHEN = {
  '/api/v1/kitchen/order-items': () => ({ success: true, data: QUEUE })
};
