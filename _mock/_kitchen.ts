// Mock for the KDS board (uc-scf-01 + uc-scf-02). Matches the backend contract on dev:
// GET /api/v1/kds/items?section=ACTIVE -> { success, data: KdsActiveResponse }.
// The branch comes from the caller's token on the server, so there is no request param.
// Swap to the real backend by pointing environment.api.baseUrl at the server.

const now = Date.now();

function iso(minutesAgo: number): string {
  return new Date(now - minutesAgo * 60000).toISOString();
}

// Ordered oldest-first (FIFO). NOTE: backend does not yet expose priority_flag,
// so priority-first ordering (BR-RES-ORD-04) is not reflected here yet.
const WAITING_ITEMS = [
  { orderItemId: 'oi-1', orderCode: 'ORD-1001', tableNumber: '5', areaName: 'Tầng 1', productName: 'Phở bò tái', comboName: null, quantity: 2, note: 'Ít hành', modifiers: null, status: 'PENDING', createdAt: iso(12) },
  { orderItemId: 'oi-2', orderCode: 'ORD-1002', tableNumber: '8', areaName: 'Tầng 1', productName: null, comboName: 'Combo gia đình', quantity: 1, note: 'Thêm trứng', modifiers: null, status: 'PENDING', createdAt: iso(7) },
  { orderItemId: 'oi-3', orderCode: 'ORD-1003', tableNumber: null, areaName: null, productName: 'Gỏi cuốn', comboName: null, quantity: 2, note: null, modifiers: null, status: 'PENDING', createdAt: iso(2) }
];

const PREPARING_ITEMS = [
  { orderItemId: 'oi-4', orderCode: 'ORD-1000', tableNumber: '2', areaName: 'Tầng 1', productName: 'Bún chả', comboName: null, quantity: 1, note: null, modifiers: null, status: 'IN_PROGRESS', createdAt: iso(18) }
];

const WAITING_SUMMARY = [
  { productName: 'Phở bò tái', comboName: null, note: 'Ít hành', modifiers: null, totalQuantity: 2 },
  { productName: null, comboName: 'Combo gia đình', note: 'Thêm trứng', modifiers: null, totalQuantity: 1 },
  { productName: 'Gỏi cuốn', comboName: null, note: null, modifiers: null, totalQuantity: 2 }
];

export const KITCHEN = {
  '/api/v1/kds/items': () => ({
    success: true,
    data: {
      waitingSummary: WAITING_SUMMARY,
      waitingItems: WAITING_ITEMS,
      preparingItems: PREPARING_ITEMS
    }
  })
};
