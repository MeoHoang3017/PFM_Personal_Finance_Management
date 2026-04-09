import { Request, Response, NextFunction } from "express";
import {
    getTutorialByUserService,
    upsertTutorialService,
    completeTutorialStepService,
    completeTutorialService,
    resetTutorialService
} from "../services/tutorial.service";
import { SuccessResponse, ErrorResponse } from "../constants/Response";
import { sendResponse } from "../utils/response";
import { createError } from "../middleware/error.middleware";

/**
 * Get Tutorial by User
 */
export const getTutorialByUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const result = await getTutorialByUserService(userId);
        
        if (!result) {
            sendResponse(res, ErrorResponse.NOT_FOUND('Tutorial'));
            return;
        }

        sendResponse(res, SuccessResponse.ITEM('Tutorial', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to fetch tutorial', 500));
    }
};

/**
 * Upsert Tutorial
 */
export const upsertTutorial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const { isCompleted, completedSteps, lastViewedAt } = req.body;

        const result = await upsertTutorialService(userId, {
            isCompleted,
            completedSteps,
            lastViewedAt: lastViewedAt ? new Date(lastViewedAt) : undefined
        });

        sendResponse(res, SuccessResponse.UPDATED('Tutorial', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to update tutorial', 400));
    }
};

/**
 * Complete Tutorial Step
 */
export const completeTutorialStep = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const { stepId } = req.body;

        if (!stepId) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['stepId']));
            return;
        }

        const result = await completeTutorialStepService(userId, stepId);
        sendResponse(res, SuccessResponse.UPDATED('Tutorial step', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to complete tutorial step', 400));
    }
};

/**
 * Complete Tutorial
 */
export const completeTutorial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const result = await completeTutorialService(userId);
        sendResponse(res, SuccessResponse.UPDATED('Tutorial', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to complete tutorial', 400));
    }
};

/**
 * Reset Tutorial
 */
export const resetTutorial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const result = await resetTutorialService(userId);
        sendResponse(res, SuccessResponse.UPDATED('Tutorial', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to reset tutorial', 400));
    }
};

