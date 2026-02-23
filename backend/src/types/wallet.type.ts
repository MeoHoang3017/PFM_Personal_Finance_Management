import { Pagination } from "../utils/pagination";

export interface WalletResponse {
    id: string;
    name: string;
    balance: number;
    user: string;
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

