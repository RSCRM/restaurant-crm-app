import { findTableContext, isBookingDue, isBookingLocked, TableMap } from './table.model';

describe('findTableContext', () => {
  const map: TableMap = {
    branchId: 'branch-1',
    areas: [
      {
        id: 'area-1',
        areaName: 'Khu A',
        description: null,
        displayOrder: 1,
        tables: [{ id: 'table-1', tableNumber: 'Bàn 01', capacity: 4, status: 'AVAILABLE', positionX: null, positionY: null }]
      }
    ]
  };

  it('returns the table with its branch and area', () => {
    expect(findTableContext(map, 'table-1')).toEqual({
      branchId: 'branch-1',
      areaId: 'area-1',
      areaName: 'Khu A',
      table: map.areas[0].tables[0]
    });
  });

  it('returns null for an unknown table', () => {
    expect(findTableContext(map, 'missing')).toBeNull();
  });
});

describe('isBookingDue', () => {
  it('becomes actionable at the booking time', () => {
    const now = Date.parse('2026-08-04T08:00:00Z');
    expect(isBookingDue('2026-08-04T08:00:00Z', now)).toBe(true);
    expect(isBookingDue('2026-08-04T08:00:01Z', now)).toBe(false);
  });
});

describe('isBookingLocked', () => {
  it('locks the table fifteen minutes before the booking time', () => {
    const now = Date.parse('2026-08-04T08:00:00Z');
    expect(isBookingLocked('2026-08-04T08:15:00Z', now)).toBe(true);
    expect(isBookingLocked('2026-08-04T08:15:01Z', now)).toBe(false);
  });
});
