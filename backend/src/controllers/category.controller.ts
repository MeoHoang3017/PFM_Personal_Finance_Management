import { Request, Response, NextFunction } from "express";
import {
    listCategories,
    listCategoriesByUser,
    createCategory,
    getCategoryById as getCategoryByIdService,
    updateCategory,
    deleteCategory
} from "../services/category.service";
import { SuccessResponse, ErrorResponse } from "../constants/Response";
import { sendResponse } from "../utils/response";
import { createError } from "../middleware/error.middleware";

/**
 * List Categories
 */
export const listCategoriesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        const type = req.query.type as string;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        const filter: any = {};
        if (userId) filter.user = userId;
        if (type) filter.type = type;

        const result = await listCategories(filter, page, pageSize);
        sendResponse(res, SuccessResponse.LIST('Categories', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to fetch categories', 500));
    }
};

/**
 * List Categories by User
 */
export const listCategoriesByUserController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        const result = await listCategoriesByUser(userId, page, pageSize);
        sendResponse(res, SuccessResponse.LIST('Categories', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to fetch categories', 500));
    }
};

/**
 * Get Category by ID
 */
export const getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await getCategoryByIdService(id);
        
        if (!result) {
            sendResponse(res, ErrorResponse.NOT_FOUND('Category'));
            return;
        }

        sendResponse(res, SuccessResponse.ITEM('Category', result));
    } catch (error: any) {
        next(createError(error.message || 'Category not found', 404));
    }
};

/**
 * Create Category
 */
export const createCategoryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { name, type, parentCategory, icon, color } = req.body;

        if (!name || !type) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['name', 'type']));
            return;
        }

        const result = await createCategory({
            name,
            type,
            parentCategory,
            user: userId,
            icon,
            color
        });

        sendResponse(res, SuccessResponse.CREATED('Category', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to create category', 400));
    }
};

/**
 * Update Category
 */
export const updateCategoryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, type, parentCategory, icon, color } = req.body;

        const result = await updateCategory(id, { name, type, parentCategory, icon, color });
        
        if (!result) {
            sendResponse(res, ErrorResponse.NOT_FOUND('Category'));
            return;
        }

        sendResponse(res, SuccessResponse.UPDATED('Category', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to update category', 400));
    }
};

/**
 * Delete Category
 */
export const deleteCategoryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await deleteCategory(id);
        
        if (!result.deleted) {
            sendResponse(res, ErrorResponse.NOT_FOUND('Category'));
            return;
        }

        sendResponse(res, SuccessResponse.DELETED('Category'));
    } catch (error: any) {
        next(createError(error.message || 'Failed to delete category', 500));
    }
};

