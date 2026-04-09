import { Request, Response, NextFunction } from "express";
import {
    getUserListService,
    getUserByIdService,
    getProfileService,
    updateUserSettingsService,
    updateProfileService,
    deleteUserService,
    searchUsersService,
    changePasswordService
} from "../services/user.service";
import { SuccessResponse, ErrorResponse } from "../constants/Response";
import { sendResponse } from "../utils/response";
import { createError } from "../middleware/error.middleware";

/**
 * Get User List (Admin only - can add role check later)
 */
export const getUserList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        const result = await getUserListService(page, pageSize);
        sendResponse(res, SuccessResponse.LIST('Users', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to fetch users', 500));
    }
};

/**
 * Get User by ID
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await getUserByIdService(id);
        sendResponse(res, SuccessResponse.ITEM('User', result));
    } catch (error: any) {
        next(createError(error.message || 'User not found', 404));
    }
};

/**
 * Get Current User Profile
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const result = await getProfileService(userId);
        sendResponse(res, SuccessResponse.ITEM('Profile', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to fetch profile', 500));
    }
};

/**
 * Update User Settings
 */
export const updateUserSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const result = await updateUserSettingsService(userId, req.body);
        sendResponse(res, SuccessResponse.UPDATED('User settings', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to update settings', 400));
    }
};

/**
 * Update Profile
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const result = await updateProfileService(userId, req.body);
        sendResponse(res, SuccessResponse.UPDATED('Profile', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to update profile', 400));
    }
};

/**
 * Delete User (Soft Delete)
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        await deleteUserService(userId);
        sendResponse(res, SuccessResponse.DELETED('User'));
    } catch (error: any) {
        next(createError(error.message || 'Failed to delete user', 500));
    }
};

/**
 * Search Users
 */
export const searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const query = req.query.q as string;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        if (!query) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['q']));
            return;
        }

        const result = await searchUsersService(query, page, pageSize);
        sendResponse(res, SuccessResponse.LIST('Users', result));
    } catch (error: any) {
        next(createError(error.message || 'Search failed', 500));
    }
};

/**
 * Change Password
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['currentPassword', 'newPassword']));
            return;
        }

        const result = await changePasswordService(userId, currentPassword, newPassword);
        sendResponse(res, SuccessResponse.CUSTOM(200, result.message, null));
    } catch (error: any) {
        next(createError(error.message || 'Failed to change password', 400));
    }
};

