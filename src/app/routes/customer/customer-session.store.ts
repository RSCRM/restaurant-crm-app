import { HttpContextToken } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';

import { CustomerSessionState, QrSessionResponse, SessionRole } from './customer.model';

export const USE_CUSTOMER_SESSION_TOKEN = new HttpContextToken<boolean>(() => false);

const CUSTOMER_SESSION_KEY = 'customer_session';
const LEGACY_SESSION_KEY = 'CRM_CUSTOMER_SESSION';

@Injectable({ providedIn: 'root' })
export class CustomerSessionStore {
  private readonly state = signal<CustomerSessionState | null>(null);

  readonly session = this.state.asReadonly();
  readonly role = computed<SessionRole | null>(() => this.state()?.role ?? null);

  constructor() {
    localStorage.removeItem(LEGACY_SESSION_KEY);
    const restored = this.readPersisted();
    if (restored && this.notExpired(restored)) {
      this.state.set(restored);
    } else if (restored) {
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
    }
  }

  token(): string | null {
    const current = this.state();
    return current && this.notExpired(current) ? current.sessionToken : null;
  }

  isActive(): boolean {
    const current = this.state();
    return !!current && this.notExpired(current);
  }

  save(response: QrSessionResponse, branchName: string): void {
    const next: CustomerSessionState = {
      sessionToken: response.sessionToken,
      sessionExpiresAt: response.sessionExpiresAt,
      sessionId: response.sessionId,
      deviceId: response.deviceId,
      role: response.role,
      branchId: response.branchId,
      branchName,
      tableId: response.tableId,
      tableNumber: response.tableNumber
    };
    this.state.set(next);
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(next));
  }

  clear(): void {
    this.state.set(null);
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
  }

  private readPersisted(): CustomerSessionState | null {
    const raw = localStorage.getItem(CUSTOMER_SESSION_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as CustomerSessionState;
    } catch {
      return null;
    }
  }

  private notExpired(state: CustomerSessionState): boolean {
    const expiresAt = new Date(state.sessionExpiresAt).getTime();
    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  }
}
