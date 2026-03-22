import { randomUUID } from "crypto";
import Transaction from "../models/transaction.model";
import Wallet from "../models/wallet.model";
import User from "../models/user.model";
import { paginate } from "../utils/pagination";
import {
    TransactionResponse,
    PaginatedTransactionsResponse,
    CreateTransactionData,
    CreateWalletExchangeData,
    UpdateTransactionData,
    TransactionFilter,
    WalletExchangeResult,
} from "../types/transaction.type";
import mongoose from "mongoose";
import { getCurrencyByCodeService } from "./currency.service";
import { convertCurrency } from "./exchangeRate.service";

/**
 * MongoDB transactions (session.startTransaction) chỉ chạy trên replica set.
 * - USE_MONGODB_TRANSACTIONS=true + MongoDB replica set → dùng transaction (commit/abort).
 * - Standalone hoặc chưa bật env → thao tác thường + rollback thủ công khi lỗi.
 * Khi env=true nhưng MongoDB là standalone, tự fallback sang rollback thủ công (không ném lỗi).
 */
let _mongoTransactionsSupported: boolean | null = null;

function _isReplicaSetRequiredError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    return /replica set|mongos|transaction numbers/i.test(msg);
}

function useMongoTransactions(): boolean {
    return process.env.USE_MONGODB_TRANSACTIONS === "true" && _mongoTransactionsSupported !== false;
}

function formatTransactionResponse(
    transaction: any,
    displayAmount: number,
    displayCurrency: string,
    currencySymbol: string
): TransactionResponse {
    const cat = transaction.category;
    const categoryId =
        cat != null
            ? typeof cat === "object" && cat._id != null
                ? cat._id.toString()
                : cat.toString()
            : "";
    const categoryName =
        typeof cat === "object" && cat != null && typeof cat.name === "string" ? cat.name : undefined;
    const cp = transaction.counterpartyWallet;
    let counterpartyWallet: string | undefined;
    if (cp != null) {
        counterpartyWallet =
            typeof cp === "object" && (cp as any)._id != null
                ? (cp as any)._id.toString()
                : String(cp);
    }

    const base: TransactionResponse = {
        id: transaction._id.toString(),
        amount: displayAmount,
        currency: (transaction.currency as string) || displayCurrency,
        type: transaction.type,
        category: categoryId,
        ...(categoryName != null ? { categoryName } : {}),
        date: transaction.date,
        description: transaction.description || "",
        notes: transaction.notes || "",
        wallet: (transaction.wallet && (transaction.wallet._id ?? transaction.wallet)).toString(),
        user: (transaction.user && (transaction.user._id ?? transaction.user)).toString(),
        displayCurrency,
        currencySymbol,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
    };
    if (transaction.type === "exchange") {
        if (counterpartyWallet != null) base.counterpartyWallet = counterpartyWallet;
        if (transaction.exchangePairId) base.exchangePairId = transaction.exchangePairId;
        if (transaction.exchangeLeg) base.exchangeLeg = transaction.exchangeLeg;
    }
    return base;
}

async function _getDisplayCurrencyAndSymbol(userId: string): Promise<{ displayCurrency: string; currencySymbol: string }> {
    const user = await User.findById(userId).select('currency').lean();
    const displayCurrency = (user?.currency as string) || 'USD';
    const currencyDoc = await getCurrencyByCodeService(displayCurrency);
    const currencySymbol = currencyDoc?.symbol ?? displayCurrency;
    return { displayCurrency, currencySymbol };
}

async function _getUserCurrency(userId: string): Promise<string> {
    const user = await User.findById(userId).select('currency').lean();
    return ((user?.currency as string) || 'USD').toUpperCase();
}

/** Convert transaction amount to user's display currency and format response. */
async function _formatTransactionWithConversion(transaction: any, userId: string): Promise<TransactionResponse> {
    const walletCurrency =
        (transaction.wallet && typeof transaction.wallet === 'object' && transaction.wallet.currency)
            ? transaction.wallet.currency
            : 'USD';
    const { displayCurrency, currencySymbol } = await _getDisplayCurrencyAndSymbol(userId);
    let displayAmount = transaction.amount ?? 0;
    if (walletCurrency !== displayCurrency) {
        const converted = await convertCurrency(
            transaction.amount,
            walletCurrency,
            displayCurrency,
            transaction.date
        );
        if (converted !== null) displayAmount = converted;
    }
    return formatTransactionResponse(transaction, displayAmount, displayCurrency, currencySymbol);
}

