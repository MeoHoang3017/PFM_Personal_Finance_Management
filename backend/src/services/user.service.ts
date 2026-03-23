import mongoose from 'mongoose';
import User from '../models/user.model';
import Wallet from '../models/wallet.model';
import { paginate } from '../utils/pagination';
import { hashPassword, isMatch } from '../utils/hasher';
import { UserResponse, PaginatedUsersResponse, UpdateUserSettingsData, UpdateProfileData } from '../types/user.type';
import { convertCurrency } from './exchangeRate.service';

/**
 * Khi user đổi tiền tệ ưu tiên: mỗi ví phải đổi cả `currency` lẫn `balance` đã quy đổi.
 * Trước đây chỉ updateMany({ currency }) → số dư vẫn theo đơn vị cũ (lỗi nghiêm trọng).
 */
async function syncWalletCurrenciesAndBalances(userId: mongoose.Types.ObjectId, newCurrencyCode: string): Promise<void> {
    const newCode = newCurrencyCode.trim().toUpperCase() || 'USD';
    const wallets = await Wallet.find({ user: userId });
    for (const w of wallets) {
        const oldCur = String(w.currency || 'USD').trim().toUpperCase() || 'USD';
        const oldBal = w.balance ?? 0;
        if (oldCur === newCode) {
            await Wallet.updateOne({ _id: w._id }, { $set: { currency: newCode } });
            continue;
        }
        const newBal = await convertCurrency(oldBal, oldCur, newCode, new Date());
        if (newBal === null) {
            throw new Error(
                `Cannot convert wallet "${w.name}" balance from ${oldCur} to ${newCode}. Add exchange rates (e.g. run fetch exchange rates) or try another currency.`
            );
        }
        await Wallet.updateOne({ _id: w._id }, { $set: { currency: newCode, balance: newBal } });
    }
}

