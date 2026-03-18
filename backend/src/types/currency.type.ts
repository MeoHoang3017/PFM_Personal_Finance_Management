import { Pagination } from "../utils/pagination";

export interface CurrencyResponse {
    id: string;
    code: string;
    name: string;
    symbol: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaginatedCurrenciesResponse {
    data: CurrencyResponse[];
    pagination: Pagination;
}

