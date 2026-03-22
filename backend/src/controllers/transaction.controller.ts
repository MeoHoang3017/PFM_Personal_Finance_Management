import { Request, Response, NextFunction } from "express";
import {
    getUserTransactionsService,
    getTransactionByIdService,
    createTransactionService,
    createWalletExchangeService,
    updateTransactionService,
    deleteTransactionService,
    duplicateTransactionService,
} from "../services/transaction.service";
import { SuccessResponse, ErrorResponse } from "../constants/Response";
import { sendResponse } from "../utils/response";
import { createError } from "../middleware/error.middleware";

/**
 * Get User Transactions
 */
export const getUserTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const { type, category, wallet, startDate, endDate, search } = req.query;

        const filter: any = { user: userId };
        if (type) filter.type = type;
        if (category) filter.category = category;
        if (wallet) filter.wallet = wallet;
        if (startDate) filter.startDate = new Date(startDate as string);
        if (endDate) filter.endDate = new Date(endDate as string);
        if (search) filter.search = search;

        const result = await getUserTransactionsService(filter, page, pageSize);
        sendResponse(res, SuccessResponse.LIST('Transactions', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to fetch transactions', 500));
    }
};

/**
 * Get Transaction by ID
 */
export const getTransactionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await getTransactionByIdService(id);
        sendResponse(res, SuccessResponse.ITEM('Transaction', result));
    } catch (error: any) {
        next(createError(error.message || 'Transaction not found', 404));
    }
};

/**
 * Create Transaction
 */
export const createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const { amount, type, category, date, description, notes, wallet } = req.body;

        if (amount === undefined || amount === null || !type || !wallet) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['amount', 'type', 'wallet']));
            return;
        }
        if (type === "exchange") {
            next(createError("Use POST /api/transactions/exchange for wallet transfers", 400));
            return;
        }
        if (!category) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(["category"]));
            return;
        }

        const result = await createTransactionService({
            amount,
            type,
            category,
            date: date ? new Date(date) : new Date(),
            description,
            notes,
            wallet,
            user: userId
        });

        sendResponse(res, SuccessResponse.CREATED('Transaction', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to create transaction', 400));
    }
};

/**
 * Chuyển tiền giữa hai ví: tạo hai giao dịch type exchange (out / in) liên kết exchangePairId.
 */
export const createWalletExchange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const { fromWallet, toWallet, amount, date, description, notes } = req.body;

        if (amount === undefined || amount === null || !fromWallet || !toWallet) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(["amount", "fromWallet", "toWallet"]));
            return;
        }

        const result = await createWalletExchangeService({
            fromWallet,
            toWallet,
            amount: Number(amount),
            date: date ? new Date(date) : new Date(),
            description,
            notes,
            user: userId,
        });

        sendResponse(res, SuccessResponse.CREATED("ExchangeTransactions", result));
    } catch (error: any) {
        next(createError(error.message || "Failed to create wallet exchange", 400));
    }
};

/**
 * Update Transaction
 */
export const updateTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { amount, type, category, date, description, notes, wallet } = req.body;

        const updateData: any = {};
        if (amount !== undefined) updateData.amount = amount;
        if (type !== undefined) updateData.type = type;
        if (category !== undefined) updateData.category = category;
        if (date !== undefined) updateData.date = new Date(date);
        if (description !== undefined) updateData.description = description;
        if (notes !== undefined) updateData.notes = notes;
        if (wallet !== undefined) updateData.wallet = wallet;

        const result = await updateTransactionService(id, updateData);
        sendResponse(res, SuccessResponse.UPDATED('Transaction', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to update transaction', 400));
    }
};

/**
 * Delete Transaction
 */
export const deleteTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        await deleteTransactionService(id);
        sendResponse(res, SuccessResponse.DELETED('Transaction'));
    } catch (error: any) {
        next(createError(error.message || 'Failed to delete transaction', 500));
    }
};

/**
 * Duplicate Transaction
 */
export const duplicateTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await duplicateTransactionService(id);
        sendResponse(res, SuccessResponse.CREATED('Transaction', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to duplicate transaction', 400));
    }
};

