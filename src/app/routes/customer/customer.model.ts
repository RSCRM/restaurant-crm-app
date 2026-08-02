export interface CheckPhoneRequest {
  phone: string;
  branchId: string;
}

export interface CheckPhoneResponse {
  exists: boolean;
  customer?: CustomerResponse;
}

export interface VerifyAndCreateCustomerRequest {
  phone: string;
  otp: string;
  branchId: string;
  fullName?: string;
}

export interface CustomerResponse {
  id: string;
  phone: string;
  fullName?: string;
  currentPoints: number;
}