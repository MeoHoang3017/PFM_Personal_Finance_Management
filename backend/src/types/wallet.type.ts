import { Pagination } from "../utils/pagination";

export interface WalletResponse {
    id: string;
    name: string;
    /** Balance in user's display currency (converted from wallet currency if needed). */
    balance: number;
    user: string;
    /** User's display currency code (e.g. USD, VND) for frontend. */
    displayCurrency: string;
    /** Currency symbol for frontend (e.g. $, ₫). */
    currencySymbol: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaginatedWalletsResponse {
    data: WalletResponse[];
    pagination: Pagination;
}

export interface CreateWalletData {
    name: string;
    balance?: number;
    user: string;
}

export interface UpdateWalletData {
    name?: string;
    balance?: number;
}