// Get user transactions with pagination and filters (amounts in user's display currency)
async function getUserTransactionsService(
    filter: TransactionFilter,
    page: number = 1,
    pageSize: number = 10
): Promise<PaginatedTransactionsResponse> {
    try {
        const skip = (page - 1) * pageSize;
        const query: any = { user: filter.user };
        
        if (filter.type) query.type = filter.type;
        if (filter.category) query.category = new mongoose.Types.ObjectId(filter.category);
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
            .populate('category', 'name')
            .populate('wallet', 'currency')
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();
        
        const { displayCurrency, currencySymbol } = await _getDisplayCurrencyAndSymbol(filter.user);
        const formattedTransactions: TransactionResponse[] = [];
        for (const tx of transactions) {
            const walletCurrency =
                (tx.wallet && typeof tx.wallet === 'object' && (tx.wallet as any).currency)
                    ? (tx.wallet as any).currency
                    : 'USD';
            let displayAmount = (tx as any).amount ?? 0;
            if (walletCurrency !== displayCurrency) {
                const converted = await convertCurrency(
                    (tx as any).amount,
                    walletCurrency,
                    displayCurrency,
                    (tx as any).date
                );
                if (converted !== null) displayAmount = converted;
            }
            formattedTransactions.push(
                formatTransactionResponse(tx, displayAmount, displayCurrency, currencySymbol)
            );
        }
        return paginate(formattedTransactions, page, pageSize, totalItems);
    } catch (error) {
        throw error;
    }
}

// Get transaction by ID (amount in user's display currency)
async function getTransactionByIdService(transactionId: string): Promise<TransactionResponse> {
    try {
        const transaction = await Transaction.findById(transactionId)
            .populate('category', 'name')
            .populate('wallet', 'currency')
            .lean();
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        const userId = (transaction as any).user?.toString?.() ?? (transaction as any).user ?? '';
        return _formatTransactionWithConversion(transaction, userId);
    } catch (error) {
        throw error;
    }
}

async function _createWithSession(data: CreateTransactionData): Promise<TransactionResponse> {
    const session = await mongoose.startSession();
    try {
        await session.startTransaction();
    } catch (e) {
        session.endSession();
        throw e;
    }
    try {
        const wallet = await Wallet.findById(data.wallet).session(session);
        if (!wallet) throw new Error('Wallet not found');
        if (data.type === 'income') wallet.balance += data.amount;
        else if (data.type === 'expense') wallet.balance -= data.amount;
        await wallet.save({ session });
        const txCurrency = await _getUserCurrency(data.user);
        const transaction = new Transaction({
            amount: data.amount,
            currency: txCurrency,
            type: data.type,
            category: new mongoose.Types.ObjectId(data.category),
            date: data.date,
            description: data.description || '',
            notes: data.notes || '',
            wallet: new mongoose.Types.ObjectId(data.wallet),
            user: new mongoose.Types.ObjectId(data.user),
        });
        const saved = await transaction.save({ session });
        await session.commitTransaction();
        const populated = await Transaction.findById(saved._id)
            .populate('category', 'name')
            .populate('wallet', 'currency')
            .lean();
        return _formatTransactionWithConversion(populated ?? saved, data.user);
    } catch (error) {
        await session.abortTransaction().catch(() => {});
        throw error;
    } finally {
        session.endSession();
    }
}

async function _createNoSession(data: CreateTransactionData): Promise<TransactionResponse> {
    const wallet = await Wallet.findById(data.wallet);
    if (!wallet) throw new Error('Wallet not found');
    const previousBalance = wallet.balance;
    if (data.type === 'income') wallet.balance += data.amount;
    else if (data.type === 'expense') wallet.balance -= data.amount;
    await wallet.save();
    try {
        const txCurrency = await _getUserCurrency(data.user);
        const transaction = new Transaction({
            amount: data.amount,
            currency: txCurrency,
            type: data.type,
            category: new mongoose.Types.ObjectId(data.category),
            date: data.date,
            description: data.description || '',
            notes: data.notes || '',
            wallet: new mongoose.Types.ObjectId(data.wallet),
            user: new mongoose.Types.ObjectId(data.user),
        });
        const saved = await transaction.save();
        const populated = await Transaction.findById(saved._id)
            .populate('category', 'name')
            .populate('wallet', 'currency')
            .lean();
        return _formatTransactionWithConversion(populated ?? saved, data.user);
    } catch (error) {
        wallet.balance = previousBalance;
        await wallet.save();
        throw error;
    }
}

