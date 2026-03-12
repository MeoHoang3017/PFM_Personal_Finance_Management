import Transaction from "../models/transaction.model";
import Wallet from "../models/wallet.model";
import { paginate } from "../utils/pagination";
import { TransactionResponse, PaginatedTransactionsResponse, CreateTransactionData, UpdateTransactionData, TransactionFilter } from "../types/transaction.type";
import mongoose from "mongoose";

/**
 * MongoDB transactions (session.startTransaction) chỉ chạy trên replica set.
 * - USE_MONGODB_TRANSACTIONS=true + MongoDB replica set → dùng transaction (commit/abort).
 * - Mặc định (standalone) → thao tác thường + rollback thủ công khi lỗi.
 */
function useMongoTransactions(): boolean {
    return process.env.USE_MONGODB_TRANSACTIONS === "true";
}

function formatTransactionResponse(transaction: any): TransactionResponse {
    return {
        id: transaction._id.toString(),
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        description: transaction.description || '',
        notes: transaction.notes || '',
        wallet: transaction.wallet.toString(),
        user: transaction.user.toString(),
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
    };
}

// Get user transactions with pagination and filters
async function getUserTransactionsService(
    filter: TransactionFilter,
    page: number = 1,
    pageSize: number = 10
): Promise<PaginatedTransactionsResponse> {
    try {
        const skip = (page - 1) * pageSize;
        const query: any = { user: filter.user };
        
        if (filter.type) query.type = filter.type;
        if (filter.category) query.category = filter.category;
        if (filter.wallet) query.wallet = filter.wallet;
        if (filter.startDate || filter.endDate) {
            query.date = {};
            if (filter.startDate) query.date.$gte = filter.startDate;
            if (filter.endDate) query.date.$lte = filter.endDate;
        }
        if (filter.search) {
            query.$or = [
                { description: { $regex: filter.search, $options: 'i' } },
                { notes: { $regex: filter.search, $options: 'i' } }
            ];
        }
        
        const totalItems = await Transaction.countDocuments(query);
        
        const transactions = await Transaction.find(query)
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();
        
        const formattedTransactions = transactions.map(formatTransactionResponse);
        return paginate(formattedTransactions, page, pageSize, totalItems);
    } catch (error) {
        throw error;
    }
}

// Get transaction by ID
async function getTransactionByIdService(transactionId: string): Promise<TransactionResponse> {
    try {
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        return formatTransactionResponse(transaction);
    } catch (error) {
        throw error;
    }
}

// Create new transaction
async function createTransactionService(data: CreateTransactionData): Promise<TransactionResponse> {
    if (useMongoTransactions()) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const wallet = await Wallet.findById(data.wallet).session(session);
            if (!wallet) throw new Error('Wallet not found');
            if (data.type === 'income') wallet.balance += data.amount;
            else if (data.type === 'expense') wallet.balance -= data.amount;
            await wallet.save({ session });
            const transaction = new Transaction({
                amount: data.amount,
                type: data.type,
                category: data.category,
                date: data.date,
                description: data.description || '',
                notes: data.notes || '',
                wallet: new mongoose.Types.ObjectId(data.wallet),
                user: new mongoose.Types.ObjectId(data.user),
            });
            const saved = await transaction.save({ session });
            await session.commitTransaction();
            return formatTransactionResponse(saved);
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    const wallet = await Wallet.findById(data.wallet);
    if (!wallet) throw new Error('Wallet not found');
    const previousBalance = wallet.balance;
    if (data.type === 'income') wallet.balance += data.amount;
    else if (data.type === 'expense') wallet.balance -= data.amount;
    await wallet.save();
    try {
        const transaction = new Transaction({
            amount: data.amount,
            type: data.type,
            category: data.category,
            date: data.date,
            description: data.description || '',
            notes: data.notes || '',
            wallet: new mongoose.Types.ObjectId(data.wallet),
            user: new mongoose.Types.ObjectId(data.user),
        });
        const saved = await transaction.save();
        return formatTransactionResponse(saved);
    } catch (error) {
        wallet.balance = previousBalance;
        await wallet.save();
        throw error;
    }
}

