import { Request, Response, NextFunction } from "express";
import {
    getUserBudgetsService,
    getBudgetByIdService,
    createBudgetService,
    updateBudgetService,
    deleteBudgetService,
} from "../services/budget.service";
import { SuccessResponse, ErrorResponse } from "../constants/Response";
import { sendResponse } from "../utils/response";
import { createError } from "../middleware/error.middleware";

const ALLOWED_PERIODS = ["weekly", "monthly", "yearly", "custom"] as const;

/**
 * Get User Budgets
 */
export const getUserBudgets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const { category, period, isActive } = req.query;

        const filter: any = { user: userId };
        if (category) filter.category = category;
        if (period) filter.period = period;
        if (isActive !== undefined) filter.isActive = isActive === "true";

        const result = await getUserBudgetsService(filter, page, pageSize);
        sendResponse(res, SuccessResponse.LIST("Budgets", result));
    } catch (error: any) {
        next(createError(error.message || "Failed to fetch budgets", 500));
    }
};

/**
 * Get Budget by ID
 */
export const getBudgetById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await getBudgetByIdService(id as string);
        sendResponse(res, SuccessResponse.ITEM("Budget", result));
    } catch (error: any) {
        next(createError(error.message || "Budget not found", 404));
    }
};

/**
 * Create Budget
 */
export const createBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const { amount, category, period, startDate, endDate, isActive, currency } = req.body;

        if (amount === undefined || amount === null || !category || !period) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(["amount", "category", "period"]));
            return;
        }

        if (!ALLOWED_PERIODS.includes(period)) {
            sendResponse(res, ErrorResponse.BAD_REQUEST_MSG("period must be weekly, monthly, yearly, or custom"));
            return;
        }

        if (period === "custom") {
            if (!startDate || !endDate) {
                sendResponse(res, ErrorResponse.MISSING_FIELDS(["startDate", "endDate"]));
                return;
            }
        }

        const result = await createBudgetService({
            amount,
            category,
            period,
            currency,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            user: userId,
            isActive,
        });

        sendResponse(res, SuccessResponse.CREATED("Budget", result));
    } catch (error: any) {
        next(createError(error.message || "Failed to create budget", 400));
    }
};

/**
 * Update Budget
 */
export const updateBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { amount, category, period, startDate, endDate, isActive, currency } = req.body;

        const updateData: any = {};
        if (amount !== undefined) updateData.amount = amount;
        if (category !== undefined) updateData.category = category;
        if (currency !== undefined) updateData.currency = currency;
        if (period !== undefined) {
            if (!ALLOWED_PERIODS.includes(period)) {
                sendResponse(res, ErrorResponse.BAD_REQUEST_MSG("period must be weekly, monthly, yearly, or custom"));
                return;
            }
            updateData.period = period;
        }
        if (startDate !== undefined) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = new Date(endDate);
        if (isActive !== undefined) updateData.isActive = isActive;

        if (!id) {
            sendResponse(res, ErrorResponse.BAD_REQUEST_MSG("Budget ID is required"));
            return;
        }
        const result = await updateBudgetService(id as string, updateData);
        sendResponse(res, SuccessResponse.UPDATED("Budget", result));
    } catch (error: any) {
        next(createError(error.message || "Failed to update budget", 400));
    }
};

/**
 * Delete Budget
 */
export const deleteBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        if (!id) {
            sendResponse(res, ErrorResponse.BAD_REQUEST_MSG("Budget ID is required"));
            return;
        }
        await deleteBudgetService(id as string);
        sendResponse(res, SuccessResponse.DELETED("Budget"));
    } catch (error: any) {
        next(createError(error.message || "Failed to delete budget", 500));
    }
};
