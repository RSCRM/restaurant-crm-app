// Mock for uc-scf-01 kitchen queue. Swap to the real backend by pointing
// environment.api.baseUrl at the server — the path and shape already match
// GET /api/v1/kitchen/order-items -> { success, data: KitchenOrderItem[] }.

const now = Date.now();

function iso(minutesAgo: number): string {
  return new Date(now - minutesAgo * 60000).toISOString();
}

// Already ordered per BR-RES-ORD-04: priority first, then oldest first.
const QUEUE = [
  { orderItemId: 'oi-1', dishName: 'Phở bò tái', quantity: 2, tableNumber: '5', note: 'Ít hành', status: 'PENDING', priorityFlag: true, createdAt: iso(3) },
  { orderItemId: 'oi-2', dishName: 'Bún chả', quantity: 1, tableNumber: '2', note: '', status: 'IN_PROGRESS', priorityFlag: false, createdAt: iso(12) },
  { orderItemId: 'oi-3', dishName: 'Cơm tấm sườn', quantity: 3, tableNumber: '8', note: 'Thêm trứng', status: 'PENDING', priorityFlag: false, createdAt: iso(7) },
  { orderItemId: 'oi-4', dishName: 'Gỏi cuốn', quantity: 2, tableNumber: '1', note: '', status: 'PENDING', priorityFlag: false, createdAt: iso(1) }
];

export const KITCHEN = {
  // branchId query param is accepted to mirror the real API; the demo returns one queue.
  '/api/v1/kitchen/order-items': () => ({ success: true, data: QUEUE })
};
