import { Pagination } from "../utils/pagination";

export interface NotificationResponse {
    id: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'success' | 'error' | 'reminder';
    user: string;
    isRead: boolean;
    readAt: Date | null;
    redirectType: 'transaction' | 'budget' | 'wallet' | 'goal' | 'none';
    redirectId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaginatedNotificationsResponse {
    data: NotificationResponse[];
    pagination: Pagination;
}

export interface CreateNotificationData {
    title: string;
    content: string;
    type?: 'info' | 'warning' | 'success' | 'error' | 'reminder';
    user: string;
    redirectType?: 'transaction' | 'budget' | 'wallet' | 'goal' | 'none';
    redirectId?: string;
}

export interface NotificationFilter {
    user: string;
    type?: 'info' | 'warning' | 'success' | 'error' | 'reminder';
    isRead?: boolean;
}

