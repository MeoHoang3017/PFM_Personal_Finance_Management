import axios from "axios";
import ExchangeRate from "../models/exchangeRate.model";
import Currency from "../models/currency.model";
import mongoose from "mongoose";

/** Response from other providers (Fixer, CurrencyLayer, legacy v4). */
interface ExchangeRateApiResponse {
    success?: boolean;
    base?: string;
    date?: string;
    rates?: { [key: string]: number };
    error?: { code: number; message: string };
}

/** ExchangeRate-API v6 response: https://v6.exchangerate-api.com/v6/{API_KEY}/latest/USD */
interface ExchangeRateApiV6Response {
    result: "success" | "error";
    "error-type"?: string;
    base_code?: string;
    conversion_rates?: { [key: string]: number };
}

/**
 * Fetch exchange rates from API
 * Supports multiple APIs: exchangerate-api.com, fixer.io, etc.
 */
async function fetchExchangeRates(baseCurrency: string = 'USD'): Promise<{ [key: string]: number } | null> {
    try {
        const apiKey = process.env.EXCHANGE_RATE_API_KEY;
        const apiProvider = process.env.EXCHANGE_RATE_API_PROVIDER || 'exchangerate-api';

        let rates: { [key: string]: number } | null = null;

        switch (apiProvider.toLowerCase()) {
            case 'exchangerate-api':
            case 'exchangerate-api.com':
                // ExchangeRate-API v6: https://v6.exchangerate-api.com/v6/{API_KEY}/latest/USD
                if (!apiKey || apiKey.trim() === '') {
                    throw new Error('EXCHANGE_RATE_API_KEY is required for ExchangeRate-API v6. Get a free key at https://www.exchangerate-api.com/');
                }
                const url = `https://v6.exchangerate-api.com/v6/${apiKey.trim()}/latest/${baseCurrency}`;
                const response = await axios.get<ExchangeRateApiV6Response>(url, { timeout: 10000 });
                const data = response.data;
                if (data.result === 'error') {
                    const errType = data['error-type'] || 'unknown';
                    throw new Error(`ExchangeRate-API v6 error: ${errType}`);
                }
                if (data.conversion_rates && typeof data.conversion_rates === 'object') {
                    rates = data.conversion_rates;
                } else {
                    throw new Error('No conversion_rates in response from ExchangeRate-API v6');
                }
                break;

            case 'fixer':
            case 'fixer.io':
                // Fixer.io API (requires API key)
                if (!apiKey) {
                    throw new Error('EXCHANGE_RATE_API_KEY is required for Fixer.io');
                }
                
                const fixerResponse = await axios.get<ExchangeRateApiResponse>(
                    `https://data.fixer.io/api/latest?access_key=${apiKey}&base=${baseCurrency}`,
                    {
                        timeout: 10000,
                    }
                );
                
                if (fixerResponse.data.success && fixerResponse.data.rates) {
                    rates = fixerResponse.data.rates;
                } else {
                    throw new Error(fixerResponse.data.error?.message || 'Failed to fetch rates from Fixer.io');
                }
                break;

            case 'currencylayer':
            case 'currencylayer.com':
                // CurrencyLayer API (requires API key)
                if (!apiKey) {
                    throw new Error('EXCHANGE_RATE_API_KEY is required for CurrencyLayer');
                }
                
                const currencyLayerResponse = await axios.get<ExchangeRateApiResponse>(
                    `https://api.currencylayer.com/live?access_key=${apiKey}&source=${baseCurrency}`,
                    {
                        timeout: 10000,
                    }
                );
                
                if (currencyLayerResponse.data.success && currencyLayerResponse.data.rates) {
                    rates = currencyLayerResponse.data.rates;
                } else {
                    throw new Error('Failed to fetch rates from CurrencyLayer');
                }
                break;

            default:
                throw new Error(`Unsupported API provider: ${apiProvider}`);
        }

        return rates;
    } catch (error: any) {
        console.error('Error fetching exchange rates:', error.message);
        throw error;
    }
}

/**
 * Get all currencies from database
 */
async function getAllCurrencies(): Promise<string[]> {
    try {
        const currencies = await Currency.find().select('code').lean();
        return currencies.map(c => c.code);
    } catch (error: any) {
        console.error('Error fetching currencies:', error.message);
        throw error;
    }
}

/**
 * Ensure all currency codes exist in DB. Throws if any code is not supported.
 */
async function validateCurrencyCodes(codes: string[]): Promise<void> {
    const normalized = codes.map(c => c.toUpperCase()).filter(c => /^[A-Z]{3}$/.test(c));
    const found = await Currency.find({ code: { $in: normalized } }).select('code').lean();
    const foundSet = new Set(found.map(c => c.code));
    const missing = normalized.filter(code => !foundSet.has(code));
    if (missing.length > 0) {
        throw new Error(`Currency ${missing[0]} is not supported`);
    }
}

/**
 * Get decimal places for a currency (for rounding). Default 2.
 */
async function getDecimalPlacesForCurrency(code: string): Promise<number> {
    const doc = await Currency.findOne({ code: code.toUpperCase() }).select('decimalPlaces').lean();
    if (doc && typeof (doc as any).decimalPlaces === 'number') return (doc as any).decimalPlaces;
    return 2;
}

/**
 * Save exchange rates to database
 */