// Convert user document to response format
function formatUserResponse(user: any): UserResponse {
    return {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        theme: user.theme,
        language: user.language,
        currency: user.currency,
        avatarUrl: user.avatarUrl,
        moneyFormat: user.moneyFormat || 'standard',
        dailyReminder: user.dailyReminder || false,
        reminderTime: user.reminderTime || '09:00',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

// Get all users with pagination
async function getUserListService(page: number = 1, pageSize: number = 10): Promise<PaginatedUsersResponse> {
    try {
        const skip = (page - 1) * pageSize;

        // Get total count (exclude soft deleted)
        const totalItems = await User.countDocuments({ isDeleted: false });

        // Get paginated users (exclude soft deleted)
        const users = await User.find({ isDeleted: false })
            .select('-password')
            .skip(skip)
            .limit(pageSize)
            .lean();

        const formattedUsers = users.map(formatUserResponse);

        // Apply pagination utility
        const paginatedResult = paginate(formattedUsers, page, pageSize, totalItems);

        return paginatedResult as PaginatedUsersResponse;
    } catch (error) {
        throw error;
    }
}

// Get user by ID
async function getUserByIdService(userId: string): Promise<UserResponse> {
    try {
        const user = await User.findOne({ _id: userId, isDeleted: false }).select('-password');

        if (!user) {
            throw new Error('User not found');
        }

        return formatUserResponse(user);
    } catch (error) {
        throw error;
    }
}

// Get current user profile (self)
async function getProfileService(userId: string): Promise<UserResponse> {
    try {
        const user = await User.findOne({ _id: userId, isDeleted: false }).select('-password');
        if (!user) {
            throw new Error('User not found');
        }
        return formatUserResponse(user);
    } catch (error) {
        throw error;
    }
}

// Update user settings (theme, language, currency, avatarUrl)
async function updateUserSettingsService(userId: string, data: UpdateUserSettingsData): Promise<UserResponse> {
    try {
        const user = await User.findOne({ _id: userId, isDeleted: false });

        if (!user) {
            throw new Error('User not found');
        }

        // Update allowed fields
        if (data.theme) {
            if (!['light', 'dark'].includes(data.theme)) {
                throw new Error('Invalid theme value');
            }
            user.theme = data.theme;
        }

        if (data.language) {
            user.language = data.language;
        }

        if (data.currency != null && String(data.currency).trim() !== '') {
            const code = String(data.currency).trim().toUpperCase();
            const prevCode = String(user.currency || 'USD').trim().toUpperCase() || 'USD';
            if (code !== prevCode) {
                await syncWalletCurrenciesAndBalances(user._id, code);
            }
            user.currency = code;
        }

        if (data.avatarUrl !== undefined) {
            user.avatarUrl = data.avatarUrl;
        }

        if (data.moneyFormat) {
            if (!['standard', 'compact', 'full'].includes(data.moneyFormat)) {
                throw new Error('Invalid money format value');
            }
            user.moneyFormat = data.moneyFormat;
        }

        if (data.dailyReminder !== undefined) {
            user.dailyReminder = data.dailyReminder;
        }

        if (data.reminderTime) {
            user.reminderTime = data.reminderTime;
        }

        await user.save();

        return formatUserResponse(user);
    } catch (error) {
        throw error;
    }
}

// Update user profile (self)
async function updateProfileService(userId: string, data: UpdateProfileData): Promise<UserResponse> {
    try {
        const user = await User.findById(userId).select('+password');

        if (!user) {
            throw new Error('User not found');
        }

        // Update username
        if (data.username) {
            const existingUsername = await User.findOne({
                username: data.username,
                _id: { $ne: userId }
            });
            if (existingUsername) {
                throw new Error('Username already taken');
            }
            user.username = data.username;
        }

        // Email is not editable via profile (account identifier).

        // Update password
        if (user.password && data.newPassword) {
            if (!data.currentPassword) {
                throw new Error('Current password is required to change password');
            }

            const isPasswordValid = await isMatch(data.currentPassword, user.password);
            if (!isPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            user.password = await hashPassword(data.newPassword);
        }

        // Update settings
        if (data.theme) {
            if (!['light', 'dark'].includes(data.theme)) {
                throw new Error('Invalid theme value');
            }
            user.theme = data.theme;
        }

        if (data.language) {
            user.language = data.language;
        }

        if (data.currency != null && String(data.currency).trim() !== '') {
            const code = String(data.currency).trim().toUpperCase();
            const prevCode = String(user.currency || 'USD').trim().toUpperCase() || 'USD';
            if (code !== prevCode) {
                await syncWalletCurrenciesAndBalances(user._id, code);
            }
            user.currency = code;
        }

        if (data.avatarUrl !== undefined) {
            user.avatarUrl = data.avatarUrl;
        }

        if (data.moneyFormat) {
            if (!['standard', 'compact', 'full'].includes(data.moneyFormat)) {
                throw new Error('Invalid money format value');
            }
            user.moneyFormat = data.moneyFormat;
        }

        if (data.dailyReminder !== undefined) {
            user.dailyReminder = data.dailyReminder;
        }

        if (data.reminderTime) {
            user.reminderTime = data.reminderTime;
        }

        await user.save();

        return formatUserResponse(user);
    } catch (error) {
        throw error;
    }
}

// Soft delete user
async function deleteUserService(userId: string): Promise<{ message: string }> {
    try {
        const user = await User.findOne({ _id: userId, isDeleted: false });

        if (!user) {
            throw new Error('User not found');
        }

        user.isDeleted = true;
        user.deletedAt = new Date();
        await user.save();

        return {
            message: 'User deleted successfully',
        };
    } catch (error) {
        throw error;
    }
}

// Search users with pagination
async function searchUsersService(query: string, page: number = 1, pageSize: number = 10): Promise<PaginatedUsersResponse> {
    try {
        const skip = (page - 1) * pageSize;

        // Search in username and email (exclude soft deleted)
        const searchRegex = { $regex: query, $options: 'i' };
        const totalItems = await User.countDocuments({
            $or: [
                { username: searchRegex },
                { email: searchRegex }
            ],
            isDeleted: false
        });

        // Get paginated results (exclude soft deleted)
        const users = await User.find({
            $or: [
                { username: searchRegex },
                { email: searchRegex }
            ],
            isDeleted: false
        })
            .select('-password')
            .skip(skip)
            .limit(pageSize)
            .lean();

        const formattedUsers = users.map(formatUserResponse);

        // Apply pagination utility
        const paginatedResult = paginate(formattedUsers, page, pageSize, totalItems);

        return paginatedResult as PaginatedUsersResponse;
    } catch (error) {
        throw error;
    }
}

async function changePasswordService(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
        const user = await User.findOne({ _id: userId, isDeleted: false }).select('+password');
        if (!user) {
            throw new Error('User not found');
        }
        if(user.googleId){
            throw new Error('Password change not allowed for Google authenticated users');
        }

        const isPasswordValid = await isMatch(currentPassword, user.password!);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        user.password = await hashPassword(newPassword);
        await user.save();
        return {
            message: 'Password changed successfully',
        };
    } catch (error) {
        throw error;
    }    
}

export {
    getUserListService,
    getUserByIdService,
    getProfileService,
    updateUserSettingsService,
    updateProfileService,
    deleteUserService,
    searchUsersService,
    changePasswordService
};