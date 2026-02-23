import { Request, Response, NextFunction } from "express";
import {
    updateExchangeRates,
    getExchangeRate,
    convertCurrency
} from "../services/exchangeRate.service";
import { SuccessResponse, ErrorResponse } from "../constants/Response";
import { sendResponse } from "../utils/response";
import { createError } from "../middleware/error.middleware";

/**
 * Update Exchange Rates (Manual trigger)
 */
export const updateRates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const baseCurrency = (req.query.baseCurrency as string) || req.body.baseCurrency || 'USD';
        
        const result = await updateExchangeRates(baseCurrency);
        
        if (result.success) {
            sendResponse(res, SuccessResponse.CUSTOM(200, result.message, { savedCount: result.savedCount }));
        } else {
            sendResponse(res, ErrorResponse.BAD_REQUEST_MSG(result.message));
        }
    } catch (error: any) {
        next(createError(error.message || 'Failed to update exchange rates', 500));
    }
};

/**
 * Get Exchange Rate
 */
export const getRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { baseCurrency, targetCurrency } = req.query;
        const date = req.query.date ? new Date(req.query.date as string) : undefined;

        if (!baseCurrency || !targetCurrency) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['baseCurrency', 'targetCurrency']));
            return;
        }

        const rate = await getExchangeRate(
            baseCurrency as string,
            targetCurrency as string,
            date
        );

        if (rate === null) {
            sendResponse(res, ErrorResponse.NOT_FOUND('Exchange rate'));
            return;
        }

        sendResponse(res, SuccessResponse.ITEM('Exchange rate', {
            baseCurrency,
            targetCurrency,
            rate,
            date: date || new Date(),
        }));
    } catch (error: any) {
        next(createError(error.message || 'Failed to get exchange rate', 500));
    }
};

/**
 * Convert Currency
 */
export const convert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { amount, fromCurrency, toCurrency, date } = req.body;

        if (!amount || !fromCurrency || !toCurrency) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['amount', 'fromCurrency', 'toCurrency']));
            return;
        }

        const convertedAmount = await convertCurrency(
            amount,
            fromCurrency,
            toCurrency,
            date ? new Date(date) : undefined
        );

        if (convertedAmount === null) {
            sendResponse(res, ErrorResponse.NOT_FOUND('Exchange rate for conversion'));
            return;
        }

        sendResponse(res, SuccessResponse.ITEM('Currency conversion', {
            amount,
            fromCurrency,
            toCurrency,
            convertedAmount,
            date: date || new Date(),
        }));
    } catch (error: any) {
        next(createError(error.message || 'Failed to convert currency', 500));
    }
};

