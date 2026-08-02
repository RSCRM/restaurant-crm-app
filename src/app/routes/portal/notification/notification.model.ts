export enum NotificationType {
  READY_TO_SERVE = 'READY_TO_SERVE',
  GENERAL = 'GENERAL'
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ'
}

export interface NotificationResponse {
  id: string;
  branchId: string;
  recipientId: string | null;
  senderId: string | null;
  title: string;
  content: string;
  type: NotificationType;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PagingParams {
  page: number;
  size: number;
}

export interface PagingResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElement: number;
  data: T[];
}
