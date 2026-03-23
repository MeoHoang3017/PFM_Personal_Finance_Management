import { Wallet, User } from "../models";
import { paginate } from "../utils/pagination";
import { WalletResponse, PaginatedWalletsResponse, CreateWalletData, UpdateWalletData } from "../types/wallet.type";
import mongoose from "mongoose";
import { getCurrencyByCodeService } from "./currency.service";
import { convertCurrency } from "./exchangeRate.service";

function formatWalletResponse(
    wallet: any,
    balance: number,
    displayCurrency: string,
    currencySymbol: string,
    walletCurrency: string,
    balanceLedger: number
): WalletResponse {
    return {
        id: wallet._id.toString(),
        name: wallet.name,
        balance,
        user: wallet.user.toString(),
        displayCurrency,
        currencySymbol,
        walletCurrency,
        balanceLedger,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
    };
}

/** Tiền tệ ưu tiên của user (User.currency), chuẩn hóa ISO. */
async function getUserCurrencyAndSymbol(userId: string): Promise<{ userCurrency: string; currencySymbol: string }> {
    const user = await User.findById(userId).select("currency").lean();
    const userCurrency = String((user?.currency as string) || "USD")
        .trim()
        .toUpperCase() || "USD";
    const currencyDoc = await getCurrencyByCodeService(userCurrency);
    const currencySymbol = currencyDoc?.symbol ?? userCurrency;
    return { userCurrency, currencySymbol };
}

async function symbolForCurrencyCode(code: string): Promise<string> {
    const doc = await getCurrencyByCodeService(code);
    return doc?.symbol ?? code;
}

/**
 * Quy số dư ví sang tiền tệ người dùng để hiển thị.
 * 1) Tiền ví = wallet.currency (ledger trong DB).
 * 2) Tiền user = User.currency.
 * 3) Khác nhau → convertCurrency(ledger, ví, user) — hàm này tra exchange rate rồi nhân số.
 * 4) Trùng nhau → không gọi convert, giữ nguyên ledger.
 * Nếu thiếu tỷ giá: hiển thị ledger + ký hiệu ví (không gắn số ledger với ký hiệu user).
 */
async function balanceForDisplay(
    balanceLedger: number,
    walletCurrency: string,
    userCurrency: string,
    userCurrencySymbol: string
): Promise<{ balance: number; displayCurrency: string; currencySymbol: string }> {
    console.log("balanceForDisplay: ", balanceLedger, walletCurrency, userCurrency, userCurrencySymbol);
    const wc = walletCurrency.trim().toUpperCase() || "USD";
    const uc = userCurrency.trim().toUpperCase() || "USD";

    if (wc === uc) {
        return {
            balance: balanceLedger,
            displayCurrency: uc,
            currencySymbol: userCurrencySymbol,
        };
    }

    const converted = await convertCurrency(balanceLedger, wc, uc, new Date());
    if (converted !== null) {
        return {
            balance: converted,
            displayCurrency: uc,
            currencySymbol: userCurrencySymbol,
        };
    }

    console.warn(
        `[Wallet] Không có tỷ giá ${wc} → ${uc}; hiển thị số dư ledger (${wc}) thay vì quy sang ${uc}.`
    );
    return {
        balance: balanceLedger,
        displayCurrency: wc,
        currencySymbol: await symbolForCurrencyCode(wc),
    };
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
        const wallets = await Wallet.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();

        const { userCurrency, currencySymbol: userSymbol } = await getUserCurrencyAndSymbol(userId);
        const formattedWallets: WalletResponse[] = [];
        for (const w of wallets) {
            const walletCurrency = String((w as any).currency || "USD").trim().toUpperCase() || "USD";
            console.log(w.currency);
            const ledger = (w as any).balance ?? 0;
            const d = await balanceForDisplay(ledger, walletCurrency, userCurrency, userSymbol);
            formattedWallets.push(formatWalletResponse(w, d.balance, d.displayCurrency, d.currencySymbol, walletCurrency, ledger));
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
            throw new Error("Maximum number of wallets reached");
        }
        const user = await User.findById(walletData.user).select("currency").lean();
        const walletCurrency = String((user?.currency as string) || "USD").trim().toUpperCase() || "USD";
        const wallet = new Wallet({
            name: walletData.name,
            balance: walletData.balance || 0,
            currency: walletCurrency,
            user: new mongoose.Types.ObjectId(walletData.user),
        });
        const saved = await wallet.save();
        const { userCurrency, currencySymbol } = await getUserCurrencyAndSymbol(walletData.user);
        const ledger = saved.balance ?? 0;
        const d = await balanceForDisplay(ledger, walletCurrency, userCurrency, currencySymbol);
        return formatWalletResponse(saved, d.balance, d.displayCurrency, d.currencySymbol, walletCurrency, ledger);
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
            throw new Error("Wallet not found");
        }
        if (userId && wallet.user.toString() !== userId) {
            throw new Error("Wallet not found");
        }
        const update: any = {};
        if (walletData.name !== undefined) update.name = walletData.name;
        if (walletData.balance !== undefined) update.balance = walletData.balance;
        const updated = await Wallet.findByIdAndUpdate(walletId, update, { new: true });
        if (!updated) throw new Error("Wallet not found");
        const uid = userId ?? updated.user.toString();
        const { userCurrency, currencySymbol } = await getUserCurrencyAndSymbol(uid);
        const walletCurrency = String((updated as any).currency || "USD").trim().toUpperCase() || "USD";
        const ledger = updated.balance ?? 0;
        const d = await balanceForDisplay(ledger, walletCurrency, userCurrency, currencySymbol);
        return formatWalletResponse(updated, d.balance, d.displayCurrency, d.currencySymbol, walletCurrency, ledger);
    } catch (error) {
        throw error;
    }
}

// Delete wallet (optional userId: only owner can delete)
async function deleteWalletService(walletId: string, userId?: string): Promise<{ message: string }> {
    try {
        const wallet = await Wallet.findById(walletId);
        if (!wallet) {
            throw new Error("Wallet not found");
        }
        if (userId && wallet.user.toString() !== userId) {
            throw new Error("Wallet not found");
        }
        await Wallet.findByIdAndDelete(walletId);
        return { message: "Wallet deleted successfully" };
    } catch (error) {
        throw error;
    }
}

// Get wallet by ID (optional userId: only owner can read; balance in user's display currency)
async function getWalletByIdService(walletId: string, userId?: string): Promise<WalletResponse> {
    try {
        const wallet = await Wallet.findById(walletId).lean();
        if (!wallet) {
            throw new Error("Wallet not found");
        }
        if (userId && (wallet as any).user.toString() !== userId) {
            throw new Error("Wallet not found");
        }
        const uid = userId ?? (wallet as any).user.toString();
        const { userCurrency, currencySymbol } = await getUserCurrencyAndSymbol(uid);
        const walletCurrency = String((wallet as any).currency || "USD").trim().toUpperCase() || "USD";
        const ledger = (wallet as any).balance ?? 0;
        const d = await balanceForDisplay(ledger, walletCurrency, userCurrency, currencySymbol);
        return formatWalletResponse(wallet, d.balance, d.displayCurrency, d.currencySymbol, walletCurrency, ledger);
    } catch (error) {
        throw error;
    }
}

export {
    getUserWalletsService,
    createWalletService,
    updateWalletService,
    deleteWalletService,
    getWalletByIdService,
};
