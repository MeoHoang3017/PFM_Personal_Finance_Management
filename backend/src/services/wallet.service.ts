import { Wallet, User } from "../models";
import { paginate } from "../utils/pagination";
import { WalletResponse, PaginatedWalletsResponse, CreateWalletData, UpdateWalletData } from "../types/wallet.type";
import mongoose from "mongoose";
import { getCurrencyByCodeService } from "./currency.service";
import { convertCurrency } from "./exchangeRate.service";

function formatWalletResponse(
    wallet: any,
    displayBalance: number,
    displayCurrency: string,
    currencySymbol: string
): WalletResponse {
    return {
        id: wallet._id.toString(),
        name: wallet.name,
        balance: displayBalance,
        user: wallet.user.toString(),
        displayCurrency,
        currencySymbol,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
    };
}

async function getDisplayCurrencyAndSymbol(userId: string): Promise<{ displayCurrency: string; currencySymbol: string }> {
    const user = await User.findById(userId).select('currency').lean();
    const displayCurrency = (user?.currency as string) || 'USD';
    const currencyDoc = await getCurrencyByCodeService(displayCurrency);
    const currencySymbol = currencyDoc?.symbol ?? displayCurrency;
    return { displayCurrency, currencySymbol };
}

// Get user wallets with pagination (balances converted to user's display currency)
async function getUserWalletsService(
    userId: string,
    page: number = 1,
    pageSize: number = 10
): Promise<PaginatedWalletsResponse> {
    try {
        const skip = (page - 1) * pageSize;
        const totalItems = await Wallet.countDocuments({ user: userId });
        const wallets = await Wallet
            .find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();

        const { displayCurrency, currencySymbol } = await getDisplayCurrencyAndSymbol(userId);
        const formattedWallets: WalletResponse[] = [];
        for (const w of wallets) {
            const walletCurrency = (w as any).currency || 'USD';
            let displayBalance = (w as any).balance ?? 0;
            if (walletCurrency !== displayCurrency) {
                const converted = await convertCurrency(
                    displayBalance,
                    walletCurrency,
                    displayCurrency
                );
                if (converted !== null) displayBalance = converted;
            }
            formattedWallets.push(
                formatWalletResponse(w, displayBalance, displayCurrency, currencySymbol)
            );
        }
        return paginate(formattedWallets, page, pageSize, totalItems);
    } catch (error) {
        throw error;
    }
}

// Create new wallet (currency set from user's preference)
async function createWalletService(walletData: CreateWalletData): Promise<WalletResponse> {
    try {
        const existingWalletsCount = await Wallet.countDocuments({ user: walletData.user });
        if (existingWalletsCount >= 10) {
            throw new Error('Maximum number of wallets reached');
        }
        const user = await User.findById(walletData.user).select('currency').lean();
        const walletCurrency = (user?.currency as string) || 'USD';
        const wallet = new Wallet({
            name: walletData.name,
            balance: walletData.balance || 0,
            currency: walletCurrency,
            user: new mongoose.Types.ObjectId(walletData.user),
        });
        const saved = await wallet.save();
        const { displayCurrency, currencySymbol } = await getDisplayCurrencyAndSymbol(walletData.user);
        let displayBalance = saved.balance;
        if (walletCurrency !== displayCurrency) {
            const converted = await convertCurrency(
                saved.balance,
                walletCurrency,
                displayCurrency
            );
            if (converted !== null) displayBalance = converted;
        }
        return formatWalletResponse(saved, displayBalance, displayCurrency, currencySymbol);
    } catch (error) {
        throw error;
    }
}

// Update wallet (optional userId: only owner can update)
async function updateWalletService(
    walletId: string,
    walletData: UpdateWalletData,
    userId?: string
): Promise<WalletResponse> {
    try {
        const wallet = await Wallet.findById(walletId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        if (userId && wallet.user.toString() !== userId) {
            throw new Error('Wallet not found');
        }
        const update: any = {};
        if (walletData.name !== undefined) update.name = walletData.name;
        if (walletData.balance !== undefined) update.balance = walletData.balance;
        const updated = await Wallet.findByIdAndUpdate(walletId, update, { new: true });
        if (!updated) throw new Error('Wallet not found');
        const uid = userId ?? updated.user.toString();
        const { displayCurrency, currencySymbol } = await getDisplayCurrencyAndSymbol(uid);
        const walletCurrency = (updated as any).currency || 'USD';
        let displayBalance = updated.balance ?? 0;
        if (walletCurrency !== displayCurrency) {
            const converted = await convertCurrency(
                displayBalance,
                walletCurrency,
                displayCurrency
            );
            if (converted !== null) displayBalance = converted;
        }
        return formatWalletResponse(updated, displayBalance, displayCurrency, currencySymbol);
    } catch (error) {
        throw error;
    }
}

// Delete wallet (optional userId: only owner can delete)
async function deleteWalletService(walletId: string, userId?: string): Promise<{ message: string }> {
    try {
        const wallet = await Wallet.findById(walletId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        if (userId && wallet.user.toString() !== userId) {
            throw new Error('Wallet not found');
        }
        await Wallet.findByIdAndDelete(walletId);
        return { message: 'Wallet deleted successfully' };
    } catch (error) {
        throw error;
    }
}

// Get wallet by ID (optional userId: only owner can read; balance in user's display currency)
async function getWalletByIdService(walletId: string, userId?: string): Promise<WalletResponse> {
    try {
        const wallet = await Wallet.findById(walletId).lean();
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        if (userId && (wallet as any).user.toString() !== userId) {
            throw new Error('Wallet not found');
        }
        const uid = userId ?? (wallet as any).user.toString();
        const { displayCurrency, currencySymbol } = await getDisplayCurrencyAndSymbol(uid);
        const walletCurrency = (wallet as any).currency || 'USD';
        let displayBalance = (wallet as any).balance ?? 0;
        if (walletCurrency !== displayCurrency) {
            const converted = await convertCurrency(
                displayBalance,
                walletCurrency,
                displayCurrency
            );
            if (converted !== null) displayBalance = converted;
        }
        return formatWalletResponse(wallet, displayBalance, displayCurrency, currencySymbol);
    } catch (error) {
        throw error;
    }
}

export {
    getUserWalletsService,
    createWalletService,
    updateWalletService,
    deleteWalletService,
    getWalletByIdService
};