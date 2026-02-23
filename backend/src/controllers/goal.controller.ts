import { Request, Response, NextFunction } from "express";
import {
    getUserGoalsService,
    getGoalByIdService,
    createGoalService,
    updateGoalService,
    deleteGoalService
} from "../services/goal.service";
import { SuccessResponse, ErrorResponse } from "../constants/Response";
import { sendResponse } from "../utils/response";
import { createError } from "../middleware/error.middleware";

/**
 * Get User Goals
 */
export const getUserGoals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        const result = await getUserGoalsService(userId, page, pageSize);
        sendResponse(res, SuccessResponse.LIST('Goals', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to fetch goals', 500));
    }
};

/**
 * Get Goal by ID
 */
export const getGoalById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await getGoalByIdService(id);
        sendResponse(res, SuccessResponse.ITEM('Goal', result));
    } catch (error: any) {
        next(createError(error.message || 'Goal not found', 404));
    }
};

/**
 * Create Goal
 */
export const createGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const { title, targetAmount, currentAmount, dueDate } = req.body;

        if (!title || !targetAmount || !dueDate) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['title', 'targetAmount', 'dueDate']));
            return;
        }

        const result = await createGoalService({
            title,
            targetAmount,
            currentAmount,
            dueDate: new Date(dueDate),
            user: userId
        });

        sendResponse(res, SuccessResponse.CREATED('Goal', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to create goal', 400));
    }
};

/**
 * Update Goal
 */
export const updateGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, targetAmount, currentAmount, dueDate } = req.body;

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (targetAmount !== undefined) updateData.targetAmount = targetAmount;
        if (currentAmount !== undefined) updateData.currentAmount = currentAmount;
        if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

        const result = await updateGoalService(id, updateData);
        sendResponse(res, SuccessResponse.UPDATED('Goal', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to update goal', 400));
    }
};

/**
 * Delete Goal
 */
export const deleteGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        await deleteGoalService(id);
        sendResponse(res, SuccessResponse.DELETED('Goal'));
    } catch (error: any) {
        next(createError(error.message || 'Failed to delete goal', 500));
    }
};

