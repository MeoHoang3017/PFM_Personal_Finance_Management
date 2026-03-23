import { Pagination } from "../utils/pagination";

export interface WalletResponse {
    id: string;
    name: string;
    /**
     * Số hiển thị: đã quy sang tiền user khi có tỷ giá; nếu thiếu FX thì là số dư sổ (ledger) và
     * displayCurrency/currencySymbol khớp tiền ví (không còn nhầm 100 USD thành 100 ₫).
     */
    balance: number;
    user: string;
    /** Mã tiền dùng cho balance/symbol khi trả API (user hoặc ví nếu fallback). */
    displayCurrency: string;
    currencySymbol: string;
    /** Tiền tệ ledger của ví (đơn vị lưu balance trong DB). */
    walletCurrency: string;
    /** Số dư đúng theo walletCurrency (giống DB). */
    balanceLedger: number;
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