async function _applyExchangeLegToWallet(
    tx: { wallet: mongoose.Types.ObjectId; exchangeLeg?: string; amount: number },
    session: mongoose.ClientSession | null,
    reverse: boolean
): Promise<void> {
    const wq = Wallet.findById(tx.wallet);
    const w = session ? await wq.session(session) : await wq;
    if (!w) return;
    if (tx.exchangeLeg !== "out" && tx.exchangeLeg !== "in") {
        throw new Error("Invalid exchange transaction: missing exchangeLeg");
    }
    const out = tx.exchangeLeg === "out";
    const delta = reverse ? (out ? tx.amount : -tx.amount) : out ? -tx.amount : tx.amount;
    w.balance += delta;
    if (session) await w.save({ session });
    else await w.save();
}

async function _deleteExchangePair(transactionId: string, session: mongoose.ClientSession | null): Promise<void> {
    const txQuery = Transaction.findById(transactionId);
    const tx = session ? await txQuery.session(session) : await txQuery;
    if (!tx || tx.type !== "exchange" || !tx.exchangePairId) {
        return;
    }
    const pairQuery = Transaction.find({
        exchangePairId: tx.exchangePairId,
        user: tx.user,
    });
    const all = session ? await pairQuery.session(session) : await pairQuery;
    for (const t of all) {
        await _applyExchangeLegToWallet(t, session, true);
        const dq = Transaction.findByIdAndDelete(t._id);
        if (session) await dq.session(session);
        else await dq;
    }
}

async function createWalletExchangeService(data: CreateWalletExchangeData): Promise<WalletExchangeResult> {
    if (data.fromWallet === data.toWallet) {
        throw new Error("Source and destination wallets must differ");
    }
    if (data.amount <= 0) {
        throw new Error("Amount must be positive");
    }
    if (useMongoTransactions()) {
        try {
            return await _exchangeWithSession(data);
        } catch (error) {
            if (_isReplicaSetRequiredError(error)) {
                _mongoTransactionsSupported = false;
                return _exchangeNoSession(data);
            }
            throw error;
        }
    }
    return _exchangeNoSession(data);
}

async function _exchangeWithSession(data: CreateWalletExchangeData): Promise<WalletExchangeResult> {
    const session = await mongoose.startSession();
    try {
        await session.startTransaction();
    } catch (e) {
        session.endSession();
        throw e;
    }
    try {
        const fromW = await Wallet.findById(data.fromWallet).session(session);
        const toW = await Wallet.findById(data.toWallet).session(session);
        if (!fromW || !toW) throw new Error("Wallet not found");
        if (fromW.user.toString() !== data.user || toW.user.toString() !== data.user) {
            throw new Error("Wallets must belong to the current user");
        }
        if (fromW.balance < data.amount) {
            throw new Error("Insufficient balance in source wallet");
        }
        const fromCurr = ((fromW as any).currency as string) || "USD";
        const toCurr = ((toW as any).currency as string) || "USD";
        let amountInTo = data.amount;
        if (fromCurr.toUpperCase() !== toCurr.toUpperCase()) {
            const conv = await convertCurrency(data.amount, fromCurr, toCurr, data.date);
            if (conv === null) {
                throw new Error("Could not convert between wallet currencies; check exchange rates");
            }
            amountInTo = conv;
        }
        const pairId = randomUUID();
        fromW.balance -= data.amount;
        toW.balance += amountInTo;
        await fromW.save({ session });
        await toW.save({ session });

        const txOut = new Transaction({
            amount: data.amount,
            currency: fromCurr.toUpperCase(),
            type: "exchange",
            date: data.date,
            description: data.description || "",
            notes: data.notes || "",
            wallet: fromW._id,
            counterpartyWallet: toW._id,
            exchangePairId: pairId,
            exchangeLeg: "out",
            user: new mongoose.Types.ObjectId(data.user),
        });
        const txIn = new Transaction({
            amount: amountInTo,
            currency: toCurr.toUpperCase(),
            type: "exchange",
            date: data.date,
            description: data.description || "",
            notes: data.notes || "",
            wallet: toW._id,
            counterpartyWallet: fromW._id,
            exchangePairId: pairId,
            exchangeLeg: "in",
            user: new mongoose.Types.ObjectId(data.user),
        });
        await txOut.save({ session });
        await txIn.save({ session });
        await session.commitTransaction();

        const pOut = await Transaction.findById(txOut._id).populate("wallet", "currency").lean();
        const pIn = await Transaction.findById(txIn._id).populate("wallet", "currency").lean();
        return {
            exchangePairId: pairId,
            outbound: await _formatTransactionWithConversion(pOut ?? txOut, data.user),
            inbound: await _formatTransactionWithConversion(pIn ?? txIn, data.user),
        };
    } catch (error) {
        await session.abortTransaction().catch(() => {});
        throw error;
    } finally {
        session.endSession();
    }
}

