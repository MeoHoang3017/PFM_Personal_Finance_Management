import { Pagination } from "../utils/pagination";

export interface UserResponse {
    id: string;
    username: string;
    email: string;
    theme: string;
    language: string;
    currency: string;
    avatarUrl: string;
    moneyFormat?: string;
    dailyReminder?: boolean;
    reminderTime?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaginatedUsersResponse {
    data: UserResponse[];
    pagination: Pagination;
}

export interface UpdateUserSettingsData {
    theme?: "light" | "dark";
    language?: string;
    currency?: string;
    avatarUrl?: string;
    moneyFormat?: "standard" | "compact" | "full";
    dailyReminder?: boolean;
    reminderTime?: string;
}

export interface UpdateProfileData {
    username?: string;
    currentPassword?: string;
    newPassword?: string;
    theme?: "light" | "dark";
    language?: string;
    currency?: string;
    avatarUrl?: string;
    moneyFormat?: "standard" | "compact" | "full";
    dailyReminder?: boolean;
    reminderTime?: string;
}