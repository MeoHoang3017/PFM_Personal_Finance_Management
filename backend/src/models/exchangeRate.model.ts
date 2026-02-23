import mongoose from "mongoose";

const exchangeRateSchema = new mongoose.Schema({
    baseCurrency: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{3}$/, 'Invalid currency code format'],
    },
    targetCurrency: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{3}$/, 'Invalid currency code format'],
    },
    rate: {
        type: Number,
        required: true,
        min: 0,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    source: {
        type: String,
        default: 'exchange-rate-api',
    },
}, {
    timestamps: true,
    versionKey: false,
});

// Index for efficient queries
exchangeRateSchema.index({ baseCurrency: 1, targetCurrency: 1, date: -1 });
exchangeRateSchema.index({ date: -1 });

// Compound unique index to prevent duplicate rates for same day
exchangeRateSchema.index({ baseCurrency: 1, targetCurrency: 1, date: 1 }, { unique: true });

const ExchangeRate = mongoose.model("ExchangeRate", exchangeRateSchema, "exchange_rates");

export default ExchangeRate;