async function _exchangeNoSession(data: CreateWalletExchangeData): Promise<WalletExchangeResult> {
    const fromW = await Wallet.findById(data.fromWallet);
    const toW = await Wallet.findById(data.toWallet);
    if (!fromW || !toW) throw new Error("Wallet not found");
    if (fromW.user.toString() !== data.user || toW.user.toString() !== data.user) {
        throw new Error("Wallets must belong to the current user");
    }
    if (fromW.balance < data.amount) {
        throw new Error("Insufficient balance in source wallet");
    }
    const fromCurr = ((fromW as any).currency as string) || "USD";
    const toCurr = ((toW as any).currency as string) || "USD";
    let amountInTo = data.amount;
    if (fromCurr.toUpperCase() !== toCurr.toUpperCase()) {
        const conv = await convertCurrency(data.amount, fromCurr, toCurr, data.date);
        if (conv === null) {
            throw new Error("Could not convert between wallet currencies; check exchange rates");
        }
        amountInTo = conv;
    }
    const pairId = randomUUID();
    const prevFrom = fromW.balance;
    const prevTo = toW.balance;
    fromW.balance -= data.amount;
    toW.balance += amountInTo;
    await fromW.save();
    await toW.save();
    try {
        const txOut = new Transaction({
            amount: data.amount,
            currency: fromCurr.toUpperCase(),
            type: "exchange",
            date: data.date,
            description: data.description || "",
            notes: data.notes || "",
            wallet: fromW._id,
            counterpartyWallet: toW._id,
            exchangePairId: pairId,
            exchangeLeg: "out",
            user: new mongoose.Types.ObjectId(data.user),
        });
        const txIn = new Transaction({
            amount: amountInTo,
            currency: toCurr.toUpperCase(),
            type: "exchange",
            date: data.date,
            description: data.description || "",
            notes: data.notes || "",
            wallet: toW._id,
            counterpartyWallet: fromW._id,
            exchangePairId: pairId,
            exchangeLeg: "in",
            user: new mongoose.Types.ObjectId(data.user),
        });
        await txOut.save();
        await txIn.save();
        const pOut = await Transaction.findById(txOut._id).populate("wallet", "currency").lean();
        const pIn = await Transaction.findById(txIn._id).populate("wallet", "currency").lean();
        return {
            exchangePairId: pairId,
            outbound: await _formatTransactionWithConversion(pOut ?? txOut, data.user),
            inbound: await _formatTransactionWithConversion(pIn ?? txIn, data.user),
        };
    } catch (err) {
        fromW.balance = prevFrom;
        toW.balance = prevTo;
        await fromW.save();
        await toW.save();
        throw err;
    }
}

// Create new transaction (tự fallback sang rollback thủ công nếu MongoDB standalone)
async function createTransactionService(data: CreateTransactionData): Promise<TransactionResponse> {
    if (data.type === "exchange") {
        throw new Error("Use POST /api/transactions/exchange for wallet transfers");
    }
    if (useMongoTransactions()) {
        try {
            return await _createWithSession(data);
        } catch (error) {
            if (_isReplicaSetRequiredError(error)) {
                _mongoTransactionsSupported = false;
                return _createNoSession(data);
            }
            throw error;
        }
    }
    return _createNoSession(data);
}

