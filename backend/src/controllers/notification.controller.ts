import { Request, Response, NextFunction } from "express";
import {
    getUserNotificationsService,
    getUnreadNotificationsCountService,
    getNotificationByIdService,
    createNotificationService,
    markNotificationAsReadService,
    markAllNotificationsAsReadService,
    deleteNotificationService,
    deleteAllReadNotificationsService
} from "../services/notification.service";
import { SuccessResponse, ErrorResponse } from "../constants/Response";
import { sendResponse } from "../utils/response";
import { createError } from "../middleware/error.middleware";

/**
 * Get User Notifications
 */
export const getUserNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const { type, isRead } = req.query;

        const filter: any = { user: userId };
        if (type) filter.type = type;
        if (isRead !== undefined) filter.isRead = isRead === 'true';

        const result = await getUserNotificationsService(filter, page, pageSize);
        sendResponse(res, SuccessResponse.LIST('Notifications', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to fetch notifications', 500));
    }
};

/**
 * Get Unread Notifications Count
 */
export const getUnreadNotificationsCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const count = await getUnreadNotificationsCountService(userId);
        sendResponse(res, SuccessResponse.CUSTOM(200, 'Unread notifications count', { count }));
    } catch (error: any) {
        next(createError(error.message || 'Failed to fetch unread count', 500));
    }
};

/**
 * Get Notification by ID
 */
export const getNotificationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await getNotificationByIdService(id);
        sendResponse(res, SuccessResponse.ITEM('Notification', result));
    } catch (error: any) {
        next(createError(error.message || 'Notification not found', 404));
    }
};

/**
 * Create Notification
 */
export const createNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const { title, content, type, redirectType, redirectId } = req.body;

        if (!title || !content) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['title', 'content']));
            return;
        }

        const result = await createNotificationService({
            title,
            content,
            type,
            user: userId,
            redirectType,
            redirectId
        });

        sendResponse(res, SuccessResponse.CREATED('Notification', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to create notification', 400));
    }
};

/**
 * Mark Notification as Read
 */
export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await markNotificationAsReadService(id);
        sendResponse(res, SuccessResponse.UPDATED('Notification', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to mark notification as read', 400));
    }
};

/**
 * Mark All Notifications as Read
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const result = await markAllNotificationsAsReadService(userId);
        sendResponse(res, SuccessResponse.CUSTOM(200, result.message, { count: result.count }));
    } catch (error: any) {
        next(createError(error.message || 'Failed to mark all notifications as read', 500));
    }
};

/**
 * Delete Notification
 */
export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        await deleteNotificationService(id);
        sendResponse(res, SuccessResponse.DELETED('Notification'));
    } catch (error: any) {
        next(createError(error.message || 'Failed to delete notification', 500));
    }
};

/**
 * Delete All Read Notifications
 */
export const deleteAllReadNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const result = await deleteAllReadNotificationsService(userId);
        sendResponse(res, SuccessResponse.CUSTOM(200, result.message, { count: result.count }));
    } catch (error: any) {
        next(createError(error.message || 'Failed to delete read notifications', 500));
    }
};

