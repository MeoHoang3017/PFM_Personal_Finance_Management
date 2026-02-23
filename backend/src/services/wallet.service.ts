import { Wallet } from "../models";
import { paginate } from "../utils/pagination";
import { WalletResponse, PaginatedWalletsResponse, CreateWalletData, UpdateWalletData } from "../types/wallet.type";
import mongoose from "mongoose";

function formatWalletResponse(wallet: any): WalletResponse {
    return {
        id: wallet._id.toString(),
        name: wallet.name,
        balance: wallet.balance,
        user: wallet.user.toString(),
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
    };
}

// Get user wallets with pagination
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
        
        const formattedWallets = wallets.map(formatWalletResponse);
        return paginate(formattedWallets, page, pageSize, totalItems);
    } catch (error) {
        throw error;
    }
}

// Create new wallet
async function createWalletService(walletData: CreateWalletData): Promise<WalletResponse> {
    try {
        // Limit to 10 wallets per user
        const existingWalletsCount = await Wallet.countDocuments({ user: walletData.user });
        if (existingWalletsCount >= 10) {
            throw new Error('Maximum number of wallets reached');
        }
        
        const wallet = new Wallet({
            name: walletData.name,
            balance: walletData.balance || 0,
            user: new mongoose.Types.ObjectId(walletData.user),
        });
        
        const saved = await wallet.save();
        return formatWalletResponse(saved);
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
        return formatWalletResponse(updated);
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

// Get wallet by ID (optional userId: only owner can read)
async function getWalletByIdService(walletId: string, userId?: string): Promise<WalletResponse> {
    try {
        const wallet = await Wallet.findById(walletId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        if (userId && wallet.user.toString() !== userId) {
            throw new Error('Wallet not found');
        }
        return formatWalletResponse(wallet);
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