// Update transaction
async function updateTransactionService(
    transactionId: string,
    data: UpdateTransactionData
): Promise<TransactionResponse> {
    if (useMongoTransactions()) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const transaction = await Transaction.findById(transactionId).session(session);
            if (!transaction) throw new Error('Transaction not found');
            const needsWalletUpdate = data.amount !== undefined || data.type !== undefined || data.wallet !== undefined;
            if (needsWalletUpdate) {
                const oldWallet = await Wallet.findById(transaction.wallet).session(session);
                if (oldWallet) {
                    if (transaction.type === 'income') oldWallet.balance -= transaction.amount;
                    else if (transaction.type === 'expense') oldWallet.balance += transaction.amount;
                    await oldWallet.save({ session });
                }
                const walletId = data.wallet !== undefined ? data.wallet : transaction.wallet.toString();
                const newWallet = await Wallet.findById(walletId).session(session);
                if (!newWallet) throw new Error('Wallet not found');
                const newAmount = data.amount !== undefined ? data.amount : transaction.amount;
                const newType = data.type !== undefined ? data.type : transaction.type;
                if (newType === 'income') newWallet.balance += newAmount;
                else if (newType === 'expense') newWallet.balance -= newAmount;
                await newWallet.save({ session });
            }
            const update: any = {};
            if (data.amount !== undefined) update.amount = data.amount;
            if (data.type !== undefined) update.type = data.type;
            if (data.category !== undefined) update.category = data.category;
            if (data.date !== undefined) update.date = data.date;
            if (data.description !== undefined) update.description = data.description;
            if (data.notes !== undefined) update.notes = data.notes;
            if (data.wallet !== undefined) update.wallet = new mongoose.Types.ObjectId(data.wallet);
            const updated = await Transaction.findByIdAndUpdate(transactionId, update, { new: true, session });
            if (!updated) throw new Error('Transaction not found');
            await session.commitTransaction();
            return formatTransactionResponse(updated);
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
        throw new Error('Transaction not found');
    }

    const needsWalletUpdate = data.amount !== undefined || data.type !== undefined || data.wallet !== undefined;
    let oldWallet: Awaited<ReturnType<typeof Wallet.findById>> = null;
    let newWallet: Awaited<ReturnType<typeof Wallet.findById>> = null;
    const oldWalletBalanceBefore: number[] = [];
    const newWalletBalanceBefore: number[] = [];

    if (needsWalletUpdate) {
        oldWallet = await Wallet.findById(transaction.wallet);
        if (oldWallet) {
            oldWalletBalanceBefore.push(oldWallet.balance);
            if (transaction.type === 'income') {
                oldWallet.balance -= transaction.amount;
            } else if (transaction.type === 'expense') {
                oldWallet.balance += transaction.amount;
            }
            await oldWallet.save();
        }

        const walletId = data.wallet !== undefined ? data.wallet : transaction.wallet.toString();
        newWallet = await Wallet.findById(walletId);
        if (!newWallet) {
            if (oldWallet) {
                oldWallet.balance = oldWalletBalanceBefore[0];
                await oldWallet.save();
            }
            throw new Error('Wallet not found');
        }
        newWalletBalanceBefore.push(newWallet.balance);
        const newAmount = data.amount !== undefined ? data.amount : transaction.amount;
        const newType = data.type !== undefined ? data.type : transaction.type;
        if (newType === 'income') {
            newWallet.balance += newAmount;
        } else if (newType === 'expense') {
            newWallet.balance -= newAmount;
        }
        await newWallet.save();
    }

    try {
        const update: any = {};
        if (data.amount !== undefined) update.amount = data.amount;
        if (data.type !== undefined) update.type = data.type;
        if (data.category !== undefined) update.category = data.category;
        if (data.date !== undefined) update.date = data.date;
        if (data.description !== undefined) update.description = data.description;
        if (data.notes !== undefined) update.notes = data.notes;
        if (data.wallet !== undefined) update.wallet = new mongoose.Types.ObjectId(data.wallet);
        const updated = await Transaction.findByIdAndUpdate(transactionId, update, { new: true });
        if (!updated) {
            throw new Error('Transaction not found');
        }
        return formatTransactionResponse(updated);
    } catch (error) {
        if (oldWallet && oldWalletBalanceBefore.length > 0) {
            oldWallet.balance = oldWalletBalanceBefore[0];
            await oldWallet.save();
        }
        if (newWallet && newWalletBalanceBefore.length > 0) {
            newWallet.balance = newWalletBalanceBefore[0];
            await newWallet.save();
        }
        throw error;
    }
}

