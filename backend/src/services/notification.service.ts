import Notification from "../models/notification.model";
import { paginate } from "../utils/pagination";
import { NotificationResponse, PaginatedNotificationsResponse, CreateNotificationData, NotificationFilter } from "../types/notification.type";
import mongoose from "mongoose";

function formatNotificationResponse(notification: any): NotificationResponse {
    return {
        id: notification._id.toString(),
        title: notification.title,
        content: notification.content,
        type: notification.type,
        user: notification.user.toString(),
        isRead: notification.isRead,
        readAt: notification.readAt,
        redirectType: notification.redirectType,
        redirectId: notification.redirectId ? notification.redirectId.toString() : null,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
    };
}

// Get user notifications with pagination and filters
async function getUserNotificationsService(
    filter: NotificationFilter,
    page: number = 1,
    pageSize: number = 10
): Promise<PaginatedNotificationsResponse> {
    try {
        const skip = (page - 1) * pageSize;
        const query: any = { user: filter.user };
        
        if (filter.type) query.type = filter.type;
        if (filter.isRead !== undefined) query.isRead = filter.isRead;
        
        const totalItems = await Notification.countDocuments(query);
        
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();
        
        const formattedNotifications = notifications.map(formatNotificationResponse);
        return paginate(formattedNotifications, page, pageSize, totalItems);
    } catch (error) {
        throw error;
    }
}

// Get unread notifications count
async function getUnreadNotificationsCountService(userId: string): Promise<number> {
    try {
        return await Notification.countDocuments({
            user: userId,
            isRead: false,
        });
    } catch (error) {
        throw error;
    }
}

// Get notification by ID
async function getNotificationByIdService(notificationId: string): Promise<NotificationResponse> {
    try {
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            throw new Error('Notification not found');
        }
        return formatNotificationResponse(notification);
    } catch (error) {
        throw error;
    }
}

// Create new notification
async function createNotificationService(data: CreateNotificationData): Promise<NotificationResponse> {
    try {
        const notification = new Notification({
            title: data.title,
            content: data.content,
            type: data.type || 'info',
            user: new mongoose.Types.ObjectId(data.user),
            isRead: false,
            readAt: null,
            redirectType: data.redirectType || 'none',
            redirectId: data.redirectId ? new mongoose.Types.ObjectId(data.redirectId) : null,
        });
        
        const saved = await notification.save();
        return formatNotificationResponse(saved);
    } catch (error) {
        throw error;
    }
}

// Mark notification as read
async function markNotificationAsReadService(notificationId: string): Promise<NotificationResponse> {
    try {
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            {
                isRead: true,
                readAt: new Date(),
            },
            { new: true }
        );
        
        if (!notification) {
            throw new Error('Notification not found');
        }
        
        return formatNotificationResponse(notification);
    } catch (error) {
        throw error;
    }
}

// Mark all notifications as read for user
async function markAllNotificationsAsReadService(userId: string): Promise<{ message: string; count: number }> {
    try {
        const result = await Notification.updateMany(
            { user: userId, isRead: false },
            {
                isRead: true,
                readAt: new Date(),
            }
        );
        
        return {
            message: 'All notifications marked as read',
            count: result.modifiedCount,
        };
    } catch (error) {
        throw error;
    }
}

// Delete notification
async function deleteNotificationService(notificationId: string): Promise<{ message: string }> {
    try {
        const notification = await Notification.findByIdAndDelete(notificationId);
        if (!notification) {
            throw new Error('Notification not found');
        }
        return { message: 'Notification deleted successfully' };
    } catch (error) {
        throw error;
    }
}

// Delete all read notifications for user
async function deleteAllReadNotificationsService(userId: string): Promise<{ message: string; count: number }> {
    try {
        const result = await Notification.deleteMany({
            user: userId,
            isRead: true,
        });
        
        return {
            message: 'All read notifications deleted',
            count: result.deletedCount || 0,
        };
    } catch (error) {
        throw error;
    }
}

export {
    getUserNotificationsService,
    getUnreadNotificationsCountService,
    getNotificationByIdService,
    createNotificationService,
    markNotificationAsReadService,
    markAllNotificationsAsReadService,
    deleteNotificationService,
    deleteAllReadNotificationsService
};

