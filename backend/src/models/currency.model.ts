import mongoose from "mongoose";
const currencySchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{3}$/, 'Invalid currency code format'],
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    symbol: {
        type: String,
        required: true,
        trim: true,
    },
    decimalPlaces: {
        type: Number,
        default: 2,
        min: 0,
        max: 8,
    },
}, {
    timestamps: true,
    versionKey: false,
});

const Currency = mongoose.model("Currency", currencySchema, "currencies");

export default Currency;