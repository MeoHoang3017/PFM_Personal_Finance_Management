import { Pagination } from "../utils/pagination";

export interface TransactionResponse {
    id: string;
    /** Amount in user's display currency (converted from wallet currency if needed). */
    amount: number;
    /** Currency of this transaction amount (captured at creation time). */
    currency: string;
    type: 'income' | 'expense' | 'transfer';
    /** Category id (ObjectId string). */
    category: string;
    /** Category name for display (from populated Category). */
    categoryName?: string;
    date: Date;
    description: string;
    notes: string;
    wallet: string;
    user: string;
    /** User's display currency code (e.g. USD, VND) for frontend. */
    displayCurrency: string;
    /** Currency symbol for frontend (e.g. $, ₫). */
    currencySymbol: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaginatedTransactionsResponse {
    data: TransactionResponse[];
    pagination: Pagination;
}

export interface CreateTransactionData {
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    category: string;
    date: Date;
    description?: string;
    notes?: string;
    wallet: string;
    user: string;
}

export interface UpdateTransactionData {
    amount?: number;
    type?: 'income' | 'expense' | 'transfer';
    category?: string;
    date?: Date;
    description?: string;
    notes?: string;
    wallet?: string;
}

export interface TransactionFilter {
    user: string;
    type?: 'income' | 'expense' | 'transfer';
    category?: string;
    wallet?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string; // Search in description and notes
}

