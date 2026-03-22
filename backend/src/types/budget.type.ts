import { Pagination } from "../utils/pagination";

export type BudgetPeriodPreset = "weekly" | "monthly" | "yearly" | "custom";

export interface BudgetResponse {
    id: string;
    amount: number;
    /** Đơn vị tiền của hạn mức và spentAmount (ISO 4217). */
    currency: string;
    category: string;
    /** Tên category (populated) để hiển thị. */
    categoryName?: string;
    /** Icon key lưu trên Category (vd. restaurant). */
    categoryIcon?: string;
    /** Màu hex từ Category. */
    categoryColor?: string;
    period: BudgetPeriodPreset | string;
    /** Cửa sổ hiện tại đang dùng để tính spent (đã resolve với weekly/monthly/yearly). */
    startDate: Date;
    endDate: Date;
    user: string;
    isActive: boolean;
    /** Tổng chi trong khoảng [startDate, endDate] hiển thị. */
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
    period: BudgetPeriodPreset;
    /** ISO 4217; mặc định theo user.currency. */
    currency?: string;
    /** Chỉ dùng khi period === 'custom'. */
    startDate?: Date;
    endDate?: Date;
    user: string;
    isActive?: boolean;
}

export interface UpdateBudgetData {
    amount?: number;
    category?: string;
    period?: BudgetPeriodPreset;
    currency?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
}

export interface BudgetFilter {
    user: string;
    category?: string;
    period?: string;
    isActive?: boolean;
}
