import { Router } from "express";
import {
    getUserList,
    getUserById,
    getProfile,
    updateUserSettings,
    updateProfile,
    deleteUser,
    searchUsers,
    changePassword
} from "../controllers/user.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/settings', updateUserSettings);
router.put('/change-password', changePassword);
router.delete('/profile', deleteUser);

// User management routes (can add admin check later)
router.get('/list', getUserList);
router.get('/search', searchUsers);
router.get('/:id', getUserById);

export default router;

