import { Router } from "express";
import {
    listCategoriesController,
    listCategoriesByUserController,
    getCategoryById,
    createCategoryController,
    updateCategoryController,
    deleteCategoryController
} from "../controllers/category.controller";
import { authenticateJWT, optionalAuth } from "../middleware/auth.middleware";

const router = Router();

// Public routes (can view categories)
router.get('/', optionalAuth, listCategoriesController);
router.get('/:id', optionalAuth, getCategoryById);

// Protected routes (create/update/delete require auth)
router.use(authenticateJWT);
router.get('/user/list', listCategoriesByUserController);
router.post('/', createCategoryController);
router.put('/:id', updateCategoryController);
router.delete('/:id', deleteCategoryController);

export default router;