async function _updateWithSession(transactionId: string, data: UpdateTransactionData): Promise<TransactionResponse> {
    const session = await mongoose.startSession();
    try {
        await session.startTransaction();
    } catch (e) {
        session.endSession();
        throw e;
    }
    try {
        const transaction = await Transaction.findById(transactionId).session(session);
        if (!transaction) throw new Error('Transaction not found');
        if (transaction.type === 'exchange') {
            throw new Error('Exchange transactions cannot be updated; delete the transfer to reverse balances');
        }
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
        if (data.category !== undefined) update.category = new mongoose.Types.ObjectId(data.category);
            if (data.date !== undefined) update.date = data.date;
            if (data.description !== undefined) update.description = data.description;
            if (data.notes !== undefined) update.notes = data.notes;
            if (data.wallet !== undefined) update.wallet = new mongoose.Types.ObjectId(data.wallet);
        const updated = await Transaction.findByIdAndUpdate(transactionId, update, { new: true, session });
            if (!updated) throw new Error('Transaction not found');
            await session.commitTransaction();
            const populated = await Transaction.findById(updated._id)
                .populate('category', 'name')
                .populate('wallet', 'currency')
                .lean();
            return _formatTransactionWithConversion(populated ?? updated, updated.user.toString());
    } catch (error) {
        await session.abortTransaction().catch(() => {});
        throw error;
    } finally {
        session.endSession();
    }
}

// Update transaction
async function updateTransactionService(
    transactionId: string,
    data: UpdateTransactionData
): Promise<TransactionResponse> {
    if (useMongoTransactions()) {
        try {
            return await _updateWithSession(transactionId, data);
        } catch (error) {
            if (_isReplicaSetRequiredError(error)) {
                _mongoTransactionsSupported = false;
                return _updateNoSession(transactionId, data);
            }
            throw error;
        }
    }
    return _updateNoSession(transactionId, data);
}

interface IWalletDoc { balance: number; save(options?: any): Promise<any> }

