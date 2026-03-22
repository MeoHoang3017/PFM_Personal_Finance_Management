import { Request, Response, NextFunction } from "express";
import { SuccessResponse, ErrorResponse } from "../constants/Response";
import { sendResponse } from "../utils/response";
import { createError } from "../middleware/error.middleware";
import { getDashboardSummaryService } from "../services/dashboard.service";

export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }
        const result = await getDashboardSummaryService(userId);
        sendResponse(res, SuccessResponse.OK("Dashboard summary", result));
    } catch (error: any) {
        next(createError(error.message || "Failed to load dashboard summary", 500));
    }
};
