import { Request, Response, NextFunction } from "express";
import {
    getAllCurrenciesService,
    getCurrencyByCodeService,
    getCurrencyByIdService
} from "../services/currency.service";
import { SuccessResponse, ErrorResponse } from "../constants/Response";
import { sendResponse } from "../utils/response";
import { createError } from "../middleware/error.middleware";

/**
 * Get All Currencies
 */
export const getAllCurrencies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 50;

        const result = await getAllCurrenciesService(page, pageSize);
        sendResponse(res, SuccessResponse.LIST('Currencies', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to fetch currencies', 500));
    }
};

/**
 * Get Currency by Code
 */
export const getCurrencyByCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { code } = req.params;
        const result = await getCurrencyByCodeService(code);
        
        if (!result) {
            sendResponse(res, ErrorResponse.NOT_FOUND('Currency'));
            return;
        }

        sendResponse(res, SuccessResponse.ITEM('Currency', result));
    } catch (error: any) {
        next(createError(error.message || 'Currency not found', 404));
    }
};

/**
 * Get Currency by ID
 */
export const getCurrencyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await getCurrencyByIdService(id);
        
        if (!result) {
            sendResponse(res, ErrorResponse.NOT_FOUND('Currency'));
            return;
        }

        sendResponse(res, SuccessResponse.ITEM('Currency', result));
    } catch (error: any) {
        next(createError(error.message || 'Currency not found', 404));
    }
};

