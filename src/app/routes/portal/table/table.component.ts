import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderModule } from '@delon/abc/page-header';
import { I18nPipe } from '@delon/theme';
import { Store } from '@ngrx/store';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { finalize, firstValueFrom, Subscription, timer } from 'rxjs';

import {
  isBookingDue,
  isBookingLocked,
  RegisterGuestRequest,
  RestaurantTableStatus,
  SaveTableRequest,
  TableAreaMap,
  TableBooking,
  TableStatus
} from './table.model';
import { TableService } from './table.service';
import { selectHasPermission } from '../../auth/store/auth.selectors';
import { CheckoutModalComponent } from '../invoice/checkout-modal/checkout-modal.component';
import { AddItemFormComponent } from '../order/order-detail/add-item-form.component';
import { OrderFormComponent } from '../order/order-form/order-form.component';

@Component({
  selector: 'app-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderModule,
    RouterLink,
    NzBadgeModule,
    NzButtonModule,
    NzCardModule,
    NzEmptyModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzSelectModule,
    NzSpinModule,
    NzTooltipModule,
    I18nPipe
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.less'
})
export class TableComponent implements OnInit {
  private readonly tableService = inject(TableService);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  mapLoading = false;
  saving = false;
  modalVisible = false;
  tableFormVisible = false;
  tableSaving = false;
  transferring = false;
  transferSource: TableStatus | null = null;
  finishingTableId: string | null = null;
  deletingTableId: string | null = null;
  bookingActionTableId: string | null = null;
  canAddTable = false;
  canUpdateTable = false;
  canDeleteTable = false;
  canViewBooking = false;

  selectedAreaId: string | null = null;
  branchId = '';
  areas: TableAreaMap[] = [];

  keyword = '';
  status: RestaurantTableStatus | null = null;
  minCapacity: number | null = null;
  selectedTable: TableStatus | null = null;
  editingTable: TableStatus | null = null;
  form: RegisterGuestRequest = { tableId: '', guestName: '', partySize: 1 };
  tableForm: SaveTableRequest = { areaId: '', tableNumber: '', capacity: 1, status: 'AVAILABLE' };
  bookingsByTable = new Map<string, TableBooking>();
  now = Date.now();
  showActionsTableIds = new Set<string>();
  private mapSubscription?: Subscription;
  private bookingSubscription?: Subscription;