async function _updateNoSession(transactionId: string, data: UpdateTransactionData): Promise<TransactionResponse> {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
        throw new Error('Transaction not found');
    }
    if (transaction.type === 'exchange') {
        throw new Error('Exchange transactions cannot be updated; delete the transfer to reverse balances');
    }

    const needsWalletUpdate = data.amount !== undefined || data.type !== undefined || data.wallet !== undefined;
    let oldWallet: IWalletDoc | null = null;
    let newWallet: IWalletDoc | null = null;
    const oldWalletBalanceBefore: number[] = [];
    const newWalletBalanceBefore: number[] = [];

    if (needsWalletUpdate) {
        oldWallet = await Wallet.findById(transaction.wallet) as IWalletDoc | null;
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
        newWallet = await Wallet.findById(walletId) as IWalletDoc | null;
        if (!newWallet) {
            const prevBalance = oldWalletBalanceBefore[0];
            if (oldWallet && prevBalance !== undefined) {
                oldWallet.balance = prevBalance;
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
        if (data.category !== undefined) update.category = new mongoose.Types.ObjectId(data.category);
        if (data.date !== undefined) update.date = data.date;
        if (data.description !== undefined) update.description = data.description;
        if (data.notes !== undefined) update.notes = data.notes;
        if (data.wallet !== undefined) update.wallet = new mongoose.Types.ObjectId(data.wallet);
        const updated = await Transaction.findByIdAndUpdate(transactionId, update, { new: true });
        if (!updated) {
            throw new Error('Transaction not found');
        }
        const populated = await Transaction.findById(updated._id)
            .populate('category', 'name')
            .populate('wallet', 'currency')
            .lean();
        return _formatTransactionWithConversion(populated ?? updated, updated.user.toString());
    } catch (error) {
        const prevOld = oldWalletBalanceBefore[0];
        if (oldWallet && prevOld !== undefined) {
            oldWallet.balance = prevOld;
            await oldWallet.save();
        }
        const prevNew = newWalletBalanceBefore[0];
        if (newWallet && prevNew !== undefined) {
            newWallet.balance = prevNew;
            await newWallet.save();
        }
        throw error;
    }
}

async function _deleteWithSession(transactionId: string): Promise<{ message: string }> {
    const session = await mongoose.startSession();
    try {
        await session.startTransaction();
    } catch (e) {
        session.endSession();
        throw e;
    }
    try {
        const transaction = await Transaction.findById(transactionId).session(session);
        if (!transaction) throw new Error('Transaction not found');
        if (transaction.type === 'exchange' && transaction.exchangePairId) {
            await _deleteExchangePair(transactionId, session);
            await session.commitTransaction();
            return { message: 'Transaction deleted successfully' };
        }
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
        await session.abortTransaction().catch(() => {});
        throw error;
    } finally {
        session.endSession();
    }
}

async function _deleteNoSession(transactionId: string): Promise<{ message: string }> {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
        throw new Error('Transaction not found');
    }
    if (transaction.type === 'exchange' && transaction.exchangePairId) {
        await _deleteExchangePair(transactionId, null);
        return { message: 'Transaction deleted successfully' };
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

// Delete transaction
async function deleteTransactionService(transactionId: string): Promise<{ message: string }> {
    if (useMongoTransactions()) {
        try {
            return await _deleteWithSession(transactionId);
        } catch (error) {
            if (_isReplicaSetRequiredError(error)) {
                _mongoTransactionsSupported = false;
                return _deleteNoSession(transactionId);
            }
            throw error;
        }
    }
    return _deleteNoSession(transactionId);
}

async function _duplicateWithSession(transactionId: string): Promise<TransactionResponse> {
    const session = await mongoose.startSession();
    try {
        await session.startTransaction();
    } catch (e) {
        session.endSession();
        throw e;
    }
    try {
        const original = await Transaction.findById(transactionId).session(session);
        if (!original) throw new Error('Transaction not found');
        if (original.type === 'exchange') {
            throw new Error('Exchange transactions cannot be duplicated');
        }
        const wallet = await Wallet.findById(original.wallet).session(session);
        if (!wallet) throw new Error('Wallet not found');
        if (original.type === 'income') wallet.balance += original.amount;
        else if (original.type === 'expense') wallet.balance -= original.amount;
        await wallet.save({ session });
        const duplicated = new Transaction({
            amount: original.amount,
            currency: (original as any).currency || (await _getUserCurrency(original.user.toString())),
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
        const populated = await Transaction.findById(saved._id)
            .populate('category', 'name')
            .populate('wallet', 'currency')
            .lean();
        return _formatTransactionWithConversion(populated ?? saved, original.user.toString());
    } catch (error) {
        await session.abortTransaction().catch(() => {});
        throw error;
    } finally {
        session.endSession();
    }
}

async function _duplicateNoSession(transactionId: string): Promise<TransactionResponse> {
    const original = await Transaction.findById(transactionId);
    if (!original) {
        throw new Error('Transaction not found');
    }
    if (original.type === 'exchange') {
        throw new Error('Exchange transactions cannot be duplicated');
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
            currency: (original as any).currency || (await _getUserCurrency(original.user.toString())),
            type: original.type,
            category: original.category,
            date: new Date(),
            description: original.description,
            notes: original.notes,
            wallet: original.wallet,
            user: original.user,
        });
        const saved = await duplicated.save();
        const populated = await Transaction.findById(saved._id)
            .populate('category', 'name')
            .populate('wallet', 'currency')
            .lean();
        return _formatTransactionWithConversion(populated ?? saved, original.user.toString());
    } catch (error) {
        wallet.balance = previousBalance;
        await wallet.save();
        throw error;
    }
}

// Duplicate transaction
async function duplicateTransactionService(transactionId: string): Promise<TransactionResponse> {
    if (useMongoTransactions()) {
        try {
            return await _duplicateWithSession(transactionId);
        } catch (error) {
            if (_isReplicaSetRequiredError(error)) {
                _mongoTransactionsSupported = false;
                return _duplicateNoSession(transactionId);
            }
            throw error;
        }
    }
    return _duplicateNoSession(transactionId);
}

export {
    getUserTransactionsService,
    getTransactionByIdService,
    createTransactionService,
    createWalletExchangeService,
    updateTransactionService,
    deleteTransactionService,
    duplicateTransactionService,
};