async function saveExchangeRates(
    baseCurrency: string,
    rates: { [key: string]: number },
    date: Date = new Date()
): Promise<number> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        let savedCount = 0;
        const baseU = baseCurrency.toUpperCase();
        // Normalize to start of day (create new date to avoid mutating original)
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        for (const [rawKey, rate] of Object.entries(rates)) {
            if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) continue;

            /**
             * Normalize target currency code:
             * - exchangerate-api/fixer: key is "VND", "EUR"...
             * - currencylayer: key is usually "USDVND", "USDEUR"... (base+target)
             */
            let targetU = rawKey.toUpperCase().trim();
            if (/^[A-Z]{6}$/.test(targetU) && targetU.startsWith(baseU)) {
                targetU = targetU.substring(3);
            }

            // Skip if same currency
            if (targetU === baseU) continue;

            // Validate currency code format (must be 3 letters after normalization)
            if (!/^[A-Z]{3}$/.test(targetU)) continue;

            try {
                await ExchangeRate.findOneAndUpdate(
                    {
                        baseCurrency: baseU,
                        targetCurrency: targetU,
                        date: dateOnly,
                    },
                    {
                        baseCurrency: baseU,
                        targetCurrency: targetU,
                        rate,
                        date: dateOnly,
                        source: process.env.EXCHANGE_RATE_API_PROVIDER || 'exchange-rate-api',
                    },
                    {
                        upsert: true,
                        new: true,
                        session,
                    }
                );
                savedCount++;
            } catch (error: any) {
                // Log but continue with other rates
                console.warn(`Failed to save rate for ${baseU} -> ${targetU}:`, error.message);
            }
        }

        await session.commitTransaction();
        return savedCount;
    } catch (error: any) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

/**
 * Update exchange rates for all currencies
 */
async function updateExchangeRates(baseCurrency: string = 'USD'): Promise<{ success: boolean; savedCount: number; message: string }> {
    try {
        console.log(`[Exchange Rate Update] Starting update for base currency: ${baseCurrency}`);

        // Fetch rates from API
        const rates = await fetchExchangeRates(baseCurrency);
        
        if (!rates || Object.keys(rates).length === 0) {
            throw new Error('No rates received from API');
        }

        // Save rates to database
        const savedCount = await saveExchangeRates(baseCurrency, rates);

        console.log(`[Exchange Rate Update] Successfully saved ${savedCount} exchange rates for ${baseCurrency}`);

        return {
            success: true,
            savedCount,
            message: `Successfully updated ${savedCount} exchange rates`,
        };
    } catch (error: any) {
        console.error('[Exchange Rate Update] Error:', error.message);
        return {
            success: false,
            savedCount: 0,
            message: error.message || 'Failed to update exchange rates',
        };
    }
}

/**
 * Find one rate document (exact date or latest)
 */
async function findRate(base: string, target: string, queryDate: Date): Promise<{ rate: number } | null> {
    const baseU = base.toUpperCase();
    const targetU = target.toUpperCase();

    const exact = await ExchangeRate.findOne({
        baseCurrency: baseU,
        targetCurrency: targetU,
        date: queryDate,
    })
        .sort({ date: -1 })
        .lean();

    if (exact) return { rate: exact.rate };

    const latest = await ExchangeRate.findOne({
        baseCurrency: baseU,
        targetCurrency: targetU,
    })
        .sort({ date: -1 })
        .lean();

    return latest ? { rate: latest.rate } : null;
}

/**
 * Get exchange rate for specific currencies.
 * If direct (base -> target) not stored, tries inverse (target -> base) and returns 1/rate.
 */
async function getExchangeRate(
    baseCurrency: string,
    targetCurrency: string,
    date?: Date
): Promise<number | null> {
    try {
        const queryDate = date ? new Date(date) : new Date();
        queryDate.setHours(0, 0, 0, 0);

        const baseU = baseCurrency.toUpperCase();
        const targetU = targetCurrency.toUpperCase();
        if (baseU === targetU) return 1;

        const direct = await findRate(baseU, targetU, queryDate);
        if (direct) return direct.rate;

        const inverse = await findRate(targetU, baseU, queryDate);
        if (inverse) return 1 / inverse.rate;

        return null;
    } catch (error: any) {
        console.error('Error getting exchange rate:', error.message);
        return null;
    }
}

/**
 * Convert amount from one currency to another.
 * Validates both currencies exist; rounds result to target currency's decimalPlaces.
 */
async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date?: Date
): Promise<number | null> {
    try {
        await validateCurrencyCodes([fromCurrency, toCurrency]);

        if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
            const decimals = await getDecimalPlacesForCurrency(toCurrency);
            return Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
        }

        const rate = await getExchangeRate(fromCurrency, toCurrency, date);
        if (rate === null) return null;

        const raw = amount * rate;
        const decimals = await getDecimalPlacesForCurrency(toCurrency);
        return Math.round(raw * Math.pow(10, decimals)) / Math.pow(10, decimals);
    } catch (error: any) {
        if (error.message?.includes('not supported')) throw error;
        console.error('Error converting currency:', error.message);
        return null;
    }
}

export {
    fetchExchangeRates,
    saveExchangeRates,
    updateExchangeRates,
    getExchangeRate,
    convertCurrency,
    getAllCurrencies,
    validateCurrencyCodes,
};

