import { Router } from "express";
import {
    getUserNotifications,
    getUnreadNotificationsCount,
    getNotificationById,
    createNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllReadNotifications
} from "../controllers/notification.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.get('/', getUserNotifications);
router.get('/unread/count', getUnreadNotificationsCount);
router.get('/:id', getNotificationById);
router.post('/', createNotification);
router.put('/:id/read', markNotificationAsRead);
router.put('/read-all', markAllNotificationsAsRead);
router.delete('/:id', deleteNotification);
router.delete('/read/all', deleteAllReadNotifications);

export default router;

