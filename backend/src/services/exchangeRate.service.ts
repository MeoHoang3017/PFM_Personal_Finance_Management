import axios from "axios";
import ExchangeRate from "../models/exchangeRate.model";
import Currency from "../models/currency.model";
import mongoose from "mongoose";

interface ExchangeRateApiResponse {
    success?: boolean;
    base?: string;
    date?: string;
    rates?: { [key: string]: number };
    error?: {
        code: number;
        message: string;
    };
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
                // exchangerate-api.com (free tier available, no API key required)
                const response = await axios.get<ExchangeRateApiResponse>(
                    `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`,
                    {
                        timeout: 10000,
                    }
                );
                
                if (response.data.rates) {
                    rates = response.data.rates;
                } else {
                    throw new Error('No rates received from exchangerate-api.com');
                }
                break;

            case 'fixer':
            case 'fixer.io':
                // Fixer.io API (requires API key)
                if (!apiKey) {
                    throw new Error('EXCHANGE_RATE_API_KEY is required for Fixer.io');
                }
                
                const fixerResponse = await axios.get<ExchangeRateApiResponse>(
                    `http://data.fixer.io/api/latest?access_key=${apiKey}&base=${baseCurrency}`,
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
                    `http://api.currencylayer.com/live?access_key=${apiKey}&source=${baseCurrency}`,
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
        // Normalize to start of day (create new date to avoid mutating original)
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        for (const [targetCurrency, rate] of Object.entries(rates)) {
            // Skip if same currency
            if (targetCurrency === baseCurrency) continue;

            // Validate currency code format
            if (!/^[A-Z]{3}$/.test(targetCurrency)) continue;

            try {
                await ExchangeRate.findOneAndUpdate(
                    {
                        baseCurrency,
                        targetCurrency,
                        date: dateOnly,
                    },
                    {
                        baseCurrency,
                        targetCurrency,
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
                console.warn(`Failed to save rate for ${baseCurrency} -> ${targetCurrency}:`, error.message);
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
 * Get exchange rate for specific currencies
 */
async function getExchangeRate(
    baseCurrency: string,
    targetCurrency: string,
    date?: Date
): Promise<number | null> {
    try {
        // Normalize to start of day
        const queryDate = date ? new Date(date) : new Date();
        queryDate.setHours(0, 0, 0, 0);
        
        const rate = await ExchangeRate.findOne({
            baseCurrency: baseCurrency.toUpperCase(),
            targetCurrency: targetCurrency.toUpperCase(),
            date: queryDate,
        })
        .sort({ date: -1 })
        .lean();

        if (rate) {
            return rate.rate;
        }

        // If not found for today, try to get latest available
        const latestRate = await ExchangeRate.findOne({
            baseCurrency: baseCurrency.toUpperCase(),
            targetCurrency: targetCurrency.toUpperCase(),
        })
        .sort({ date: -1 })
        .lean();

        return latestRate ? latestRate.rate : null;
    } catch (error: any) {
        console.error('Error getting exchange rate:', error.message);
        return null;
    }
}

/**
 * Convert amount from one currency to another
 */
async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date?: Date
): Promise<number | null> {
    try {
        if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
            return amount;
        }

        const rate = await getExchangeRate(fromCurrency, toCurrency, date);
        
        if (rate === null) {
            return null;
        }

        return amount * rate;
    } catch (error: any) {
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
};

