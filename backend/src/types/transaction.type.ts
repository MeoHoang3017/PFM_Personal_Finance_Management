import { Pagination } from "../utils/pagination";

export interface TransactionResponse {
    id: string;
    amount: number;
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