// Delete transaction
async function deleteTransactionService(transactionId: string): Promise<{ message: string }> {
    if (useMongoTransactions()) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const transaction = await Transaction.findById(transactionId).session(session);
            if (!transaction) throw new Error('Transaction not found');
            const wallet = await Wallet.findById(transaction.wallet).session(session);
            if (wallet) {
                if (transaction.type === 'income') wallet.balance -= transaction.amount;
                else if (transaction.type === 'expense') wallet.balance += transaction.amount;
                await wallet.save({ session });
            }
            await Transaction.findByIdAndDelete(transactionId, { session });
            await session.commitTransaction();
            return { message: 'Transaction deleted successfully' };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
        throw new Error('Transaction not found');
    }

    const wallet = await Wallet.findById(transaction.wallet);
    let previousBalance: number | null = null;
    if (wallet) {
        previousBalance = wallet.balance;
        if (transaction.type === 'income') {
            wallet.balance -= transaction.amount;
        } else if (transaction.type === 'expense') {
            wallet.balance += transaction.amount;
        }
        await wallet.save();
    }

    try {
        await Transaction.findByIdAndDelete(transactionId);
        return { message: 'Transaction deleted successfully' };
    } catch (error) {
        if (wallet && previousBalance !== null) {
            wallet.balance = previousBalance;
            await wallet.save();
        }
        throw error;
    }
}

// Duplicate transaction
async function duplicateTransactionService(transactionId: string): Promise<TransactionResponse> {
    if (useMongoTransactions()) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const original = await Transaction.findById(transactionId).session(session);
            if (!original) throw new Error('Transaction not found');
            const wallet = await Wallet.findById(original.wallet).session(session);
            if (!wallet) throw new Error('Wallet not found');
            if (original.type === 'income') wallet.balance += original.amount;
            else if (original.type === 'expense') wallet.balance -= original.amount;
            await wallet.save({ session });
            const duplicated = new Transaction({
                amount: original.amount,
                type: original.type,
                category: original.category,
                date: new Date(),
                description: original.description,
                notes: original.notes,
                wallet: original.wallet,
                user: original.user,
            });
            const saved = await duplicated.save({ session });
            await session.commitTransaction();
            return formatTransactionResponse(saved);
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    const original = await Transaction.findById(transactionId);
    if (!original) {
        throw new Error('Transaction not found');
    }

    const wallet = await Wallet.findById(original.wallet);
    if (!wallet) {
        throw new Error('Wallet not found');
    }
    const previousBalance = wallet.balance;
    if (original.type === 'income') {
        wallet.balance += original.amount;
    } else if (original.type === 'expense') {
        wallet.balance -= original.amount;
    }
    await wallet.save();

    try {
        const duplicated = new Transaction({
            amount: original.amount,
            type: original.type,
            category: original.category,
            date: new Date(),
            description: original.description,
            notes: original.notes,
            wallet: original.wallet,
            user: original.user,
        });
        const saved = await duplicated.save();
        return formatTransactionResponse(saved);
    } catch (error) {
        wallet.balance = previousBalance;
        await wallet.save();
        throw error;
    }
}

export {
    getUserTransactionsService,
    getTransactionByIdService,
    createTransactionService,
    updateTransactionService,
    deleteTransactionService,
    duplicateTransactionService
};