  ngOnInit(): void {
    this.store
      .select(selectHasPermission('RESTAURANT_TABLE_ADD'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        this.canAddTable = v;
        this.cdr.markForCheck();
      });
    this.store
      .select(selectHasPermission('RESTAURANT_TABLE_UPDATE'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        this.canUpdateTable = v;
        this.cdr.markForCheck();
      });
    this.store
      .select(selectHasPermission('RESTAURANT_TABLE_DELETE'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        this.canDeleteTable = v;
        this.cdr.markForCheck();
      });
    this.store
      .select(selectHasPermission('BOOKING_READ'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        this.canViewBooking = v;
        this.cdr.markForCheck();
      });
    timer(0, 10_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.now = Date.now();
        this.cdr.detectChanges();
      });
    this.reload();
  }

  get visibleAreas(): TableAreaMap[] {
    if (this.transferSource) return this.areas;
    const keyword = this.keyword.trim().toLowerCase();
    return this.areas
      .filter(area => !this.selectedAreaId || area.id === this.selectedAreaId)
      .map(area => ({
        ...area,
        tables: area.tables.filter(
          table =>
            (!keyword || table.tableNumber.toLowerCase().includes(keyword)) &&
            (!this.status || table.status === this.status) &&
            (!this.minCapacity || table.capacity >= this.minCapacity)
        )
      }))
      .filter(area => area.tables.length > 0);
  }

  get totalTablesCount(): number {
    return this.areas.reduce((acc, area) => acc + area.tables.length, 0);
  }

  get availableCount(): number {
    return this.areas.reduce((acc, area) => acc + (area.tables?.filter(t => t.status === 'AVAILABLE').length || 0), 0);
  }

  get occupiedCount(): number {
    return this.areas.reduce((acc, area) => acc + (area.tables?.filter(t => t.status === 'OCCUPIED').length || 0), 0);
  }

  get reservedCount(): number {
    return this.bookingsByTable.size;
  }

  reload(): void {
    this.showActionsTableIds.clear();
    this.loadMap();
  }

  loadMap(): void {
    this.mapSubscription?.unsubscribe();
    this.mapLoading = true;
    this.mapSubscription = this.tableService
      .getMap()
      .pipe(
        finalize(() => {
          this.mapLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: map => {
          this.branchId = map.branchId;
          this.areas = map.areas;
          this.loadBookings(map.branchId);
        },
        error: () => this.message.error('Không thể tải sơ đồ bàn')
      });
  }

  loadBookings(branchId: string): void {
    this.bookingSubscription?.unsubscribe();
    this.bookingSubscription = this.tableService.getActiveBookings(branchId).subscribe({
      next: bookings => {
        this.bookingsByTable = new Map();
        bookings
          .filter((booking): booking is TableBooking & { tableId: string } => !!booking.tableId)
          .sort((left, right) => new Date(left.bookingTime).getTime() - new Date(right.bookingTime).getTime())
          .forEach(booking => {
            if (!this.bookingsByTable.has(booking.tableId)) this.bookingsByTable.set(booking.tableId, booking);
          });
        this.cdr.markForCheck();
      },
      error: () => {
        this.bookingsByTable.clear();
        this.cdr.markForCheck();
      }
    });
  }

  reset(): void {
    this.keyword = '';
    this.selectedAreaId = null;
    this.status = null;
    this.minCapacity = null;
    this.transferSource = null;
    this.reload();
  }

  openRegistration(table: TableStatus): void {
    if (table.status !== 'AVAILABLE') return;
    this.selectedTable = table;
    this.form = { tableId: table.id, guestName: `Khách ${table.tableNumber}`, partySize: 1 };
    this.modalVisible = true;
  }

  openCreateTable(): void {
    this.editingTable = null;
    this.tableForm = { areaId: this.selectedAreaId ?? this.areas[0]?.id ?? '', tableNumber: '', capacity: 1, status: 'AVAILABLE' };
    this.tableFormVisible = true;
  }

  openEditTable(table: TableStatus, areaId: string): void {
    this.editingTable = table;
    this.tableForm = {
      areaId,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      status: table.status,
      positionX: table.positionX,
      positionY: table.positionY
    };
    this.tableFormVisible = true;
  }

  saveTable(): void {
    const tableNumber = this.tableForm.tableNumber.trim();
    if (!this.tableForm.areaId || !tableNumber || this.tableForm.capacity < 1) {
      this.message.warning('Vui lòng nhập đủ thông tin bàn');
      return;
    }

    this.tableSaving = true;
    const request = { ...this.tableForm, tableNumber };
    const save$ = this.editingTable ? this.tableService.updateTable(this.editingTable.id, request) : this.tableService.createTable(request);
    save$
      .pipe(
        finalize(() => {
          this.tableSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.tableFormVisible = false;
          this.message.success(this.editingTable ? 'Cập nhật bàn thành công' : 'Thêm bàn thành công');
          this.reload();
        },
        error: error => this.message.error(error?.error?.errorMessage?.message ?? 'Không thể lưu bàn')
      });
  }

  confirmDeleteTable(): void {
    if (!this.editingTable || !this.canDeleteTable) return;
    const table = this.editingTable;
    this.modal.confirm({
      nzTitle: 'Xóa bàn',
      nzContent: `Xóa ${table.tableNumber}?`,
      nzOkDanger: true,
      nzOnOk: () => this.deleteTable(table)
    });
  }

  submit(): void {
    const phone = this.form.guestPhone?.trim();
    if (this.form.partySize < 1 || this.form.partySize > (this.selectedTable?.capacity ?? 0)) {
      this.message.warning('Vui lòng nhập đúng số lượng khách');
      return;
    }
    if (phone && !/^\d{9,15}$/.test(phone)) {
      this.message.warning('Số điện thoại phải có từ 9 đến 15 chữ số');
      return;
    }

    this.saving = true;
    this.tableService
      .registerGuest({ ...this.form, guestPhone: phone || undefined, note: undefined })
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.modalVisible = false;
          this.message.success('Đăng ký khách vào bàn thành công');
          this.reload();
        },
        error: error => this.message.error(error?.error?.errorMessage?.message ?? 'Không thể đăng ký khách vào bàn')
      });
  }

  startTransfer(table: TableStatus): void {
    this.transferSource = table;
  }

  cancelTransfer(): void {
    this.transferSource = null;
  }

  confirmTransfer(target: TableStatus): void {
    if (!this.transferSource || this.bookingLockedFor(target.id)) return;
    const source = this.transferSource;
    this.modal.confirm({
      nzTitle: 'Xác nhận chuyển bàn',
      nzContent: `Chuyển khách từ ${source.tableNumber} sang ${target.tableNumber}?`,
      nzOnOk: () => void this.transfer(source, target)
    });
  }

  async openPayment(table: TableStatus): Promise<void> {
    if (this.finishingTableId) return;
    this.finishingTableId = table.id;
    this.cdr.markForCheck();
    try {
      const order = await firstValueFrom(this.tableService.getActiveOrder(table.id));
      const modalRef = this.modal.create({
        nzTitle: `Thanh toán ${table.tableNumber}`,
        nzContent: CheckoutModalComponent,
        nzWidth: 640,
        nzFooter: null
      });
      modalRef.getContentComponent().orderId = order.orderId;
      modalRef.afterClose.subscribe(result => {
        if (result) void this.finish(table);
      });
    } catch (error: unknown) {
      const detail = (error as { error?: { errorMessage?: { message?: string } } }).error?.errorMessage?.message;
      this.message.error(detail ?? 'Không thể tải đơn hàng của bàn');
    } finally {
      this.finishingTableId = null;
      this.cdr.markForCheck();
    }
  }

  async viewOrderDetails(table: TableStatus): Promise<void> {
    try {
      const order = await firstValueFrom(this.tableService.getActiveOrder(table.id));
      this.router.navigate(['/portal/order', order.orderId, 'detail']);
    } catch (error: unknown) {
      const detail = (error as { error?: { errorMessage?: { message?: string } } }).error?.errorMessage?.message;
      this.message.error(detail ?? 'Không thể tải đơn hàng của bàn');
    }
  }

  async openOrder(table: TableStatus): Promise<void> {
    try {
      const order = await firstValueFrom(this.tableService.getActiveOrder(table.id));
      const modalRef = this.modal.create({
        nzTitle: `Thêm món cho ${table.tableNumber}`,
        nzContent: AddItemFormComponent,
        nzWidth: 1000,
        nzFooter: null,
        nzData: { orderId: order.orderId, branchId: this.branchId },
        nzOnCancel: instance => {
          modalRef.destroy(instance.hasAdded);
        }
      });
      modalRef.afterClose.subscribe(result => {
        if (result) {
          this.reload();
        }
      });
    } catch {
      if (!this.branchId) return;
      const modalRef = this.modal.create({
        nzTitle: `Tạo order ${table.tableNumber}`,
        nzContent: OrderFormComponent,
        nzWidth: 700,
        nzData: { branchId: this.branchId, tableId: table.id }
      });
      modalRef.afterClose.subscribe(orderId => {
        if (orderId) {
          const addModalRef = this.modal.create({
            nzTitle: `Thêm món cho ${table.tableNumber}`,
            nzContent: AddItemFormComponent,
            nzWidth: 1000,
            nzFooter: null,
            nzData: { orderId, branchId: this.branchId },
            nzOnCancel: instance => {
              addModalRef.destroy(instance.hasAdded);
            }
          });
          addModalRef.afterClose.subscribe(result => {
            if (result) {
              this.reload();
            }
          });
        }
      });
    }
  }

  bookingFor(tableId: string): TableBooking | undefined {
    return this.bookingsByTable.get(tableId);
  }

  bookingDueFor(tableId: string): boolean {
    const booking = this.bookingFor(tableId);
    return !!booking && isBookingDue(booking.bookingTime, this.now);
  }

  bookingLockedFor(tableId: string): boolean {
    const booking = this.bookingFor(tableId);
    return !!booking && isBookingLocked(booking.bookingTime, this.now);
  }

  showActionsForTable(tableId: string): void {
    this.showActionsTableIds.add(tableId);
    this.cdr.markForCheck();
  }

  confirmReservation(table: TableStatus): void {
    const booking = this.bookingFor(table.id);
    if (!booking || table.status === 'OCCUPIED') return;
    if (!this.bookingDueFor(table.id) && !this.showActionsTableIds.has(table.id)) return;
    this.modal.confirm({
      nzTitle: 'Xác nhận đặt bàn',
      nzContent: `Xác nhận đặt bàn cho ${table.tableNumber}?`,
      nzOnOk: () => this.updateReservation(table, 'CONFIRMED')
    });
  }

  cancelReservation(table: TableStatus): void {
    const booking = this.bookingFor(table.id);
    if (!booking) return;
    this.modal.confirm({
      nzTitle: 'Hủy đặt bàn',
      nzContent: `Hủy đặt bàn của ${table.tableNumber}?`,
      nzOkDanger: true,
      nzOnOk: () => this.updateReservation(table, 'CANCELLED')
    });
  }

  statusColor(status: RestaurantTableStatus): string {
    return status === 'AVAILABLE' ? 'green' : status === 'OCCUPIED' ? 'red' : 'gold';
  }

  private async transfer(source: TableStatus, target: TableStatus): Promise<void> {
    this.transferring = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.tableService.transfer(source.id, target.id));
      this.transferSource = null;
      this.message.success('Chuyển bàn thành công');
      this.reload();
    } catch (error: unknown) {
      const detail = (error as { error?: { errorMessage?: { message?: string } } }).error?.errorMessage?.message;
      this.message.error(detail ?? 'Không thể chuyển bàn');
    } finally {
      this.transferring = false;
      this.cdr.markForCheck();
    }
  }

  private async deleteTable(table: TableStatus): Promise<void> {
    this.deletingTableId = table.id;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.tableService.deleteTable(table.id));
      this.tableFormVisible = false;
      this.editingTable = null;
      this.message.success(`Đã xóa ${table.tableNumber}`);
      this.reload();
    } catch (error: unknown) {
      const detail = (error as { error?: { errorMessage?: { message?: string } } }).error?.errorMessage?.message;
      this.message.error(detail ?? 'Không thể xóa bàn');
      throw error;
    } finally {
      this.deletingTableId = null;
      this.cdr.markForCheck();
    }
  }

  private async finish(table: TableStatus): Promise<void> {
    this.finishingTableId = table.id;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.tableService.finish(table.id));
      this.message.success(`Thanh toán ${table.tableNumber} thành công`);
      this.reload();
    } catch (error: unknown) {
      const detail = (error as { error?: { errorMessage?: { message?: string } } }).error?.errorMessage?.message;
      this.message.error(detail ?? 'Đã thanh toán nhưng không thể đóng phiên bàn');
    } finally {
      this.finishingTableId = null;
      this.cdr.markForCheck();
    }
  }

  private async updateReservation(table: TableStatus, status: 'CONFIRMED' | 'CANCELLED'): Promise<void> {
    this.bookingActionTableId = table.id;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(
        status === 'CONFIRMED' ? this.tableService.confirmReservation(table.id) : this.tableService.cancelReservation(table.id)
      );
      this.message.success(status === 'CONFIRMED' ? 'Xác nhận đặt bàn thành công' : 'Đã hủy đặt bàn');
      this.reload();
    } catch (error: unknown) {
      const detail = (error as { error?: { errorMessage?: { message?: string } } }).error?.errorMessage?.message;
      this.message.error(detail ?? 'Không thể cập nhật đặt bàn');
    } finally {
      this.bookingActionTableId = null;
      this.cdr.markForCheck();
    }
  }
}
