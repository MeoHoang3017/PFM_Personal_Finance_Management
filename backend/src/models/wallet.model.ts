import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    balance: {
        type: Number,
        default: 0,
    },
    currency: {
        type: String,
        default: 'USD',
        uppercase: true,
        match: [/^[A-Z]{3}$/, 'Invalid currency code (use ISO 4217, e.g. USD, VND)'],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
}, {
    timestamps: true,
    versionKey: false,
});

const Wallet = mongoose.model("Wallet", walletSchema, "wallets");

export default Wallet;