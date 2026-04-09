import { Pagination } from "../utils/pagination";

export interface BudgetResponse {
    id: string;
    amount: number;
    category: string;
    /** Tên category (populated) để hiển thị. */
    categoryName?: string;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate: Date;
    endDate: Date;
    user: string;
    isActive: boolean;
    /** Tổng chi trong khoảng [startDate, endDate] cho category này. */
    spentAmount?: number;
    /** true khi spentAmount > amount (đã vượt ngân sách). */
    isOverBudget?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaginatedBudgetsResponse {
    data: BudgetResponse[];
    pagination: Pagination;
}

export interface CreateBudgetData {
    amount: number;
    category: string;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate: Date;
    endDate: Date;
    user: string;
    isActive?: boolean;
}

export interface UpdateBudgetData {
    amount?: number;
    category?: string;
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
}

export interface BudgetFilter {
    user: string;
    category?: string;
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    isActive?: boolean;
}

