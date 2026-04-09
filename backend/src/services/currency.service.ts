import Currency from "../models/currency.model";
import { paginate } from "../utils/pagination";
import { CurrencyResponse, PaginatedCurrenciesResponse } from "../types/currency.type";

function formatCurrencyResponse(currency: any): CurrencyResponse {
    return {
        id: currency._id.toString(),
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        createdAt: currency.createdAt,
        updatedAt: currency.updatedAt,
    };
}

// Get all currencies with pagination
async function getAllCurrenciesService(
    page: number = 1,
    pageSize: number = 50
): Promise<PaginatedCurrenciesResponse> {
    try {
        const skip = (page - 1) * pageSize;
        const totalItems = await Currency.countDocuments();
        
        const currencies = await Currency.find()
            .sort({ code: 1 })
            .skip(skip)
            .limit(pageSize)
            .lean();
        
        const formattedCurrencies = currencies.map(formatCurrencyResponse);
        return paginate(formattedCurrencies, page, pageSize, totalItems);
    } catch (error) {
        throw error;
    }
}

// Get currency by code
async function getCurrencyByCodeService(code: string): Promise<CurrencyResponse | null> {
    try {
        const currency = await Currency.findOne({ code: code.toUpperCase() });
        if (!currency) {
            return null;
        }
        return formatCurrencyResponse(currency);
    } catch (error) {
        throw error;
    }
}

// Get currency by ID
async function getCurrencyByIdService(currencyId: string): Promise<CurrencyResponse | null> {
    try {
        const currency = await Currency.findById(currencyId);
        if (!currency) {
            return null;
        }
        return formatCurrencyResponse(currency);
    } catch (error) {
        throw error;
    }
}

export {
    getAllCurrenciesService,
    getCurrencyByCodeService,
    getCurrencyByIdService
};

