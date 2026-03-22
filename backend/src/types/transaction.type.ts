import { Pagination } from "../utils/pagination";

export type TransactionType = "income" | "expense" | "transfer" | "exchange";

export interface TransactionResponse {
    id: string;
    /** Amount in user's display currency (converted from wallet currency if needed). */
    amount: number;
    /** Currency of this transaction amount (captured at creation time). */
    currency: string;
    type: TransactionType;
    /** Category id; rỗng với type exchange. */
    category: string;
    /** Category name for display (from populated Category). */
    categoryName?: string;
    date: Date;
    description: string;
    notes: string;
    wallet: string;
    user: string;
    /** Ví đối ứng khi type === exchange. */
    counterpartyWallet?: string;
    exchangePairId?: string;
    exchangeLeg?: "out" | "in";
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
    type: TransactionType;
    category: string;
    date: Date;
    description?: string;
    notes?: string;
    wallet: string;
    user: string;
}

export interface CreateWalletExchangeData {
    fromWallet: string;
    toWallet: string;
    /** Số tiền trừ ở ví nguồn (theo currency của ví nguồn). */
    amount: number;
    date: Date;
    description?: string;
    notes?: string;
    user: string;
}

export interface UpdateTransactionData {
    amount?: number;
    type?: TransactionType;
    category?: string;
    date?: Date;
    description?: string;
    notes?: string;
    wallet?: string;
}

export interface TransactionFilter {
    user: string;
    type?: TransactionType;
    category?: string;
    wallet?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
}

export interface WalletExchangeResult {
    exchangePairId: string;
    outbound: TransactionResponse;
    inbound: TransactionResponse;
}
